#!/usr/bin/env python3
"""
HADEROS Microservices Simulation
================================
Simulates real orders from Excel files through all microservices.

This script:
1. Reads real orders from Excel files
2. Creates users, products, and orders
3. Processes payments
4. Assigns deliveries
5. Sends notifications
"""

import pandas as pd
import requests
import json
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
import os
import sys

# Service URLs
SERVICES = {
    'user': 'http://localhost:8081',
    'product': 'http://localhost:8082',
    'order': 'http://localhost:8083',
    'group_buying': 'http://localhost:8084',
    'delivery': 'http://localhost:8085',
    'community': 'http://localhost:8086',
    'locker': 'http://localhost:8087',
    'payment': 'http://localhost:8088',
    'notification': 'http://localhost:8089'
}

# Egyptian cities for zone mapping
CITY_ZONES = {
    'القاهرة': {'zone': 'cairo', 'delivery_fee': 25},
    'الجيزة': {'zone': 'giza', 'delivery_fee': 30},
    'الإسكندرية': {'zone': 'alexandria', 'delivery_fee': 35},
    'الدقهلية': {'zone': 'dakahlia', 'delivery_fee': 40},
    'الشرقية': {'zone': 'sharqia', 'delivery_fee': 40},
    'المنوفية': {'zone': 'menoufia', 'delivery_fee': 45},
    'الغربية': {'zone': 'gharbia', 'delivery_fee': 45},
    'القليوبية': {'zone': 'qalyubia', 'delivery_fee': 35},
    'سوهاج': {'zone': 'sohag', 'delivery_fee': 55},
    'قنا': {'zone': 'qena', 'delivery_fee': 60},
    'البحر الأحمر': {'zone': 'red_sea', 'delivery_fee': 70},
}

class SimulationStats:
    def __init__(self):
        self.users_created = 0
        self.products_created = 0
        self.orders_created = 0
        self.payments_processed = 0
        self.deliveries_assigned = 0
        self.notifications_sent = 0
        self.errors = []
        self.total_revenue = 0.0
        self.start_time = None
        self.end_time = None

    def summary(self) -> Dict:
        duration = (self.end_time - self.start_time).total_seconds() if self.end_time else 0
        return {
            'users_created': self.users_created,
            'products_created': self.products_created,
            'orders_created': self.orders_created,
            'payments_processed': self.payments_processed,
            'deliveries_assigned': self.deliveries_assigned,
            'notifications_sent': self.notifications_sent,
            'total_revenue': f'{self.total_revenue:,.2f} EGP',
            'errors': len(self.errors),
            'duration': f'{duration:.2f} seconds',
            'orders_per_second': f'{self.orders_created / duration:.2f}' if duration > 0 else 'N/A'
        }


