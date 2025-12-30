"""

Circuit Breaker Pattern Implementation for Aramex Shipping Integration

This module provides resilience for external service calls by implementing
the Circuit Breaker pattern to handle failures gracefully.

States:
- CLOSED: Normal operation, requests pass through
- OPEN: Service is failing, requests fail fast
- HALF_OPEN: Testing if service has recovered

"""

import time
import asyncio
from enum import Enum
from typing import Callable, Any, Optional
from dataclasses import dataclass
from contextlib import asynccontextmanager


class CircuitBreakerState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreakerConfig:
    """Configuration for Circuit Breaker behavior"""
    failure_threshold: int = 5  # Number of failures before opening
    recovery_timeout: float = 60.0  # Seconds to wait before trying again
    expected_exception: tuple = (Exception,)  # Exceptions that count as failures
    success_threshold: int = 3  # Successes needed to close from half-open


class CircuitBreakerOpenException(Exception):
    """Raised when circuit breaker is open"""
    pass


class CircuitBreaker:
    """Circuit Breaker implementation for external service calls"""

    def __init__(self, config: CircuitBreakerConfig = None):
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return False
        return time.time() - self.last_failure_time >= self.config.recovery_timeout

    def _record_success(self):
        """Record a successful call"""
        self.success_count += 1
        self.failure_count = 0

        # If in half-open and reached success threshold, close circuit
        if (self.state == CircuitBreakerState.HALF_OPEN and
            self.success_count >= self.config.success_threshold):
            self.state = CircuitBreakerState.CLOSED
            self.success_count = 0

    def _record_failure(self):
        """Record a failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        self.success_count = 0

        # If reached failure threshold, open circuit
        if (self.state == CircuitBreakerState.CLOSED and
            self.failure_count >= self.config.failure_threshold):
            self.state = CircuitBreakerState.OPEN

        # If in half-open, go back to open
        elif self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.OPEN

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
            else:
                raise CircuitBreakerOpenException(
                    f"Circuit breaker is OPEN. Next retry in "
                    f"{self.config.recovery_timeout - (time.time() - self.last_failure_time):.1f}s"
                )

        try:
            result = await func(*args, **kwargs)
            self._record_success()
            return result
        except self.config.expected_exception as e:
            self._record_failure()
            raise e

    def get_status(self) -> dict:
        """Get current circuit breaker status"""
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time,
            "time_since_last_failure": time.time() - (self.last_failure_time or time.time()),
            "should_attempt_reset": self._should_attempt_reset()
        }


# Aramex Circuit Breaker Integration
class AramexCircuitBreaker:
    """Circuit Breaker specifically configured for Aramex API calls"""

    def __init__(self):
        # Configure for Aramex - more lenient due to external API dependencies
        config = CircuitBreakerConfig(
            failure_threshold=3,  # Open after 3 failures (less than default 5)
            recovery_timeout=120.0,  # Wait 2 minutes before retry
            expected_exception=(Exception,),  # Any exception counts as failure
            success_threshold=2  # Need 2 successes to close
        )
        self.circuit_breaker = CircuitBreaker(config)

    async def create_shipment(self, aramex_client, shipment_data: dict) -> dict:
        """Create shipment with circuit breaker protection"""
        async def _create_shipment():
            return await asyncio.get_event_loop().run_in_executor(
                None, aramex_client.create_shipment, shipment_data
            )

        return await self.circuit_breaker.call(_create_shipment)

    async def track_shipment(self, aramex_client, tracking_number: str) -> dict:
        """Track shipment with circuit breaker protection"""
        async def _track_shipment():
            return await asyncio.get_event_loop().run_in_executor(
                None, aramex_client.track_shipment, tracking_number
            )

        return await self.circuit_breaker.call(_track_shipment)

    async def get_rates(self, aramex_client, origin_country: str, origin_city: str,
                       destination_country: str, destination_city: str, weight: float) -> list:
        """Get rates with circuit breaker protection"""
        async def _get_rates():
            return await asyncio.get_event_loop().run_in_executor(
                None, aramex_client.get_rates,
                origin_country, origin_city, destination_country, destination_city, weight
            )

        return await self.circuit_breaker.call(_get_rates)

    def get_status(self) -> dict:
        """Get circuit breaker status"""
        status = self.circuit_breaker.get_status()
        status["service"] = "aramex"
        return status


# Global instance for Aramex
_aramex_circuit_breaker = None

def get_aramex_circuit_breaker() -> AramexCircuitBreaker:
    """Get global Aramex circuit breaker instance"""
    global _aramex_circuit_breaker
    if _aramex_circuit_breaker is None:
        _aramex_circuit_breaker = AramexCircuitBreaker()
    return _aramex_circuit_breaker


# Integration with existing Aramex client
class ResilientAramexClient:
    """Aramex client with built-in circuit breaker resilience"""

    def __init__(self, aramex_client):
        self.aramex_client = aramex_client
        self.circuit_breaker = get_aramex_circuit_breaker()

    async def create_shipment(self, shipment_data: dict) -> dict:
        """Create shipment with resilience"""
        try:
            return await self.circuit_breaker.create_shipment(
                self.aramex_client, shipment_data
            )
        except CircuitBreakerOpenException:
            # Fallback to alternative shipping provider (SMSA)
            raise Exception(
                "Aramex service temporarily unavailable. "
                "Circuit breaker is OPEN. Consider using SMSA as alternative."
            )

    async def track_shipment(self, tracking_number: str) -> dict:
        """Track shipment with resilience"""
        try:
            return await self.circuit_breaker.track_shipment(
                self.aramex_client, tracking_number
            )
        except CircuitBreakerOpenException:
            raise Exception(
                f"Aramex tracking temporarily unavailable for {tracking_number}. "
                "Please try again later."
            )

    async def get_rates(self, origin_country: str, origin_city: str,
                       destination_country: str, destination_city: str, weight: float) -> list:
        """Get rates with resilience"""
        try:
            return await self.circuit_breaker.get_rates(
                self.aramex_client, origin_country, origin_city,
                destination_country, destination_city, weight
            )
        except CircuitBreakerOpenException:
            # Return cached/estimated rates or raise error
            raise Exception(
                "Aramex rate calculation temporarily unavailable. "
                "Using estimated rates."
            )

    def get_circuit_status(self) -> dict:
        """Get circuit breaker status"""
        return self.circuit_breaker.get_status()


# Monitoring and Alerting Integration
class CircuitBreakerMonitor:
    """Monitor circuit breaker status and send alerts"""

    def __init__(self):
        self.monitored_breakers = {}

    def register_breaker(self, name: str, breaker: CircuitBreaker):
        """Register a circuit breaker for monitoring"""
        self.monitored_breakers[name] = breaker

    def get_all_status(self) -> dict:
        """Get status of all monitored circuit breakers"""
        return {
            name: breaker.get_status()
            for name, breaker in self.monitored_breakers.items()
        }

    def check_alerts(self) -> list:
        """Check for alerts that need attention"""
        alerts = []

        for name, breaker in self.monitored_breakers.items():
            status = breaker.get_status()

            if status["state"] == "open":
                alerts.append({
                    "level": "CRITICAL",
                    "service": name,
                    "message": f"Circuit breaker is OPEN - service failing",
                    "details": status
                })
            elif status["state"] == "half_open":
                alerts.append({
                    "level": "WARNING",
                    "service": name,
                    "message": f"Circuit breaker is HALF_OPEN - testing recovery",
                    "details": status
                })

        return alerts


# Global monitor instance
_monitor = CircuitBreakerMonitor()

def get_circuit_monitor() -> CircuitBreakerMonitor:
    """Get global circuit breaker monitor"""
    return _monitor


# Example usage in API endpoint
async def resilient_aramex_endpoint_example():
    """
    Example of how to use resilient Aramex client in API endpoint

    This would be integrated into the actual integrations/aramex.py
    """
    from integrations.shipping.aramex import get_aramex_client

    # Get clients
    aramex_client = get_aramex_client()
    if not aramex_client:
        raise HTTPException(status_code=503, detail="Aramex service not configured")

    resilient_client = ResilientAramexClient(aramex_client)

    # Register for monitoring
    monitor = get_circuit_monitor()
    monitor.register_breaker("aramex", resilient_client.circuit_breaker.circuit_breaker)

    try:
        # Use resilient client
        rates = await resilient_client.get_rates("SA", "Riyadh", "AE", "Dubai", 1.5)
        return {"rates": rates, "provider": "aramex"}
    except CircuitBreakerOpenException as e:
        # Fallback to SMSA
        smsa_client = get_smsa_client()
        if smsa_client:
            smsa_rates = await smsa_client.get_rates("SA", "Riyadh", "AE", "Dubai", 1.5)
            return {"rates": smsa_rates, "provider": "smsa", "fallback": True}
        else:
            raise HTTPException(status_code=503, detail=str(e))


if __name__ == "__main__":
    # Example usage
    import asyncio

    async def demo():
        # This would normally use real Aramex client
        print("Circuit Breaker Demo")
        print("====================")

        # Create circuit breaker
        cb = CircuitBreaker()

        print(f"Initial state: {cb.get_status()}")

        # Simulate failures
        for i in range(6):
            try:
                await cb.call(lambda: (_ for _ in ()).throw(Exception("Simulated failure")))
            except Exception as e:
                print(f"Call {i+1} failed: {e}")
                print(f"State: {cb.state.value}, Failures: {cb.failure_count}")

        print(f"Final state: {cb.get_status()}")

    asyncio.run(demo())