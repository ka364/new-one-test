#!/usr/bin/env python3

"""

Test script for OMS API endpoints

Tests all order management functionality

"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_colored(message, color):
    print(f"{color}{message}{Colors.END}")

def test_endpoint(method, endpoint, data=None, expected_status=200):
    """Test API endpoint"""
    url = f"{BASE_URL}{endpoint}"

    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == 'PUT':
            response = requests.put(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == 'DELETE':
            response = requests.delete(url)

        if response.status_code == expected_status:
            print_colored(f"✅ {method} {endpoint} - {response.status_code}", Colors.GREEN)
            return response.json() if response.content else None
        else:
            print_colored(f"❌ {method} {endpoint} - Expected {expected_status}, got {response.status_code}", Colors.RED)
            print(f"Response: {response.text}")
            return None

    except Exception as e:
        print_colored(f"❌ {method} {endpoint} - Error: {str(e)}", Colors.RED)
        return None

def main():
    print("🧪 NOW SHOES OMS API Tests")
    print("=" * 50)

    # Test 1: Health Check
    print("\n🏥 Health Check")
    test_endpoint('GET', '/health')

    # Test 2: List Orders
    print("\n📋 List Orders")
    orders = test_endpoint('GET', '/orders')
    order_id = None

    if orders and len(orders) > 0:
        order_id = orders[0].get('id')
        print(f"Found existing order: {order_id}")

    # Test 3: Create Order
    print("\n➕ Create Order")
    order_data = {
        "customer_name": "أحمد محمد",
        "customer_email": "ahmed@example.com",
        "customer_phone": "+966501234567",
        "items": [
            {
                "product_id": "PROD001",
                "product_name": "حذاء رياضي",
                "quantity": 2,
                "price": 150.00,
                "size": "42",
                "color": "أسود"
            }
        ],
        "shipping_address": {
            "street": "شارع الملك فهد",
            "city": "الرياض",
            "state": "الرياض",
            "country": "SA",
            "postal_code": "12345"
        },
        "billing_address": {
            "street": "شارع الملك فهد",
            "city": "الرياض",
            "state": "الرياض",
            "country": "SA",
            "postal_code": "12345"
        },
        "payment_method": "card",
        "notes": "طلب اختبار"
    }

    created_order = test_endpoint('POST', '/orders', order_data, 201)
    if created_order:
        order_id = created_order.get('id')
        print(f"Created order: {order_id}")

    # Test 4: Get Order Details
    if order_id:
        print(f"\n📦 Get Order Details ({order_id})")
        test_endpoint('GET', f'/orders/{order_id}')

        # Test 5: Update Order
        print(f"\n✏️ Update Order ({order_id})")
        update_data = {
            "status": "processing",
            "notes": "تم التحديث"
        }
        test_endpoint('PUT', f'/orders/{order_id}', update_data)

        # Test 6: Get Order Status
        print(f"\n📊 Get Order Status ({order_id})")
        test_endpoint('GET', f'/orders/{order_id}/status')

        # Test 7: Update Order Status
        print(f"\n🔄 Update Order Status ({order_id})")
        status_data = {"status": "shipped"}
        test_endpoint('POST', f'/orders/{order_id}/status', status_data)

    # Test 8: Integration Status
    print("\n🔗 Integration Status")
    test_endpoint('GET', '/integrations/config/status')

    # Test 9: Shipping Rates
    print("\n🚚 Shipping Rates")
    shipping_data = {
        "origin_country": "SA",
        "origin_city": "Riyadh",
        "destination_country": "AE",
        "destination_city": "Dubai",
        "weight": 1.5
    }
    test_endpoint('POST', '/integrations/shipping/rates', shipping_data)

    # Test 10: Test Notifications
    print("\n📱 Test Notifications")
    test_endpoint('POST', '/integrations/notifications/test')

    print("\n" + "=" * 50)
    print("🎉 API Testing Complete!")
    print("Check the results above for any failed tests.")

if __name__ == "__main__":
    main()