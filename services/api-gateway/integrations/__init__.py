"""

Integrations Package

This package contains all external service integrations for HaderOS,
including shipping, notifications, and e-commerce platforms.

"""

from .ecommerce import AdapterManager

__version__ = "1.0.0"

__all__ = [
    'AdapterManager'
]