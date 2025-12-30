"""

Base Adapter Pattern for E-commerce Integrations

This module defines the abstract base class for all e-commerce adapters,
providing a unified interface for different platforms (Shopify, WooCommerce, etc.)

"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class OrderData:
    """Standardized order data structure"""
    order_id: str
    customer_email: str
    customer_name: str
    total_amount: float
    currency: str
    status: str
    items: List[Dict[str, Any]]
    shipping_address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class ProductData:
    """Standardized product data structure"""
    product_id: str
    title: str
    description: str
    price: float
    currency: str
    inventory_quantity: int
    variants: List[Dict[str, Any]]
    images: List[str]
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class FulfillmentData:
    """Standardized fulfillment data structure"""
    fulfillment_id: str
    order_id: str
    tracking_number: str
    carrier: str
    tracking_url: Optional[str] = None
    line_items: List[Dict[str, Any]] = None
    status: str = "fulfilled"
    shipped_at: Optional[datetime] = None


class EcommerceAdapter(ABC):
    """Abstract base class for e-commerce platform adapters"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get('name', self.__class__.__name__)

    @abstractmethod
    async def get_orders(self, **filters) -> List[OrderData]:
        """Get orders with optional filters"""
        pass

    @abstractmethod
    async def get_order(self, order_id: str) -> Optional[OrderData]:
        """Get single order by ID"""
        pass

    @abstractmethod
    async def create_order(self, order_data: OrderData) -> OrderData:
        """Create new order"""
        pass

    @abstractmethod
    async def update_order(self, order_id: str, updates: Dict[str, Any]) -> OrderData:
        """Update existing order"""
        pass

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order"""
        pass

    @abstractmethod
    async def get_products(self, **filters) -> List[ProductData]:
        """Get products with optional filters"""
        pass

    @abstractmethod
    async def get_product(self, product_id: str) -> Optional[ProductData]:
        """Get single product by ID"""
        pass

    @abstractmethod
    async def update_inventory(self, product_id: str, quantity: int) -> bool:
        """Update product inventory"""
        pass

    @abstractmethod
    async def create_fulfillment(self, fulfillment_data: FulfillmentData) -> FulfillmentData:
        """Create order fulfillment"""
        pass

    @abstractmethod
    async def get_fulfillments(self, order_id: str) -> List[FulfillmentData]:
        """Get fulfillments for order"""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Get adapter status and health"""
        pass

    # Helper methods for data transformation
    def _standardize_order_status(self, platform_status: str) -> str:
        """Convert platform-specific status to standardized status"""
        status_mapping = {
            # Shopify statuses
            'pending': 'pending',
            'paid': 'paid',
            'fulfilled': 'fulfilled',
            'cancelled': 'cancelled',
            'refunded': 'refunded',
            # WooCommerce statuses
            'on-hold': 'pending',
            'processing': 'processing',
            'completed': 'fulfilled',
            # Add more mappings as needed
        }
        return status_mapping.get(platform_status.lower(), platform_status)

    def _standardize_datetime(self, dt_string: str) -> datetime:
        """Convert platform datetime string to datetime object"""
        # Handle different datetime formats from various platforms
        formats = [
            '%Y-%m-%dT%H:%M:%S%z',  # ISO 8601 with timezone
            '%Y-%m-%d %H:%M:%S',    # MySQL format
            '%Y-%m-%dT%H:%M:%S',    # ISO without timezone
        ]

        for fmt in formats:
            try:
                return datetime.strptime(dt_string, fmt)
            except ValueError:
                continue

        # If no format matches, return current time as fallback
        return datetime.utcnow()

    def _validate_config(self) -> bool:
        """Validate adapter configuration"""
        required_keys = ['api_key', 'store_url']
        return all(key in self.config for key in required_keys)


class AdapterFactory:
    """Factory for creating e-commerce adapters"""

    @staticmethod
    def create_adapter(platform: str, config: Dict[str, Any]) -> EcommerceAdapter:
        """Create adapter instance based on platform"""
        if platform.lower() == 'shopify':
            from .shopify_adapter import ShopifyAdapter
            return ShopifyAdapter(config)
        elif platform.lower() == 'woocommerce':
            # Future implementation
            raise NotImplementedError("WooCommerce adapter not implemented yet")
        elif platform.lower() == 'mock':
            from .mock_adapter import MockAdapter
            return MockAdapter(config)
        else:
            raise ValueError(f"Unsupported platform: {platform}")

    @staticmethod
    def get_supported_platforms() -> List[str]:
        """Get list of supported platforms"""
        return ['shopify', 'mock']  # Add more as implemented