class HADEROSSimulator:
    def __init__(self, mock_mode: bool = True):
        self.mock_mode = mock_mode
        self.stats = SimulationStats()
        self.users: Dict[str, str] = {}  # phone -> user_id
        self.products: Dict[str, Dict] = {}  # sku -> product_data
        self.drivers: List[str] = []

    def call_service(self, service: str, endpoint: str, method: str = 'POST', data: Dict = None) -> Dict:
        """Call a microservice endpoint"""
        if self.mock_mode:
            return self._mock_response(service, endpoint, data)

        url = f"{SERVICES[service]}{endpoint}"
        try:
            if method == 'GET':
                response = requests.get(url, params=data, timeout=10)
            else:
                response = requests.post(url, json=data, timeout=10)
            return response.json()
        except Exception as e:
            self.stats.errors.append(f"{service}/{endpoint}: {str(e)}")
            return {'error': str(e)}

    def _mock_response(self, service: str, endpoint: str, data: Dict = None) -> Dict:
        """Generate mock responses for simulation"""
        import uuid

        if service == 'user' and 'register' in endpoint:
            user_id = f"user_{uuid.uuid4().hex[:8]}"
            return {'user': {'id': user_id, 'phone': data.get('phone', '')}}

        elif service == 'product' and endpoint == '/api/products':
            product_id = f"prod_{uuid.uuid4().hex[:8]}"
            return {'product': {'id': product_id, **data}}

        elif service == 'order' and endpoint == '/api/orders':
            order_id = f"ord_{uuid.uuid4().hex[:8]}"
            return {'order': {'id': order_id, 'status': 'pending', **data}}

        elif service == 'payment' and 'initiate' in endpoint:
            tx_id = f"tx_{uuid.uuid4().hex[:8]}"
            return {
                'transaction': {'id': tx_id, 'status': 'completed'},
                'paymentData': {'fawryCode': ''.join([str(random.randint(0, 9)) for _ in range(13)])}
            }

        elif service == 'delivery' and 'assign' in endpoint:
            return {
                'delivery': {'id': data.get('deliveryId'), 'status': 'assigned'},
                'driver': {'id': f"driver_{random.randint(1, 10)}", 'name': 'محمد السائق'}
            }

        elif service == 'notification' and 'send' in endpoint:
            return {'notification': {'id': f"notif_{uuid.uuid4().hex[:8]}", 'status': 'sent'}}

        elif service == 'delivery' and endpoint == '/api/drivers':
            driver_id = f"driver_{uuid.uuid4().hex[:8]}"
            return {'driver': {'id': driver_id, **data}}

        return {'success': True}

    def setup_drivers(self, count: int = 5):
        """Create initial drivers for delivery simulation"""
        print(f"\n🚗 Setting up {count} drivers...")

        driver_names = ['محمد أحمد', 'أحمد علي', 'عمر محمود', 'خالد إبراهيم', 'مصطفى حسن']
        vehicle_types = ['motorcycle', 'car', 'van']

        for i, name in enumerate(driver_names[:count]):
            result = self.call_service('delivery', '/api/drivers', data={
                'name': name,
                'nameAr': name,
                'phone': f'+20100{random.randint(1000000, 9999999)}',
                'vehicleType': random.choice(vehicle_types),
                'vehiclePlate': f'{random.randint(1000, 9999)} م ق {random.randint(1, 9)}'
            })
            if 'driver' in result:
                self.drivers.append(result['driver']['id'])
                print(f"   ✓ Driver: {name}")

    def create_product(self, sku: str, price: float, name: str = None) -> str:
        """Create or get a product"""
        if sku in self.products:
            return self.products[sku]['id']

        product_data = {
            'name': name or f'Product {sku}',
            'nameAr': f'منتج {sku}',
            'sku': sku,
            'price': price,
            'stock': 100,
            'categoryId': 'shoes',
            'merchantId': 'nowshoes'
        }

        result = self.call_service('product', '/api/products', data=product_data)
        if 'product' in result:
            self.products[sku] = result['product']
            self.stats.products_created += 1
            return result['product']['id']
        return None

    def create_user(self, phone: str, name: str) -> str:
        """Create or get a user"""
        clean_phone = ''.join(filter(str.isdigit, str(phone)))[-10:]

        if clean_phone in self.users:
            return self.users[clean_phone]

        result = self.call_service('user', '/api/users/register', data={
            'phone': f'+20{clean_phone}',
            'name': name,
            'email': f'{clean_phone}@haderos.temp'
        })

        if 'user' in result:
            self.users[clean_phone] = result['user']['id']
            self.stats.users_created += 1
            return result['user']['id']
        return None

    def process_order(self, order_data: Dict) -> Dict:
        """Process a single order through all services"""
        results = {
            'order_id': None,
            'payment_id': None,
            'delivery_id': None,
            'status': 'failed'
        }

        # 1. Create user
        user_id = self.create_user(order_data['phone'], order_data['customer_name'])
        if not user_id:
            return results

        # 2. Create products
        items = []
        for item in order_data.get('items', []):
            product_id = self.create_product(item['sku'], item.get('price', 350))
            if product_id:
                items.append({
                    'productId': product_id,
                    'quantity': item.get('quantity', 1),
                    'price': item.get('price', 350)
                })

        if not items:
            return results

        # 3. Create order
        order_result = self.call_service('order', '/api/orders', data={
            'userId': user_id,
            'items': items,
            'shippingAddress': {
                'city': order_data.get('city', ''),
                'address': order_data.get('address', ''),
                'phone': order_data.get('phone', '')
            },
            'totalAmount': order_data.get('total', sum(i['price'] * i['quantity'] for i in items)),
            'paymentMethod': 'cod'
        })

        if 'order' in order_result:
            results['order_id'] = order_result['order']['id']
            self.stats.orders_created += 1
            self.stats.total_revenue += order_data.get('total', 0)
        else:
            return results

        # 4. Process payment
        payment_result = self.call_service('payment', '/api/transactions/initiate', data={
            'orderId': results['order_id'],
            'userId': user_id,
            'amount': order_data.get('total', 0),
            'method': 'cod'
        })

        if 'transaction' in payment_result:
            results['payment_id'] = payment_result['transaction']['id']
            self.stats.payments_processed += 1

        # 5. Create delivery
        delivery_result = self.call_service('delivery', '/api/deliveries', data={
            'orderId': results['order_id'],
            'customerId': user_id,
            'customerName': order_data['customer_name'],
            'customerPhone': order_data['phone'],
            'pickupLocation': {'lat': 30.0444, 'lng': 31.2357, 'address': 'Cairo Warehouse'},
            'deliveryLocation': {
                'lat': 30.0 + random.uniform(-2, 2),
                'lng': 31.0 + random.uniform(-2, 2),
                'address': order_data.get('address', ''),
                'city': order_data.get('city', '')
            },
            'deliveryFee': self._get_delivery_fee(order_data.get('city', '')),
            'codAmount': order_data.get('total', 0)
        })

        if 'delivery' in delivery_result:
            results['delivery_id'] = delivery_result['delivery']['id']

            # 6. Auto-assign driver
            if self.drivers:
                assign_result = self.call_service('delivery', f'/api/deliveries/{results["delivery_id"]}/assign', data={
                    'auto': True
                })
                if 'delivery' in assign_result:
                    self.stats.deliveries_assigned += 1

        # 7. Send notification
        notif_result = self.call_service('notification', '/api/notifications/send', data={
            'userId': user_id,
            'type': 'order_placed',
            'channel': 'sms',
            'title': 'تم تأكيد طلبك',
            'titleAr': 'تم تأكيد طلبك',
            'body': f'رقم الطلب: {results["order_id"]}',
            'bodyAr': f'رقم الطلب: {results["order_id"]}'
        })

        if 'notification' in notif_result:
            self.stats.notifications_sent += 1

        results['status'] = 'success'
        return results

    def _get_delivery_fee(self, city: str) -> float:
        """Get delivery fee based on city"""
        for city_name, info in CITY_ZONES.items():
            if city_name in city or city in city_name:
                return info['delivery_fee']
        return 50  # Default

    def parse_excel_orders(self, filepath: str) -> List[Dict]:
        """Parse orders from Excel file"""
        orders = []

        try:
            df = pd.read_excel(filepath, engine='openpyxl')

            # Detect file type based on columns
            columns = list(df.columns)

            if 'Waybill' in columns:
                # Delivery file format
                for _, row in df.iterrows():
                    if pd.isna(row.get('Reciever Name')):
                        continue

                    items = []
                    product_desc = str(row.get('Pickup information', ''))
                    for part in product_desc.split(','):
                        if 'x' in part:
                            qty_sku = part.strip().split('x')
                            if len(qty_sku) >= 2:
                                items.append({
                                    'sku': qty_sku[1].strip(),
                                    'quantity': int(qty_sku[0].strip()) if qty_sku[0].strip().isdigit() else 1,
                                    'price': 350
                                })

                    orders.append({
                        'customer_name': row.get('Reciever Name', ''),
                        'phone': str(row.get("The receiver's phone", '')).replace('+20-', ''),
                        'city': row.get("Receiver's Area", ''),
                        'address': row.get('Receiver street', ''),
                        'total': float(row.get('COD amount', 0)) if not pd.isna(row.get('COD amount')) else 0,
                        'items': items if items else [{'sku': 'UNKNOWN', 'quantity': 1, 'price': 350}],
                        'waybill': row.get('Waybill', ''),
                        'status': row.get('Waybill status', '')
                    })

            elif 'رقم الاوردر' in columns:
                # Arabic order file format
                for _, row in df.iterrows():
                    if pd.isna(row.get('اسم المستلم')):
                        continue

                    items = []
                    for i in range(1, 6):
                        model_col = f'موديل {i}' if i > 1 else 'موديل 1'
                        qty_col = f'الكمية.{i-1}' if i > 1 else 'الكمية'

                        if model_col in columns and not pd.isna(row.get(model_col)):
                            qty = int(row.get(qty_col, 1)) if not pd.isna(row.get(qty_col)) else 1
                            items.append({
                                'sku': str(row.get(model_col)),
                                'quantity': qty,
                                'price': 350
                            })

                    total_str = str(row.get('السعر الكلي بالشحن', 0))
                    total = float(''.join(filter(lambda x: x.isdigit() or x == '.', total_str))) if total_str else 0

                    orders.append({
                        'customer_name': row.get('اسم المستلم', ''),
                        'phone': str(row.get('الهاتف  1', '')),
                        'city': row.get('المدينة', ''),
                        'address': row.get('العنوان', ''),
                        'total': total,
                        'items': items if items else [{'sku': 'UNKNOWN', 'quantity': 1, 'price': 350}],
                        'order_id': row.get('رقم الاوردر', ''),
                        'status': row.get('الحالة', '')
                    })

        except Exception as e:
            print(f"❌ Error parsing {filepath}: {e}")

        return orders

    def run_simulation(self, excel_files: List[str], limit: int = None):
        """Run the full simulation"""
        self.stats.start_time = datetime.now()

        print("\n" + "="*60)
        print("🚀 HADEROS MICROSERVICES SIMULATION")
        print("="*60)
        print(f"Mode: {'MOCK' if self.mock_mode else 'LIVE'}")
        print(f"Started at: {self.stats.start_time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Setup drivers
        self.setup_drivers(5)

        # Process each file
        all_orders = []
        for filepath in excel_files:
            if os.path.exists(filepath):
                print(f"\n📁 Reading: {os.path.basename(filepath)}")
                orders = self.parse_excel_orders(filepath)
                print(f"   Found {len(orders)} orders")
                all_orders.extend(orders)

        if limit:
            all_orders = all_orders[:limit]

        print(f"\n📊 Processing {len(all_orders)} orders...")
        print("-"*60)

        # Process orders
        for i, order in enumerate(all_orders, 1):
            result = self.process_order(order)
            status_icon = "✅" if result['status'] == 'success' else "❌"
            print(f"{status_icon} [{i}/{len(all_orders)}] {order['customer_name'][:20]:20} | {order.get('city', '')[:15]:15} | {order.get('total', 0):>8.0f} EGP")

        self.stats.end_time = datetime.now()

        # Print summary
        print("\n" + "="*60)
        print("📈 SIMULATION RESULTS")
        print("="*60)
        summary = self.stats.summary()
        for key, value in summary.items():
            print(f"   {key.replace('_', ' ').title():.<30} {value}")

        if self.stats.errors:
            print(f"\n⚠️ Errors ({len(self.stats.errors)}):")
            for err in self.stats.errors[:5]:
                print(f"   - {err}")

        print("\n" + "="*60)
        return summary


def main():
    # Define Excel files to process
    excel_files = [
        'data/deliveries/تسليمات 12و13و14 يوم 16.12.xlsx',
        'data/archive/pasted_file_3RXuB6_طلب15-12.xlsx'
    ]

    # Run simulation in mock mode (no actual services needed)
    simulator = HADEROSSimulator(mock_mode=True)

    # Limit to 50 orders for demo
    results = simulator.run_simulation(excel_files, limit=50)

    # Save results
    with open('simulation_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Results saved to simulation_results.json")


if __name__ == '__main__':
    main()
