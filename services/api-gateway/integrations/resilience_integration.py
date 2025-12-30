"""

Resilience Integration Layer

This module integrates the resilience system with the existing Adapter Manager,
adding fallback capabilities, health monitoring, and chaos testing.

"""

import asyncio
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog

from services.api_gateway.integrations.resilience import (
    LocalQueueFallback,
    HealthCheckSystem,
    ServiceConfig,
    ChaosEngineeringSystem,
    health_checker,
    chaos_system,
    check_for_chaos
)

logger = structlog.get_logger(__name__)


class ResilientAdapterManager:
    """Enhanced Adapter Manager with resilience capabilities"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.queue_fallback = LocalQueueFallback()
        self.chaos_enabled = config.get('chaos_enabled', False)

        # Initialize health monitoring for all services
        self._setup_health_monitoring()

        # Enable chaos if configured (only in testing)
        if self.chaos_enabled:
            chaos_system.enable_chaos()
            logger.warning("Chaos engineering enabled for testing")

    def _setup_health_monitoring(self):
        """Setup health monitoring for all integrated services"""
        services_config = {
            'shopify': {
                'check_interval': 30,
                'timeout': 10,
                'health_check_url': 'https://shopify-api.com/health'
            },
            'aramex': {
                'check_interval': 60,
                'timeout': 15,
                'custom_check_function': self._check_aramex_health
            },
            'smsa': {
                'check_interval': 60,
                'timeout': 15,
                'custom_check_function': self._check_smsa_health
            },
            'unifonic': {
                'check_interval': 30,
                'timeout': 8,
                'custom_check_function': self._check_unifonic_health
            },
            'sendgrid': {
                'check_interval': 30,
                'timeout': 8,
                'health_check_url': 'https://api.sendgrid.com/v3/health'
            }
        }

        for service_name, svc_config in services_config.items():
            config = ServiceConfig(
                name=service_name,
                check_interval=svc_config['check_interval'],
                timeout=svc_config['timeout'],
                **{k: v for k, v in svc_config.items() if k not in ['check_interval', 'timeout']}
            )
            health_checker.register_service(config)

        logger.info("Health monitoring configured for all services")

    async def _check_aramex_health(self) -> tuple[bool, Optional[str]]:
        """Custom health check for Aramex"""
        try:
            # Simple connectivity check - in real implementation,
            # this would make a lightweight API call
            return True, None
        except Exception as e:
            return False, str(e)

    async def _check_smsa_health(self) -> tuple[bool, Optional[str]]:
        """Custom health check for SMSA"""
        try:
            return True, None
        except Exception as e:
            return False, str(e)

    async def _check_unifonic_health(self) -> tuple[bool, Optional[str]]:
        """Custom health check for Unifonic"""
        try:
            return True, None
        except Exception as e:
            return False, str(e)

    async def initialize_resilience(self):
        """Initialize all resilience components"""
        # Start health monitoring
        await health_checker.start_monitoring()

        # Start queue processing
        asyncio.create_task(self._process_failed_operations())

        logger.info("Resilience system initialized")

    async def _process_failed_operations(self):
        """Background task to process failed operations"""
        while True:
            try:
                # Process each queue
                queues = [
                    self.queue_fallback.order_queue,
                    self.queue_fallback.fulfillment_queue,
                    self.queue_fallback.notification_queue
                ]

                for queue in queues:
                    item = await queue.pop()
                    if item:
                        await self._retry_operation(item, queue)

                # Wait before next processing cycle
                await asyncio.sleep(30)  # Process every 30 seconds

            except Exception as e:
                logger.error("Error in queue processing", error=str(e))
                await asyncio.sleep(60)  # Wait longer on error

    async def _retry_operation(self, item, queue):
        """Retry a failed operation"""
        try:
            # Check if service is healthy
            if not health_checker.is_service_healthy(item.service_name):
                # Reschedule for later
                await self.queue_fallback.retry_scheduler.schedule_retry(item.id, 300)  # 5 minutes
                return

            # Execute retry based on operation type
            success = await self._execute_operation_retry(item)

            if success:
                await queue.complete(item.id)
                logger.info("Successfully retried operation",
                          operation=item.operation,
                          item_id=item.id,
                          service=item.service_name)
            else:
                await queue.fail(item, "Retry failed")
                logger.warning("Retry failed for operation",
                             operation=item.operation,
                             item_id=item.id,
                             service=item.service_name)

        except Exception as e:
            await queue.fail(item, str(e))
            logger.error("Error during operation retry",
                        operation=item.operation,
                        item_id=item.id,
                        error=str(e))

    async def _execute_operation_retry(self, item) -> bool:
        """Execute the actual operation retry"""
        try:
            # Import here to avoid circular imports
            from services.api_gateway.integrations import AdapterManager

            manager = AdapterManager(self.config)

            # Apply chaos if enabled
            if self.chaos_enabled:
                chaos_config = await check_for_chaos(item.service_name)
                if chaos_config:
                    await self._apply_chaos_effects(item, chaos_config)

            # Execute operation
            if item.operation == 'create_order':
                result = await manager.create_order(item.service_name, item.data)
            elif item.operation == 'get_orders':
                result = await manager.get_orders(item.service_name, **item.data.get('filters', {}))
            elif item.operation == 'create_fulfillment':
                result = await manager.create_fulfillment(item.service_name, item.data)
            elif item.operation == 'send_sms':
                result = await manager.send_sms(item.service_name, item.data)
            elif item.operation == 'send_email':
                result = await manager.send_email(item.service_name, item.data)
            else:
                logger.warning("Unknown operation for retry", operation=item.operation)
                return False

            return True

        except Exception as e:
            logger.error("Operation retry failed",
                        operation=item.operation,
                        service=item.service_name,
                        error=str(e))
            return False

    async def _apply_chaos_effects(self, item, chaos_config: Dict[str, Any]):
        """Apply chaos effects to the operation"""
        if chaos_config.get('active'):
            experiment_id = chaos_config.get('experiment_id')

            if 'delay_ms' in chaos_config:
                # Network delay
                delay_seconds = chaos_config['delay_ms'] / 1000.0
                logger.info("Applying chaos delay",
                          operation=item.operation,
                          delay=delay_seconds,
                          experiment=experiment_id)
                await asyncio.sleep(delay_seconds)

            elif 'failure_rate' in chaos_config:
                # Network failure
                failure_rate = chaos_config['failure_rate']
                if random.random() < failure_rate:
                    logger.warning("Chaos-induced failure",
                                 operation=item.operation,
                                 experiment=experiment_id)
                    raise Exception(f"Chaos failure (rate: {failure_rate})")

            elif 'crash_probability' in chaos_config:
                # Service crash
                crash_prob = chaos_config['crash_probability']
                if random.random() < crash_prob:
                    logger.warning("Chaos-induced crash",
                                 operation=item.operation,
                                 experiment=experiment_id)
                    raise Exception(f"Chaos crash (probability: {crash_prob})")

    async def execute_with_resilience(self, operation: str, service_name: str,
                                    operation_func, *args, **kwargs) -> Any:
        """Execute an operation with full resilience support"""
        start_time = time.time()

        try:
            # Check service health
            if not health_checker.is_service_healthy(service_name):
                # Queue for later retry
                await self.queue_fallback.queue_failed_operation(
                    operation=operation,
                    data={'args': args, 'kwargs': kwargs},
                    service_name=service_name,
                    error="Service unhealthy"
                )
                raise Exception(f"Service {service_name} is currently unhealthy")

            # Apply chaos if enabled
            if self.chaos_enabled:
                chaos_config = await check_for_chaos(service_name)
                if chaos_config and chaos_config.get('active'):
                    await self._apply_chaos_effects(
                        type('MockItem', (), {'operation': operation, 'service_name': service_name})(),
                        chaos_config
                    )

            # Execute operation
            result = await operation_func(*args, **kwargs)

            # Record success metric
            await health_checker.record_metric(
                service_name,
                f"{operation}_success",
                1
            )

            execution_time = time.time() - start_time
            logger.info("Operation completed successfully",
                       operation=operation,
                       service=service_name,
                       execution_time=execution_time)

            return result

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = str(e)

            # Record failure metric
            await health_checker.record_metric(
                service_name,
                f"{operation}_failure",
                1
            )

            # Queue for retry
            await self.queue_fallback.queue_failed_operation(
                operation=operation,
                data={'args': args, 'kwargs': kwargs},
                service_name=service_name,
                error=error_msg
            )

            logger.error("Operation failed, queued for retry",
                        operation=operation,
                        service=service_name,
                        error=error_msg,
                        execution_time=execution_time)

            raise

    async def get_resilience_status(self) -> Dict[str, Any]:
        """Get comprehensive resilience system status"""
        queue_status = await self.queue_fallback.get_system_status()
        health_status = health_checker.get_system_health_summary()
        chaos_status = chaos_system.get_system_status()

        return {
            'timestamp': datetime.utcnow().isoformat(),
            'queues': queue_status,
            'health': health_status,
            'chaos': chaos_status,
            'overall_status': self._calculate_overall_status(queue_status, health_status)
        }

    def _calculate_overall_status(self, queue_status: Dict, health_status: Dict) -> str:
        """Calculate overall system status"""
        # Critical if too many pending operations
        total_pending = (queue_status['total_pending'])
        if total_pending > 100:
            return "CRITICAL"

        # Warning if many pending or low health
        if total_pending > 50 or health_status['system_health_percentage'] < 80:
            return "WARNING"

        # Degraded if some issues
        if total_pending > 10 or health_status['system_health_percentage'] < 95:
            return "DEGRADED"

        # Healthy otherwise
        return "HEALTHY"

    async def emergency_drain_queues(self, service_name: Optional[str] = None):
        """Emergency: Process all pending operations for a service or all services"""
        if service_name:
            await self.queue_fallback.emergency_drain_queue(service_name)
        else:
            # Drain all services
            services = ['shopify', 'aramex', 'smsa', 'unifonic', 'sendgrid']
            for svc in services:
                await self.queue_fallback.emergency_drain_queue(svc)

        logger.info("Emergency queue drain completed", service=service_name or "all")

    async def enable_chaos_for_testing(self, service_name: str):
        """Enable chaos engineering for a specific service (testing only)"""
        if not self.chaos_enabled:
            logger.warning("Chaos engineering not enabled in configuration")
            return

        # Enable basic network delay chaos
        monkey = chaos_system.get_chaos_monkey(service_name)
        await monkey.inject_network_delay(delay_ms=500, duration_seconds=300)  # 5 minutes

        logger.warning("Chaos testing enabled", service=service_name)

    async def shutdown_resilience(self):
        """Shutdown resilience system gracefully"""
        await health_checker.stop_monitoring()
        await chaos_system.emergency_stop_all()

        logger.info("Resilience system shutdown complete")


# Global resilient adapter manager instance
resilient_manager = None


async def get_resilient_adapter_manager(config: Dict[str, Any]) -> ResilientAdapterManager:
    """Get or create the resilient adapter manager instance"""
    global resilient_manager
    if resilient_manager is None:
        resilient_manager = ResilientAdapterManager(config)
        await resilient_manager.initialize_resilience()
    return resilient_manager