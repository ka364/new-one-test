"""

Aramex Shipping Integration with Circuit Breaker Resilience

Handles shipment creation, tracking, and rate calculation with built-in fault tolerance

"""

import os
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime

# Import circuit breaker
from .circuit_breaker import ResilientAramexClient, get_circuit_monitor


class AramexClient:
    """Aramex API client for shipping operations"""

    def __init__(self, username: str, password: str, account_number: str,
                 account_pin: str, account_entity: str, account_country_code: str):
        self.username = username
        self.password = password
        self.account_number = account_number
        self.account_pin = account_pin
        self.account_entity = account_entity
        self.account_country_code = account_country_code

        # Aramex API endpoints
        self.base_url = "https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json"
        self.tracking_url = "https://ws.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc/json"

    def _get_auth_header(self) -> Dict[str, str]:
        """Get authentication header for API requests"""
        return {
            "Username": self.username,
            "Password": self.password,
            "AccountNumber": self.account_number,
            "AccountPin": self.account_pin,
            "AccountEntity": self.account_entity,
            "AccountCountryCode": self.account_country_code
        }

    def _make_request(self, endpoint: str, data: Dict) -> Dict:
        """Make API request to Aramex"""
        url = f"{self.base_url}/{endpoint}"

        payload = {
            **self._get_auth_header(),
            **data
        }

        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()

            # Check for API errors
            if result.get('HasErrors', False):
                errors = result.get('Notifications', [])
                error_messages = [err.get('Message', 'Unknown error') for err in errors]
                raise Exception(f"Aramex API errors: {', '.join(error_messages)}")

            return result

        except requests.exceptions.RequestException as e:
            raise Exception(f"Aramex API request failed: {str(e)}")

    def get_rates(self, origin_country: str, origin_city: str,
                  destination_country: str, destination_city: str,
                  weight: float) -> List[Dict]:
        """Get shipping rates"""
        data = {
            "OriginAddress": {
                "CountryCode": origin_country,
                "City": origin_city
            },
            "DestinationAddress": {
                "CountryCode": destination_country,
                "City": destination_city
            },
            "ShipmentDetails": {
                "Weight": weight,
                "NumberOfPieces": 1
            }
        }

        result = self._make_request("CalculateRate", data)

        if result.get('RateDetails', []):
            rates = []
            for rate_detail in result['RateDetails']:
                rates.append({
                    'provider': 'aramex',
                    'service': rate_detail.get('ServiceType', 'Standard'),
                    'cost': float(rate_detail.get('TotalAmount', 0)),
                    'currency': rate_detail.get('CurrencyCode', 'SAR'),
                    'estimated_days': rate_detail.get('DeliveryTime', 3)
                })
            return rates

        return []

    def create_shipment(self, shipment_data: Dict) -> Dict:
        """Create new shipment"""
        # Prepare shipment details
        shipment = {
            "Shipper": {
                "AccountNumber": self.account_number,
                "PartyAddress": shipment_data.get('shipper_address', {}),
                "Contact": shipment_data.get('shipper_contact', {})
            },
            "Consignee": {
                "PartyAddress": shipment_data.get('consignee_address', {}),
                "Contact": shipment_data.get('consignee_contact', {})
            },
            "Details": {
                "ActualWeight": shipment_data.get('weight', 1.0),
                "ProductGroup": shipment_data.get('product_group', 'DOM'),
                "ProductType": shipment_data.get('product_type', 'OND'),
                "PaymentType": shipment_data.get('payment_type', 'P'),
                "NumberOfPieces": shipment_data.get('pieces', 1),
                "DescriptionOfGoods": shipment_data.get('description', 'Goods'),
                "GoodsOriginCountry": shipment_data.get('origin_country', 'SA'),
                "CashOnDeliveryAmount": shipment_data.get('cod_amount'),
                "InsuranceAmount": shipment_data.get('insurance_amount'),
                "CurrencyCode": shipment_data.get('currency', 'SAR')
            },
            "Reference1": shipment_data.get('reference1', ''),
            "Reference2": shipment_data.get('reference2', ''),
            "Reference3": shipment_data.get('reference3', '')
        }

        result = self._make_request("CreateShipments", {"Shipments": [shipment]})

        if result.get('Shipments', []):
            shipment_result = result['Shipments'][0]
            return {
                'tracking_number': shipment_result.get('ID', ''),
                'label_url': shipment_result.get('ShipmentLabel', {}).get('LabelURL', ''),
                'has_errors': shipment_result.get('HasErrors', False),
                'notifications': shipment_result.get('Notifications', [])
            }

        return {}

    def track_shipment(self, tracking_number: str) -> Dict:
        """Track shipment by tracking number"""
        url = f"{self.tracking_url}/TrackShipments"

        payload = {
            **self._get_auth_header(),
            "Shipments": [tracking_number]
        }

        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()

            if result.get('HasErrors', False):
                errors = result.get('Notifications', [])
                error_messages = [err.get('Message', 'Unknown error') for err in errors]
                raise Exception(f"Aramex tracking errors: {', '.join(error_messages)}")

            if result.get('TrackingResults', []):
                tracking_result = result['TrackingResults'][0]
                return {
                    'tracking_number': tracking_number,
                    'status': tracking_result.get('UpdateDescription', 'Unknown'),
                    'location': tracking_result.get('UpdateLocation', ''),
                    'timestamp': tracking_result.get('UpdateDateTime', ''),
                    'events': tracking_result.get('TrackingEvents', [])
                }

            return {'tracking_number': tracking_number, 'status': 'Not found'}

        except requests.exceptions.RequestException as e:
            raise Exception(f"Aramex tracking request failed: {str(e)}")


def get_aramex_client() -> Optional[ResilientAramexClient]:
    """Get configured resilient Aramex client with circuit breaker"""
    username = os.getenv('ARAMEX_USERNAME')
    password = os.getenv('ARAMEX_PASSWORD')
    account_number = os.getenv('ARAMEX_ACCOUNT_NUMBER')
    account_pin = os.getenv('ARAMEX_ACCOUNT_PIN')
    account_entity = os.getenv('ARAMEX_ACCOUNT_ENTITY')
    account_country_code = os.getenv('ARAMEX_ACCOUNT_COUNTRY_CODE', 'SA')

    if not all([username, password, account_number, account_pin, account_entity]):
        return None

    # Create regular client
    regular_client = AramexClient(
        username=username,
        password=password,
        account_number=account_number,
        account_pin=account_pin,
        account_entity=account_entity,
        account_country_code=account_country_code
    )

    # Wrap with resilience
    resilient_client = ResilientAramexClient(regular_client)

    # Register for monitoring
    monitor = get_circuit_monitor()
    monitor.register_breaker("aramex", resilient_client.circuit_breaker.circuit_breaker)

    return resilient_client