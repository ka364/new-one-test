"""

Mock Adapter for Testing

This module implements a MockAdapter for testing purposes that simulates
e-commerce platform behavior without making actual API calls.

"""

import random
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from .base_adapter import EcommerceAdapter, OrderData, ProductData, FulfillmentData


class MockAdapter(EcommerceAdapter):
    """Mock e-commerce platform adapter for testing"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.mock_data = {
            'orders': self._generate_mock_orders(10),
            'products': self._generate_mock_products(5),
            'fulfillments': {}
        }

    def _generate_mock_orders(self, count: int) -> Dict[str, OrderData]:
        """Generate mock orders for testing"""
        orders = {}
        statuses = ['pending', 'paid', 'fulfilled', 'cancelled']

        for i in range(1, count + 1):
            order_id = f"mock_order_{i}"
            orders[order_id] = OrderData(
                order_id=order_id,
                customer_email=f"customer{i}@example.com",
                customer_name=f"Customer {i}",
                total_amount=round(random.uniform(50, 500), 2),
                currency="USD",
                status=random.choice(statuses),
                items=[
                    {
                        'id': f'item_{j}',
                        'product_id': f'mock_product_{random.randint(1, 5)}',
                        'title': f'Mock Product {random.randint(1, 5)}',
                        'quantity': random.randint(1, 3),
                        'price': round(random.uniform(20, 100), 2)
                    } for j in range(random.randint(1, 3))
                ],
                shipping_address={
                    'first_name': f'Customer {i}',
                    'last_name': 'Test',
                    'address1': f'{random.randint(100, 999)} Mock Street',
                    'city': 'Mock City',
                    'country': 'US',
                    'zip': f'{random.randint(10000, 99999)}'
                },
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                updated_at=datetime.utcnow() - timedelta(hours=random.randint(0, 24))
            )
        return orders

    def _generate_mock_products(self, count: int) -> Dict[str, ProductData]:
        """Generate mock products for testing"""
        products = {}

        for i in range(1, count + 1):
            product_id = f"mock_product_{i}"
            products[product_id] = ProductData(
                product_id=product_id,
                title=f"Mock Product {i}",
                description=f"This is a mock product {i} for testing purposes.",
                price=round(random.uniform(20, 200), 2),
                currency="USD",
                inventory_quantity=random.randint(0, 100),
                variants=[
                    {
                        'id': f'variant_{i}_1',
                        'title': f'Size {random.choice(["S", "M", "L", "XL"])}',
                        'price': round(random.uniform(20, 200), 2),
                        'inventory_quantity': random.randint(0, 50)
                    }
                ],
                images=[f'https://example.com/mock-image-{i}.jpg'],
                status='active',
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 365)),
                updated_at=datetime.utcnow() - timedelta(hours=random.randint(0, 24))
            )
        return products

    async def get_orders(self, **filters) -> List[OrderData]:
        """Get mock orders with optional filters"""
        orders = list(self.mock_data['orders'].values())

        # Apply filters
        if 'status' in filters:
            orders = [o for o in orders if o.status == filters['status']]

        if 'limit' in filters:
            orders = orders[:filters['limit']]

        return orders

    async def get_order(self, order_id: str) -> Optional[OrderData]:
        """Get single mock order by ID"""
        return self.mock_data['orders'].get(order_id)

    async def create_order(self, order_data: OrderData) -> OrderData:
        """Create new mock order"""
        # Simulate order creation with new ID
        new_id = f"mock_order_{len(self.mock_data['orders']) + 1}"
        new_order = OrderData(
            order_id=new_id,
            customer_email=order_data.customer_email,
            customer_name=order_data.customer_name,
            total_amount=order_data.total_amount,
            currency=order_data.currency,
            status='pending',
            items=order_data.items,
            shipping_address=order_data.shipping_address,
            billing_address=order_data.billing_address,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            metadata=order_data.metadata
        )
        self.mock_data['orders'][new_id] = new_order
        return new_order

    async def update_order(self, order_id: str, updates: Dict[str, Any]) -> OrderData:
        """Update existing mock order"""
        if order_id not in self.mock_data['orders']:
            raise ValueError(f"Order {order_id} not found")

        order = self.mock_data['orders'][order_id]

        # Apply updates
        for key, value in updates.items():
            if hasattr(order, key):
                setattr(order, key, value)

        order.updated_at = datetime.utcnow()
        return order

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel mock order"""
        if order_id in self.mock_data['orders']:
            self.mock_data['orders'][order_id].status = 'cancelled'
            self.mock_data['orders'][order_id].updated_at = datetime.utcnow()
            return True
        return False

    async def get_products(self, **filters) -> List[ProductData]:
        """Get mock products with optional filters"""
        products = list(self.mock_data['products'].values())

        if 'limit' in filters:
            products = products[:filters['limit']]

        return products

    async def get_product(self, product_id: str) -> Optional[ProductData]:
        """Get single mock product by ID"""
        return self.mock_data['products'].get(product_id)

    async def update_inventory(self, product_id: str, quantity: int) -> bool:
        """Update mock product inventory"""
        if product_id in self.mock_data['products']:
            self.mock_data['products'][product_id].inventory_quantity = quantity
            return True
        return False

    async def create_fulfillment(self, fulfillment_data: FulfillmentData) -> FulfillmentData:
        """Create mock order fulfillment"""
        fulfillment_id = f"mock_fulfillment_{len(self.mock_data['fulfillments']) + 1}"

        fulfillment = FulfillmentData(
            fulfillment_id=fulfillment_id,
            order_id=fulfillment_data.order_id,
            tracking_number=fulfillment_data.tracking_number,
            carrier=fulfillment_data.carrier,
            tracking_url=fulfillment_data.tracking_url,
            line_items=fulfillment_data.line_items,
            status='fulfilled',
            shipped_at=datetime.utcnow()
        )

        if fulfillment_data.order_id not in self.mock_data['fulfillments']:
            self.mock_data['fulfillments'][fulfillment_data.order_id] = []

        self.mock_data['fulfillments'][fulfillment_data.order_id].append(fulfillment)
        return fulfillment

    async def get_fulfillments(self, order_id: str) -> List[FulfillmentData]:
        """Get mock fulfillments for order"""
        return self.mock_data['fulfillments'].get(order_id, [])

    def get_status(self) -> Dict[str, Any]:
        """Get mock adapter status"""
        return {
            'platform': 'mock',
            'healthy': True,
            'orders_count': len(self.mock_data['orders']),
            'products_count': len(self.mock_data['products']),
            'fulfillments_count': sum(len(f) for f in self.mock_data['fulfillments'].values())
        }