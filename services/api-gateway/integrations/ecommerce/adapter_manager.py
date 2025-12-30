"""

Adapter Manager with Circuit Breaker Integration

This module provides a manager class that combines the Adapter Pattern
with Circuit Breaker pattern for resilient e-commerce integrations.

"""

import asyncio
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import structlog

from .adapters import AdapterFactory, EcommerceAdapter, OrderData, ProductData, FulfillmentData
from services.api_gateway.integrations.shipping.circuit_breaker import CircuitBreaker, CircuitBreakerConfig


logger = structlog.get_logger(__name__)


class AdapterManager:
    """Manager for e-commerce adapters with circuit breaker protection"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.adapters: Dict[str, EcommerceAdapter] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

        # Initialize adapters from config
        self._initialize_adapters()

    def _initialize_adapters(self):
        """Initialize adapters and their circuit breakers"""
        ecommerce_config = self.config.get('ecommerce', {})

        for platform, platform_config in ecommerce_config.items():
            try:
                # Create adapter
                adapter = AdapterFactory.create_adapter(platform, platform_config)
                self.adapters[platform] = adapter

                # Create circuit breaker for this adapter
                cb_config = platform_config.get('circuit_breaker', {})
                circuit_breaker_config = CircuitBreakerConfig(
                    failure_threshold=cb_config.get('failure_threshold', 5),
                    recovery_timeout=cb_config.get('recovery_timeout', 60),
                    success_threshold=cb_config.get('success_threshold', 3)
                )

                circuit_breaker = CircuitBreaker(circuit_breaker_config)

                self.circuit_breakers[platform] = circuit_breaker

                logger.info(f"Initialized {platform} adapter with circuit breaker",
                          platform=platform)

            except Exception as e:
                logger.error(f"Failed to initialize {platform} adapter",
                           platform=platform, error=str(e))

    async def _execute_with_circuit_breaker(self, platform: str, operation: str, func, *args, **kwargs):
        """Execute adapter method with circuit breaker protection"""
        if platform not in self.adapters:
            raise ValueError(f"Adapter for platform '{platform}' not found")

        if platform not in self.circuit_breakers:
            # Fallback without circuit breaker
            return await func(*args, **kwargs)

        circuit_breaker = self.circuit_breakers[platform]

        try:
            result = await circuit_breaker.call(func, *args, **kwargs)
            logger.info(f"Successfully executed {operation} on {platform}")
            return result
        except Exception as e:
            logger.error(f"Failed to execute {operation} on {platform}",
                        error=str(e), platform=platform)
            raise

    # Order operations
    async def get_orders(self, platform: str, **filters) -> List[OrderData]:
        """Get orders from specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "get_orders", adapter.get_orders, **filters
        )

    async def get_order(self, platform: str, order_id: str) -> Optional[OrderData]:
        """Get single order from specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "get_order", adapter.get_order, order_id
        )

    async def create_order(self, platform: str, order_data: OrderData) -> OrderData:
        """Create order on specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "create_order", adapter.create_order, order_data
        )

    async def update_order(self, platform: str, order_id: str, updates: Dict[str, Any]) -> OrderData:
        """Update order on specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "update_order", adapter.update_order, order_id, updates
        )

    async def cancel_order(self, platform: str, order_id: str) -> bool:
        """Cancel order on specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "cancel_order", adapter.cancel_order, order_id
        )

    # Product operations
    async def get_products(self, platform: str, **filters) -> List[ProductData]:
        """Get products from specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "get_products", adapter.get_products, **filters
        )

    async def get_product(self, platform: str, product_id: str) -> Optional[ProductData]:
        """Get single product from specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "get_product", adapter.get_product, product_id
        )

    async def update_inventory(self, platform: str, product_id: str, quantity: int) -> bool:
        """Update inventory on specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "update_inventory", adapter.update_inventory, product_id, quantity
        )

    # Fulfillment operations
    async def create_fulfillment(self, platform: str, fulfillment_data: FulfillmentData) -> FulfillmentData:
        """Create fulfillment on specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "create_fulfillment", adapter.create_fulfillment, fulfillment_data
        )

    async def get_fulfillments(self, platform: str, order_id: str) -> List[FulfillmentData]:
        """Get fulfillments from specified platform"""
        adapter = self.adapters[platform]
        return await self._execute_with_circuit_breaker(
            platform, "get_fulfillments", adapter.get_fulfillments, order_id
        )

    # Multi-platform operations
    async def get_all_orders(self, platforms: Optional[List[str]] = None, **filters) -> Dict[str, List[OrderData]]:
        """Get orders from multiple platforms"""
        if platforms is None:
            platforms = list(self.adapters.keys())

        results = {}
        tasks = []

        for platform in platforms:
            if platform in self.adapters:
                task = self.get_orders(platform, **filters)
                tasks.append((platform, task))

        # Execute all tasks concurrently
        for platform, task in tasks:
            try:
                results[platform] = await task
            except Exception as e:
                logger.error(f"Failed to get orders from {platform}", error=str(e))
                results[platform] = []

        return results

    async def get_all_products(self, platforms: Optional[List[str]] = None, **filters) -> Dict[str, List[ProductData]]:
        """Get products from multiple platforms"""
        if platforms is None:
            platforms = list(self.adapters.keys())

        results = {}
        tasks = []

        for platform in platforms:
            if platform in self.adapters:
                task = self.get_products(platform, **filters)
                tasks.append((platform, task))

        for platform, task in tasks:
            try:
                results[platform] = await task
            except Exception as e:
                logger.error(f"Failed to get products from {platform}", error=str(e))
                results[platform] = []

        return results

    # Status and monitoring
    def get_status(self) -> Dict[str, Any]:
        """Get overall status of all adapters and circuit breakers"""
        status = {
            'adapters': {},
            'circuit_breakers': {},
            'timestamp': datetime.utcnow().isoformat()
        }

        for platform, adapter in self.adapters.items():
            status['adapters'][platform] = adapter.get_status()

        for platform, cb in self.circuit_breakers.items():
            status['circuit_breakers'][platform] = {
                'state': cb.state.name,
                'failure_count': cb.failure_count,
                'last_failure_time': cb.last_failure_time
            }

        return status

    def get_available_platforms(self) -> List[str]:
        """Get list of available platforms"""
        return list(self.adapters.keys())

    def get_circuit_breaker_status(self, platform: str) -> Optional[Dict[str, Any]]:
        """Get circuit breaker status for specific platform"""
        if platform not in self.circuit_breakers:
            return None

        cb = self.circuit_breakers[platform]
        return {
            'state': cb.state.name,
            'failure_count': cb.failure_count,
            'last_failure_time': cb.last_failure_time
        }

    async def close(self):
        """Close all adapters and cleanup resources"""
        for adapter in self.adapters.values():
            if hasattr(adapter, '__aexit__'):
                await adapter.__aexit__(None, None, None)

        logger.info("Closed all e-commerce adapters")