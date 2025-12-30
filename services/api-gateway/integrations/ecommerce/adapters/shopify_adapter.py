"""

Shopify Adapter Implementation

This module implements the ShopifyAdapter class that adapts the Shopify API
to the standardized EcommerceAdapter interface.

"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import httpx
from .base_adapter import EcommerceAdapter, OrderData, ProductData, FulfillmentData


class ShopifyAdapter(EcommerceAdapter):
    """Shopify e-commerce platform adapter"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config['api_key']
        self.password = config['password']
        self.store_url = config['store_url'].rstrip('/')
        self.api_version = config.get('api_version', '2023-10')
        self.base_url = f"{self.store_url}/admin/api/{self.api_version}"

        # HTTP client setup
        self.client = httpx.AsyncClient(
            auth=(self.api_key, self.password),
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=30.0
        )

        # Rate limiting
        self.rate_limit_delay = 0.5  # 2 requests per second
        self.last_request_time = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make authenticated request to Shopify API with rate limiting"""
        # Rate limiting
        current_time = asyncio.get_event_loop().time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = asyncio.get_event_loop().time()

        url = f"{self.base_url}{endpoint}"
        response = await self.client.request(method, url, **kwargs)

        if response.status_code == 429:  # Rate limited
            retry_after = int(response.headers.get('Retry-After', 1))
            await asyncio.sleep(retry_after)
            return await self._make_request(method, endpoint, **kwargs)

        response.raise_for_status()
        return response.json()

    async def get_orders(self, **filters) -> List[OrderData]:
        """Get orders with optional filters"""
        params = {}

        # Apply filters
        if 'status' in filters:
            params['status'] = filters['status']
        if 'created_at_min' in filters:
            params['created_at_min'] = filters['created_at_min']
        if 'created_at_max' in filters:
            params['created_at_max'] = filters['created_at_max']
        if 'limit' in filters:
            params['limit'] = min(filters['limit'], 250)  # Shopify max is 250
        else:
            params['limit'] = 50

        response = await self._make_request('GET', '/orders.json', params=params)
        orders = response.get('orders', [])

        return [self._transform_order(order) for order in orders]

    async def get_order(self, order_id: str) -> Optional[OrderData]:
        """Get single order by ID"""
        try:
            response = await self._make_request('GET', f'/orders/{order_id}.json')
            order = response.get('order')
            return self._transform_order(order) if order else None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

    async def create_order(self, order_data: OrderData) -> OrderData:
        """Create new order"""
        shopify_order = self._transform_to_shopify_order(order_data)
        response = await self._make_request('POST', '/orders.json', json={'order': shopify_order})
        return self._transform_order(response['order'])

    async def update_order(self, order_id: str, updates: Dict[str, Any]) -> OrderData:
        """Update existing order"""
        response = await self._make_request('PUT', f'/orders/{order_id}.json', json={'order': updates})
        return self._transform_order(response['order'])

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order"""
        try:
            await self._make_request('POST', f'/orders/{order_id}/cancel.json')
            return True
        except httpx.HTTPStatusError:
            return False

    async def get_products(self, **filters) -> List[ProductData]:
        """Get products with optional filters"""
        params = {}

        if 'limit' in filters:
            params['limit'] = min(filters['limit'], 250)
        else:
            params['limit'] = 50

        response = await self._make_request('GET', '/products.json', params=params)
        products = response.get('products', [])

        return [self._transform_product(product) for product in products]

    async def get_product(self, product_id: str) -> Optional[ProductData]:
        """Get single product by ID"""
        try:
            response = await self._make_request('GET', f'/products/{product_id}.json')
            product = response.get('product')
            return self._transform_product(product) if product else None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

    async def update_inventory(self, product_id: str, quantity: int) -> bool:
        """Update product inventory"""
        try:
            # Get current product to find variant
            product = await self.get_product(product_id)
            if not product or not product.variants:
                return False

            # Update first variant's inventory (simplified)
            variant_id = product.variants[0]['id']
            inventory_item_id = product.variants[0]['inventory_item_id']

            # Get inventory levels
            response = await self._make_request('GET', f'/inventory_levels.json',
                                              params={'inventory_item_ids': inventory_item_id})
            levels = response.get('inventory_levels', [])
            if not levels:
                return False

            location_id = levels[0]['location_id']

            # Update inventory
            await self._make_request('POST', '/inventory_levels/set.json', json={
                'inventory_item_id': inventory_item_id,
                'location_id': location_id,
                'available': quantity
            })
            return True
        except Exception:
            return False

    async def create_fulfillment(self, fulfillment_data: FulfillmentData) -> FulfillmentData:
        """Create order fulfillment"""
        fulfillment = {
            'tracking_number': fulfillment_data.tracking_number,
            'tracking_company': fulfillment_data.carrier,
            'line_items': fulfillment_data.line_items or []
        }

        if fulfillment_data.tracking_url:
            fulfillment['tracking_url'] = fulfillment_data.tracking_url

        response = await self._make_request('POST',
                                          f'/orders/{fulfillment_data.order_id}/fulfillments.json',
                                          json={'fulfillment': fulfillment})
        return self._transform_fulfillment(response['fulfillment'])

    async def get_fulfillments(self, order_id: str) -> List[FulfillmentData]:
        """Get fulfillments for order"""
        response = await self._make_request('GET', f'/orders/{order_id}/fulfillments.json')
        fulfillments = response.get('fulfillments', [])
        return [self._transform_fulfillment(f) for f in fulfillments]

    def get_status(self) -> Dict[str, Any]:
        """Get adapter status and health"""
        return {
            'platform': 'shopify',
            'store_url': self.store_url,
            'api_version': self.api_version,
            'healthy': True,  # Could add actual health check
            'last_request_time': self.last_request_time
        }

    def _transform_order(self, shopify_order: Dict[str, Any]) -> OrderData:
        """Transform Shopify order to standardized OrderData"""
        return OrderData(
            order_id=str(shopify_order['id']),
            customer_email=shopify_order.get('email', ''),
            customer_name=f"{shopify_order.get('customer', {}).get('first_name', '')} {shopify_order.get('customer', {}).get('last_name', '')}".strip(),
            total_amount=float(shopify_order['total_price']),
            currency=shopify_order.get('currency', 'USD'),
            status=self._standardize_order_status(shopify_order.get('financial_status', 'pending')),
            items=shopify_order.get('line_items', []),
            shipping_address=shopify_order.get('shipping_address'),
            billing_address=shopify_order.get('billing_address'),
            created_at=self._standardize_datetime(shopify_order['created_at']) if 'created_at' in shopify_order else None,
            updated_at=self._standardize_datetime(shopify_order['updated_at']) if 'updated_at' in shopify_order else None,
            metadata={
                'shopify_order_number': shopify_order.get('order_number'),
                'tags': shopify_order.get('tags', []),
                'note': shopify_order.get('note')
            }
        )

    def _transform_product(self, shopify_product: Dict[str, Any]) -> ProductData:
        """Transform Shopify product to standardized ProductData"""
        return ProductData(
            product_id=str(shopify_product['id']),
            title=shopify_product['title'],
            description=shopify_product.get('body_html', ''),
            price=float(shopify_product.get('variants', [{}])[0].get('price', 0)),
            currency='USD',  # Shopify default
            inventory_quantity=sum(v.get('inventory_quantity', 0) for v in shopify_product.get('variants', [])),
            variants=shopify_product.get('variants', []),
            images=[img['src'] for img in shopify_product.get('images', [])],
            status=shopify_product.get('status', 'active'),
            created_at=self._standardize_datetime(shopify_product['created_at']) if 'created_at' in shopify_product else None,
            updated_at=self._standardize_datetime(shopify_product['updated_at']) if 'updated_at' in shopify_product else None
        )

    def _transform_fulfillment(self, shopify_fulfillment: Dict[str, Any]) -> FulfillmentData:
        """Transform Shopify fulfillment to standardized FulfillmentData"""
        return FulfillmentData(
            fulfillment_id=str(shopify_fulfillment['id']),
            order_id=str(shopify_fulfillment['order_id']),
            tracking_number=shopify_fulfillment.get('tracking_number', ''),
            carrier=shopify_fulfillment.get('tracking_company', ''),
            tracking_url=shopify_fulfillment.get('tracking_url'),
            line_items=shopify_fulfillment.get('line_items', []),
            status=shopify_fulfillment.get('status', 'success'),
            shipped_at=self._standardize_datetime(shopify_fulfillment['created_at']) if 'created_at' in shopify_fulfillment else None
        )

    def _transform_to_shopify_order(self, order_data: OrderData) -> Dict[str, Any]:
        """Transform OrderData to Shopify order format"""
        return {
            'email': order_data.customer_email,
            'line_items': order_data.items,
            'shipping_address': order_data.shipping_address,
            'billing_address': order_data.billing_address,
            'note': order_data.metadata.get('note') if order_data.metadata else None,
            'tags': order_data.metadata.get('tags') if order_data.metadata else []
        }