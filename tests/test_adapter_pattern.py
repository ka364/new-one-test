"""

Test Adapter Pattern Implementation

This module tests the Adapter Pattern implementation for e-commerce integrations,
including the base adapter, Shopify adapter, mock adapter, and adapter manager.

"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch

from services.api_gateway.integrations.ecommerce.adapters import (
    EcommerceAdapter,
    AdapterFactory,
    OrderData,
    ProductData,
    FulfillmentData,
    ShopifyAdapter,
    MockAdapter
)
from services.api_gateway.integrations.ecommerce.adapter_manager import AdapterManager


class TestBaseAdapter:
    """Test base adapter functionality"""

    def test_adapter_factory_supported_platforms(self):
        """Test that factory returns correct supported platforms"""
        platforms = AdapterFactory.get_supported_platforms()
        assert 'shopify' in platforms
        assert 'mock' in platforms

    def test_adapter_factory_create_shopify(self):
        """Test creating Shopify adapter"""
        config = {
            'api_key': 'test_key',
            'password': 'test_pass',
            'store_url': 'https://test-shop.myshopify.com'
        }
        adapter = AdapterFactory.create_adapter('shopify', config)
        assert isinstance(adapter, ShopifyAdapter)

    def test_adapter_factory_create_mock(self):
        """Test creating mock adapter"""
        config = {'name': 'test_mock'}
        adapter = AdapterFactory.create_adapter('mock', config)
        assert isinstance(adapter, MockAdapter)

    def test_adapter_factory_unsupported_platform(self):
        """Test creating adapter for unsupported platform"""
        with pytest.raises(ValueError, match="Unsupported platform"):
            AdapterFactory.create_adapter('unsupported', {})


class TestMockAdapter:
    """Test mock adapter functionality"""

    @pytest.fixture
    def mock_adapter(self):
        """Create mock adapter for testing"""
        config = {'name': 'test_mock'}
        return MockAdapter(config)

    @pytest.mark.asyncio
    async def test_get_orders(self, mock_adapter):
        """Test getting orders from mock adapter"""
        orders = await mock_adapter.get_orders()
        assert isinstance(orders, list)
        assert len(orders) > 0
        assert all(isinstance(order, OrderData) for order in orders)

    @pytest.mark.asyncio
    async def test_get_order(self, mock_adapter):
        """Test getting single order"""
        orders = await mock_adapter.get_orders(limit=1)
        order_id = orders[0].order_id
        order = await mock_adapter.get_order(order_id)
        assert order is not None
        assert order.order_id == order_id

    @pytest.mark.asyncio
    async def test_create_order(self, mock_adapter):
        """Test creating new order"""
        order_data = OrderData(
            order_id='test_order',
            customer_email='test@example.com',
            customer_name='Test Customer',
            total_amount=100.0,
            currency='USD',
            status='pending',
            items=[{'id': 'item1', 'title': 'Test Item', 'quantity': 1, 'price': 100.0}]
        )

        created_order = await mock_adapter.create_order(order_data)
        assert created_order.customer_email == 'test@example.com'
        assert created_order.total_amount == 100.0

    @pytest.mark.asyncio
    async def test_get_products(self, mock_adapter):
        """Test getting products"""
        products = await mock_adapter.get_products()
        assert isinstance(products, list)
        assert len(products) > 0
        assert all(isinstance(product, ProductData) for product in products)

    @pytest.mark.asyncio
    async def test_update_inventory(self, mock_adapter):
        """Test updating inventory"""
        products = await mock_adapter.get_products(limit=1)
        product_id = products[0].product_id

        result = await mock_adapter.update_inventory(product_id, 50)
        assert result is True

        # Verify update
        updated_product = await mock_adapter.get_product(product_id)
        assert updated_product.inventory_quantity == 50

    @pytest.mark.asyncio
    async def test_create_fulfillment(self, mock_adapter):
        """Test creating fulfillment"""
        fulfillment_data = FulfillmentData(
            fulfillment_id='test_fulfillment',
            order_id='mock_order_1',
            tracking_number='TRACK123',
            carrier='Test Carrier'
        )

        fulfillment = await mock_adapter.create_fulfillment(fulfillment_data)
        assert fulfillment.tracking_number == 'TRACK123'
        assert fulfillment.carrier == 'Test Carrier'

    def test_get_status(self, mock_adapter):
        """Test getting adapter status"""
        status = mock_adapter.get_status()
        assert status['platform'] == 'mock'
        assert status['healthy'] is True
        assert 'orders_count' in status


class TestShopifyAdapter:
    """Test Shopify adapter functionality"""

    @pytest.fixture
    def shopify_config(self):
        """Shopify adapter configuration"""
        return {
            'api_key': 'test_key',
            'password': 'test_pass',
            'store_url': 'https://test-shop.myshopify.com',
            'api_version': '2023-10'
        }

    @pytest.fixture
    def shopify_adapter(self, shopify_config):
        """Create Shopify adapter for testing"""
        return ShopifyAdapter(shopify_config)

    @pytest.mark.asyncio
    async def test_shopify_adapter_initialization(self, shopify_adapter, shopify_config):
        """Test Shopify adapter initialization"""
        assert shopify_adapter.api_key == shopify_config['api_key']
        assert shopify_adapter.store_url == shopify_config['store_url']
        assert shopify_adapter.api_version == '2023-10'

    @pytest.mark.asyncio
    async def test_get_orders_success(self, shopify_adapter):
        """Test successful order retrieval"""
        mock_response = {
            'orders': [{
                'id': 123,
                'email': 'test@example.com',
                'total_price': '100.00',
                'currency': 'USD',
                'financial_status': 'paid',
                'line_items': [{'id': 1, 'title': 'Test Product'}],
                'created_at': '2023-01-01T00:00:00Z',
                'updated_at': '2023-01-01T00:00:00Z'
            }]
        }

        # Mock the _make_request method
        with patch.object(shopify_adapter, '_make_request') as mock_make_request:
            mock_make_request.return_value = mock_response

            orders = await shopify_adapter.get_orders()
            assert len(orders) == 1
            assert orders[0].order_id == '123'
            assert orders[0].customer_email == 'test@example.com'

    @pytest.mark.asyncio
    async def test_get_orders_rate_limited(self, shopify_adapter):
        """Test rate limiting handling"""
        mock_response = {'orders': []}

        # Mock the _make_request method
        with patch.object(shopify_adapter, '_make_request') as mock_make_request:
            mock_make_request.return_value = mock_response

            await shopify_adapter.get_orders()
            # Should call _make_request once
            assert mock_make_request.call_count == 1

    def test_transform_order(self, shopify_adapter):
        """Test order transformation"""
        shopify_order = {
            'id': 123,
            'email': 'test@example.com',
            'total_price': '100.50',
            'currency': 'USD',
            'financial_status': 'paid',
            'line_items': [{'id': 1, 'title': 'Test'}],
            'created_at': '2023-01-01T00:00:00Z'
        }

        order = shopify_adapter._transform_order(shopify_order)
        assert order.order_id == '123'
        assert order.total_amount == 100.50
        assert order.currency == 'USD'
        assert order.status == 'paid'


class TestAdapterManager:
    """Test adapter manager functionality"""

    @pytest.fixture
    def manager_config(self):
        """Adapter manager configuration"""
        return {
            'ecommerce': {
                'mock': {
                    'name': 'test_mock'
                },
                'shopify': {
                    'api_key': 'test_key',
                    'password': 'test_pass',
                    'store_url': 'https://test-shop.myshopify.com',
                    'circuit_breaker': {
                        'failure_threshold': 3,
                        'recovery_timeout': 30
                    }
                }
            }
        }

    @pytest.fixture
    def adapter_manager(self, manager_config):
        """Create adapter manager for testing"""
        return AdapterManager(manager_config)

    def test_manager_initialization(self, adapter_manager):
        """Test manager initialization"""
        assert 'mock' in adapter_manager.adapters
        assert 'shopify' in adapter_manager.adapters
        assert 'mock' in adapter_manager.circuit_breakers
        assert 'shopify' in adapter_manager.circuit_breakers

    @pytest.mark.asyncio
    async def test_get_orders_from_mock(self, adapter_manager):
        """Test getting orders from mock adapter"""
        orders = await adapter_manager.get_orders('mock')
        assert isinstance(orders, list)
        assert len(orders) > 0

    @pytest.mark.asyncio
    async def test_get_all_orders(self, adapter_manager):
        """Test getting orders from all platforms"""
        results = await adapter_manager.get_all_orders()
        assert 'mock' in results
        assert isinstance(results['mock'], list)

    def test_get_status(self, adapter_manager):
        """Test getting manager status"""
        status = adapter_manager.get_status()
        assert 'adapters' in status
        assert 'circuit_breakers' in status
        assert 'timestamp' in status
        assert 'mock' in status['adapters']
        assert 'shopify' in status['adapters']

    def test_get_available_platforms(self, adapter_manager):
        """Test getting available platforms"""
        platforms = adapter_manager.get_available_platforms()
        assert 'mock' in platforms
        assert 'shopify' in platforms

    def test_get_circuit_breaker_status(self, adapter_manager):
        """Test getting circuit breaker status"""
        status = adapter_manager.get_circuit_breaker_status('mock')
        assert status is not None
        assert 'state' in status
        assert 'failure_count' in status


if __name__ == '__main__':
    pytest.main([__file__])