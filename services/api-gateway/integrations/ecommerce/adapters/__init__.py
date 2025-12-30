"""

E-commerce Adapters Package

This package contains adapter implementations for different e-commerce platforms,
providing a unified interface through the Adapter Pattern.

"""

from .base_adapter import EcommerceAdapter, AdapterFactory, OrderData, ProductData, FulfillmentData
from .shopify_adapter import ShopifyAdapter
from .mock_adapter import MockAdapter

__all__ = [
    'EcommerceAdapter',
    'AdapterFactory',
    'OrderData',
    'ProductData',
    'FulfillmentData',
    'ShopifyAdapter',
    'MockAdapter'
]