#!/usr/bin/env python3

"""

Circuit Breaker Test Script

Tests the Circuit Breaker implementation with simulated failures

"""

import asyncio
import sys
import os

# Add the services directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services', 'api-gateway'))

from integrations.shipping.circuit_breaker import CircuitBreaker, CircuitBreakerConfig, CircuitBreakerOpenException


async def simulate_service_call(should_fail=False):
    """Simulate a service call that may fail"""
    if should_fail:
        raise Exception("Simulated service failure")
    return {"status": "success", "data": "test"}


async def test_basic_circuit_breaker():
    """Test basic Circuit Breaker functionality"""
    print("🧪 Testing Basic Circuit Breaker")
    print("-" * 40)

    cb = CircuitBreaker()

    # Test initial state
    status = cb.get_status()
    print(f"Initial state: {status['state']}")
    assert status['state'] == 'closed'

    # Test successful calls
    for i in range(3):
        result = await cb.call(simulate_service_call, False)
        print(f"Call {i+1}: SUCCESS")
        assert result['status'] == 'success'

    status = cb.get_status()
    print(f"After successes: {status['state']}, failures: {status['failure_count']}")

    # Test failures
    print("\nTesting failures...")
    for i in range(3):
        try:
            await cb.call(simulate_service_call, True)
        except Exception as e:
            print(f"Call {i+1}: FAILED - {e}")

    status = cb.get_status()
    print(f"After 3 failures: {status['state']}, failures: {status['failure_count']}")
    assert status['state'] == 'open'

    # Test fast fail
    print("\nTesting fast fail...")
    try:
        await cb.call(simulate_service_call, False)
        assert False, "Should have failed fast"
    except CircuitBreakerOpenException as e:
        print(f"Fast fail working: {e}")

    # Wait for recovery timeout (simulate)
    print("\nTesting recovery...")
    cb._CircuitBreaker__last_failure_time = 0  # Force reset attempt
    cb.state = cb.state.HALF_OPEN

    # Successful call in half-open
    result = await cb.call(simulate_service_call, False)
    print("Recovery call: SUCCESS")
    assert result['status'] == 'success'

    status = cb.get_status()
    print(f"After recovery: {status['state']}, successes: {status['success_count']}")

    print("✅ Basic Circuit Breaker test passed!")


async def test_aramex_circuit_breaker():
    """Test Aramex-specific Circuit Breaker"""
    print("\n🧪 Testing Aramex Circuit Breaker")
    print("-" * 40)

    from integrations.shipping.circuit_breaker import AramexCircuitBreaker

    acb = AramexCircuitBreaker()

    # Mock Aramex client
    class MockAramexClient:
        def __init__(self, fail_count=0):
            self.call_count = 0
            self.fail_count = fail_count

        def create_shipment(self, data):
            self.call_count += 1
            if self.call_count <= self.fail_count:
                raise Exception("Mock Aramex failure")
            return {"tracking_number": "123456", "status": "created"}

        def track_shipment(self, tracking):
            self.call_count += 1
            if self.call_count <= self.fail_count:
                raise Exception("Mock tracking failure")
            return {"status": "in_transit", "location": "Riyadh"}

        def get_rates(self, *args):
            self.call_count += 1
            if self.call_count <= self.fail_count:
                raise Exception("Mock rates failure")
            return [{"provider": "aramex", "cost": 50.0}]

    # Test with failing client
    mock_client = MockAramexClient(fail_count=3)
    acb.aramex_client = mock_client

    print("Testing with failing Aramex client...")

    # Should fail and open circuit
    for i in range(3):
        try:
            await acb.create_shipment(mock_client, {"test": "data"})
        except Exception as e:
            print(f"Call {i+1}: {e}")

    status = acb.get_status()
    print(f"Status after failures: {status}")
    assert status['state'] == 'open'

    # Test with working client
    mock_client = MockAramexClient(fail_count=0)
    acb.aramex_client = mock_client

    print("\nTesting recovery with working client...")

    # Should eventually recover
    acb.circuit_breaker.state = acb.circuit_breaker.state.HALF_OPEN
    acb.circuit_breaker._CircuitBreaker__last_failure_time = 0

    result = await acb.create_shipment(mock_client, {"test": "data"})
    print(f"Recovery result: {result}")
    assert result['tracking_number'] == '123456'

    status = acb.get_status()
    print(f"Final status: {status}")

    print("✅ Aramex Circuit Breaker test passed!")


async def test_monitoring():
    """Test Circuit Breaker monitoring"""
    print("\n🧪 Testing Circuit Breaker Monitoring")
    print("-" * 40)

    from integrations.shipping.circuit_breaker import get_circuit_monitor, CircuitBreaker

    monitor = get_circuit_monitor()

    # Register test breakers
    cb1 = CircuitBreaker()
    cb2 = CircuitBreaker()

    monitor.register_breaker("test_service_1", cb1)
    monitor.register_breaker("test_service_2", cb2)

    # Simulate failure on cb1
    for _ in range(5):
        try:
            await cb1.call(lambda: (_ for _ in ()).throw(Exception("test")))
        except:
            pass

    # Check status
    status = monitor.get_all_status()
    print(f"Monitor status: {status}")

    # Check alerts
    alerts = monitor.check_alerts()
    print(f"Alerts: {alerts}")

    assert len(alerts) > 0, "Should have alerts for failed breaker"
    assert alerts[0]['service'] == 'test_service_1'

    print("✅ Monitoring test passed!")


async def main():
    """Run all Circuit Breaker tests"""
    print("🔄 Circuit Breaker Comprehensive Tests")
    print("=" * 50)

    try:
        await test_basic_circuit_breaker()
        await test_aramex_circuit_breaker()
        await test_monitoring()

        print("\n" + "=" * 50)
        print("🎉 All Circuit Breaker tests passed!")
        print("Circuit Breaker is working correctly in HaderOS")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)