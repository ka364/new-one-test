"""

Shopify Integration Client

Handles Shopify API interactions for orders, products, and webhooks

"""

import os
import hmac
import hashlib
import requests
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin


class ShopifyClient:
    """Shopify API client for order management"""

    def __init__(self, shop_url: str, access_token: str):
        self.shop_url = shop_url.rstrip('/')
        self.access_token = access_token
        self.base_url = f"https://{shop_url}/admin/api/2023-10"
        self.session = requests.Session()
        self.session.headers.update({
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json'
        })

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make authenticated request to Shopify API"""
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))

        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=data)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            return response.json() if response.content else {}

        except requests.exceptions.RequestException as e:
            raise Exception(f"Shopify API error: {str(e)}")

    def get_orders(self, **filters) -> List[Dict]:
        """Get orders with optional filters"""
        response = self._make_request('GET', 'orders.json', filters)
        return response.get('orders', [])

    def get_order(self, order_id: str) -> Dict:
        """Get single order by ID"""
        response = self._make_request('GET', f'orders/{order_id}.json')
        return response.get('order', {})

    def create_order(self, order_data: Dict) -> Dict:
        """Create new order"""
        response = self._make_request('POST', 'orders.json', {'order': order_data})
        return response.get('order', {})

    def update_order(self, order_id: str, order_data: Dict) -> Dict:
        """Update existing order"""
        response = self._make_request('PUT', f'orders/{order_id}.json', {'order': order_data})
        return response.get('order', {})

    def fulfill_order(self, order_id: str, fulfillment_data: Dict) -> Dict:
        """Create fulfillment for order"""
        response = self._make_request('POST', f'orders/{order_id}/fulfillments.json',
                                    {'fulfillment': fulfillment_data})
        return response.get('fulfillment', {})

    def get_products(self, **filters) -> List[Dict]:
        """Get products with optional filters"""
        response = self._make_request('GET', 'products.json', filters)
        return response.get('products', [])

    def get_inventory_levels(self, inventory_item_ids: List[str]) -> List[Dict]:
        """Get inventory levels for items"""
        params = {'inventory_item_ids': ','.join(inventory_item_ids)}
        response = self._make_request('GET', 'inventory_levels.json', params)
        return response.get('inventory_levels', [])

    def update_inventory(self, inventory_item_id: str, location_id: str, quantity: int) -> Dict:
        """Update inventory level"""
        data = {
            'inventory_item_id': inventory_item_id,
            'location_id': location_id,
            'available': quantity
        }
        response = self._make_request('POST', 'inventory_levels/set.json', data)
        return response.get('inventory_level', {})


def get_shopify_client() -> Optional[ShopifyClient]:
    """Get configured Shopify client"""
    shop_url = os.getenv('SHOPIFY_SHOP_URL')
    access_token = os.getenv('SHOPIFY_ACCESS_TOKEN')

    if not shop_url or not access_token:
        return None

    return ShopifyClient(shop_url, access_token)


def verify_webhook_signature(request_body: bytes, signature: str, secret: str) -> bool:
    """Verify Shopify webhook signature"""
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        request_body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)