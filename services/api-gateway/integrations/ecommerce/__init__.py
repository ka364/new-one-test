"""

E-commerce Integrations Package

This package provides e-commerce platform integrations using the Adapter Pattern
for clean separation of concerns and easy platform switching.

"""

from .adapters import EcommerceAdapter, AdapterFactory, OrderData, ProductData, FulfillmentData
from .adapter_manager import AdapterManager

__all__ = [
    'EcommerceAdapter',
    'AdapterFactory',
    'OrderData',
    'ProductData',
    'FulfillmentData'
]