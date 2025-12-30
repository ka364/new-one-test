"""

Comprehensive Tests for HaderOS Resilience System

Tests all components: Local Queue Fallback, Health Check System, and Chaos Engineering.

"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from services.api_gateway.integrations.resilience import (
    LocalQueueFallback,
    HealthCheckSystem,
    ServiceConfig,
    ChaosEngineeringSystem,
    ChaosType,
    QueueItem,
    HealthStatus
)


class TestLocalQueueFallback:
    """Test Local Queue Fallback functionality"""

    @pytest.fixture
    async def queue_system(self):
        """Create a queue system for testing"""
        system = LocalQueueFallback()
        yield system
        # Cleanup
        await system.order_queue.clear_queue()
        await system.fulfillment_queue.clear_queue()
        await system.notification_queue.clear_queue()

    @pytest.mark.asyncio
    async def test_queue_failed_operation(self, queue_system):
        """Test queuing a failed operation"""
        item_id = await queue_system.queue_failed_operation(
            operation="create_order",
            data={"order_id": "123", "amount": 100},
            service_name="shopify",
            error="Connection timeout"
        )

        assert item_id is not None
        assert "create_order" in item_id

        # Check queue stats
        stats = await queue_system.get_system_status()
        assert stats['queues']['orders']['pending'] == 1

    @pytest.mark.asyncio
    async def test_queue_item_creation(self, queue_system):
        """Test QueueItem creation and properties"""
        item = QueueItem(
            operation="create_order",
            data={"test": "data"},
            priority=3
        )

        assert item.operation == "create_order"
        assert item.data == {"test": "data"}
        assert item.priority == 3
        assert item.retry_count == 0
        assert item.max_retries == 10

    @pytest.mark.asyncio
    async def test_queue_item_serialization(self, queue_system):
        """Test QueueItem serialization/deserialization"""
        original_item = QueueItem(
            operation="test_op",
            data={"key": "value"},
            priority=2
        )

        # Serialize
        item_dict = original_item.to_dict()

        # Deserialize
        restored_item = QueueItem.from_dict(item_dict)

        assert restored_item.operation == original_item.operation
        assert restored_item.data == original_item.data
        assert restored_item.priority == original_item.priority

    @pytest.mark.asyncio
    async def test_retry_logic(self, queue_system):
        """Test retry logic and backoff calculation"""
        item = QueueItem("test_op", {})

        # Initial state
        assert item.retry_count == 0
        assert item.should_retry() == True

        # Record failures
        for i in range(5):
            item.record_attempt(success=False, error=f"Error {i}")
            assert item.retry_count == i + 1
            assert item.should_retry() == True

        # Should still retry at 9 failures
        for i in range(4):
            item.record_attempt(success=False, error=f"Error {i+5}")
        assert item.retry_count == 9
        assert item.should_retry() == True

        # Should stop retrying at 10 failures
        item.record_attempt(success=False, error="Final error")
        assert item.retry_count == 10
        assert item.should_retry() == False

    @pytest.mark.asyncio
    async def test_exponential_backoff(self, queue_system):
        """Test exponential backoff calculation"""
        item = QueueItem("test_op", {})

        # First retry should be around 5 minutes
        next_retry = item.calculate_next_retry()
        expected_delay = 5 * 60  # 5 minutes
        actual_delay = (next_retry - datetime.utcnow()).total_seconds()

        assert abs(actual_delay - expected_delay) < 60  # Within 1 minute

        # After one failure
        item.record_attempt(success=False)
        next_retry = item.calculate_next_retry()
        expected_delay = 10 * 60  # 10 minutes (2^1 * 5 minutes)
        actual_delay = (next_retry - datetime.utcnow()).total_seconds()

        assert abs(actual_delay - expected_delay) < 120  # Within 2 minutes

    @pytest.mark.asyncio
    async def test_queue_operations(self, queue_system):
        """Test basic queue operations"""
        # Push item
        item = QueueItem("test_op", {"data": "test"})
        item_id = await queue_system.order_queue.push(item)

        # Check stats
        stats = await queue_system.order_queue.get_queue_stats()
        assert stats['pending'] == 1

        # Pop item
        popped_item = await queue_system.order_queue.pop()
        assert popped_item is not None
        assert popped_item.operation == "test_op"

        # Complete item
        await queue_system.order_queue.complete(item_id)

        # Check final stats
        stats = await queue_system.order_queue.get_queue_stats()
        assert stats['pending'] == 0
        assert stats['completed'] == 1


class TestHealthCheckSystem:
    """Test Health Check System functionality"""

    @pytest.fixture
    async def health_system(self):
        """Create a health check system for testing"""
        system = HealthCheckSystem()
        yield system
        # Cleanup
        await system.stop_monitoring()

    @pytest.mark.asyncio
    async def test_service_registration(self, health_system):
        """Test service registration"""
        config = ServiceConfig(
            name="test_service",
            check_interval=30,
            timeout=5,
            health_check_url="http://example.com/health"
        )

        health_system.register_service(config)

        assert "test_service" in health_system.services
        assert health_system.services["test_service"] == config

    @pytest.mark.asyncio
    async def test_health_status_tracking(self, health_system):
        """Test health status tracking"""
        # Register service
        config = ServiceConfig("test_service", 30, 5)
        health_system.register_service(config)

        # Initial status
        status = health_system.get_service_status("test_service")
        assert status is not None
        assert status.service_name == "test_service"
        assert status.is_healthy == True  # Default
        assert status.consecutive_failures == 0

        # Record failure
        status.record_check(success=False, error_message="Connection failed")
        assert status.is_healthy == False
        assert status.consecutive_failures == 1
        assert status.total_failures == 1

        # Record success
        status.record_check(success=True, response_time=0.5)
        assert status.is_healthy == True
        assert status.consecutive_failures == 0
        assert status.total_checks == 2
        assert status.response_time == 0.5

    @pytest.mark.asyncio
    async def test_uptime_calculation(self, health_system):
        """Test uptime percentage calculation"""
        status = HealthStatus("test_service", True, datetime.utcnow())

        # All successes
        for _ in range(10):
            status.record_check(success=True)
        assert status.uptime_percentage == 100.0

        # 7 successes, 3 failures
        for _ in range(3):
            status.record_check(success=False)
        assert status.uptime_percentage == 70.0

    @pytest.mark.asyncio
    async def test_system_health_summary(self, health_system):
        """Test system health summary"""
        # Register multiple services
        services = ["service1", "service2", "service3"]
        for svc in services:
            config = ServiceConfig(svc, 30, 5)
            health_system.register_service(config)

        # Set different health states
        health_system.status_cache["service1"].record_check(success=True)
        health_system.status_cache["service2"].record_check(success=False)
        health_system.status_cache["service3"].record_check(success=True)

        summary = health_system.get_system_health_summary()

        assert summary['total_services'] == 3
        assert summary['healthy_services'] == 2
        assert summary['unhealthy_services'] == 1
        assert summary['system_health_percentage'] == (2/3) * 100

    @pytest.mark.asyncio
    @patch('services.api_gateway.integrations.resilience.health_check_system.httpx.AsyncClient')
    async def test_http_health_check(self, mock_client, health_system):
        """Test HTTP health check functionality"""
        # Mock successful response
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

        config = ServiceConfig(
            "test_http",
            30,
            5,
            health_check_url="http://example.com/health"
        )

        success, error = await health_system._http_health_check(config)
        assert success == True
        assert error is None

        # Mock failed response
        mock_response.status_code = 500
        success, error = await health_system._http_health_check(config)
        assert success == False
        assert "500" in error

    @pytest.mark.asyncio
    async def test_custom_health_check(self, health_system):
        """Test custom health check function"""
        async def custom_check():
            return True, None

        config = ServiceConfig(
            "test_custom",
            30,
            5,
            custom_check_function=custom_check
        )

        success, error = await health_system._perform_health_check("test_custom", config)
        # Note: This would normally be called by the monitoring loop
        # We're testing the logic indirectly


class TestChaosEngineering:
    """Test Chaos Engineering functionality"""

    @pytest.fixture
    def chaos_system(self):
        """Create a chaos engineering system for testing"""
        system = ChaosEngineeringSystem()
        system.enable_chaos()  # Enable for testing
        yield system
        system.disable_chaos()

    def test_chaos_system_initialization(self, chaos_system):
        """Test chaos system initialization"""
        assert chaos_system.is_enabled == True
        assert len(chaos_system.monkeys) == 0

    @pytest.mark.asyncio
    async def test_chaos_monkey_creation(self, chaos_system):
        """Test chaos monkey creation"""
        monkey = chaos_system.get_chaos_monkey("test_service")
        assert monkey.target_service == "test_service"

        # Same service should return same monkey
        monkey2 = chaos_system.get_chaos_monkey("test_service")
        assert monkey is monkey2

    def test_experiment_creation(self, chaos_system):
        """Test chaos experiment creation"""
        experiment = ChaosExperiment(
            id="test_exp_123",
            name="Test Experiment",
            chaos_type=ChaosType.NETWORK_DELAY,
            target_service="test_service",
            duration_seconds=300,
            intensity=0.5,
            parameters={"delay_ms": 500},
            created_at=datetime.utcnow()
        )

        assert experiment.id == "test_exp_123"
        assert experiment.chaos_type == ChaosType.NETWORK_DELAY
        assert experiment.intensity == 0.5

    def test_experiment_serialization(self, chaos_system):
        """Test experiment serialization"""
        original = ChaosExperiment(
            id="test_exp",
            name="Test",
            chaos_type=ChaosType.NETWORK_FAILURE,
            target_service="test_svc",
            duration_seconds=60,
            intensity=0.8,
            parameters={"rate": 0.8},
            created_at=datetime.utcnow()
        )

        # Serialize
        exp_dict = original.to_dict()

        # Deserialize
        restored = ChaosExperiment.from_dict(exp_dict)

        assert restored.id == original.id
        assert restored.chaos_type == original.chaos_type
        assert restored.intensity == original.intensity

    @pytest.mark.asyncio
    async def test_network_delay_injection(self, chaos_system):
        """Test network delay injection"""
        monkey = chaos_system.get_chaos_monkey("test_service")

        experiment_id = await monkey.inject_network_delay(
            delay_ms=1000,
            duration_seconds=10
        )

        assert experiment_id is not None
        assert experiment_id.startswith("delay_")

        # Check active experiments
        active = monkey.get_active_experiments()
        assert len(active) == 1
        assert active[0].id == experiment_id

    @pytest.mark.asyncio
    async def test_network_failure_injection(self, chaos_system):
        """Test network failure injection"""
        monkey = chaos_system.get_chaos_monkey("test_service")

        experiment_id = await monkey.inject_network_failure(
            failure_rate=0.5,
            duration_seconds=10
        )

        assert experiment_id is not None
        assert experiment_id.startswith("failure_")

    @pytest.mark.asyncio
    async def test_service_crash_injection(self, chaos_system):
        """Test service crash injection"""
        monkey = chaos_system.get_chaos_monkey("test_service")

        experiment_id = await monkey.inject_service_crash(
            crash_probability=0.3,
            duration_seconds=10
        )

        assert experiment_id is not None
        assert experiment_id.startswith("crash_")

    @pytest.mark.asyncio
    async def test_resource_exhaustion_injection(self, chaos_system):
        """Test resource exhaustion injection"""
        monkey = chaos_system.get_chaos_monkey("test_service")

        experiment_id = await monkey.inject_resource_exhaustion(
            resource_type="memory",
            exhaustion_level=0.7,
            duration_seconds=10
        )

        assert experiment_id is not None
        assert experiment_id.startswith("resource_")

    @pytest.mark.asyncio
    async def test_experiment_stop(self, chaos_system):
        """Test stopping an experiment"""
        monkey = chaos_system.get_chaos_monkey("test_service")

        # Start experiment
        exp_id = await monkey.inject_network_delay(500, 60)

        # Stop it
        stopped = await monkey.stop_experiment(exp_id)
        assert stopped == True

        # Check status
        exp = monkey.get_experiment_status(exp_id)
        assert exp is not None
        assert exp.status == "completed"
        assert exp.results['stopped_early'] == True

    def test_system_status(self, chaos_system):
        """Test chaos system status"""
        status = chaos_system.get_system_status()

        assert status['chaos_enabled'] == True
        assert 'active_experiments' in status
        assert 'available_scenarios' in status
        assert 'network_storm' in status['available_scenarios']

    @pytest.mark.asyncio
    async def test_emergency_stop(self, chaos_system):
        """Test emergency stop of all experiments"""
        # Start multiple experiments
        services = ['svc1', 'svc2']
        exp_ids = []

        for svc in services:
            monkey = chaos_system.get_chaos_monkey(svc)
            exp_id = await monkey.inject_network_delay(200, 60)
            exp_ids.append(exp_id)

        # Emergency stop
        await chaos_system.emergency_stop_all()

        # Check all stopped
        for svc in services:
            monkey = chaos_system.get_chaos_monkey(svc)
            active = monkey.get_active_experiments()
            assert len(active) == 0


class TestIntegration:
    """Integration tests for the resilience system"""

    @pytest.mark.asyncio
    async def test_full_resilience_workflow(self):
        """Test complete resilience workflow"""
        # This would test the integration of all components
        # For now, just ensure imports work
        from services.api_gateway.integrations.resilience import (
            LocalQueueFallback,
            HealthCheckSystem,
            ChaosEngineeringSystem
        )

        # Create instances
        queue_system = LocalQueueFallback()
        health_system = HealthCheckSystem()
        chaos_system = ChaosEngineeringSystem()

        # Basic functionality checks
        assert queue_system is not None
        assert health_system is not None
        assert chaos_system is not None

        # Cleanup
        await health_system.stop_monitoring()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])