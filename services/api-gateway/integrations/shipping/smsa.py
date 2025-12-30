"""

SMSA Shipping Integration

Handles shipment creation, tracking, and rate calculation via SOAP API

"""

import os
import requests
from typing import Dict, List, Optional, Any
from xml.etree import ElementTree as ET


class SMSAClient:
    """SMSA API client for shipping operations"""

    def __init__(self, username: str, password: str, account_number: str, passkey: str):
        self.username = username
        self.password = password
        self.account_number = account_number
        self.passkey = passkey

        # SMSA API endpoints
        self.base_url = "http://track.smsaexpress.com/SeCom/SMSAwebService.asmx"

    def _make_soap_request(self, action: str, soap_body: str) -> str:
        """Make SOAP request to SMSA"""
        headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': f'http://track.smsaexpress.com/secom/{action}'
        }

        soap_envelope = f"""<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    {soap_body}
  </soap:Body>
</soap:Envelope>"""

        try:
            response = requests.post(self.base_url, data=soap_envelope, headers=headers, timeout=30)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            raise Exception(f"SMSA API request failed: {str(e)}")

    def _parse_soap_response(self, response_xml: str, result_tag: str) -> Optional[str]:
        """Parse SOAP response XML"""
        try:
            root = ET.fromstring(response_xml)
            # Find the result tag in SOAP body
            result = root.find(f'.//{result_tag}')
            return result.text if result is not None else None
        except ET.ParseError:
            return None

    def get_rates(self, origin_country: str, origin_city: str,
                  destination_country: str, destination_city: str,
                  weight: float) -> List[Dict]:
        """Get shipping rates - SMSA doesn't have public rate API, return estimated rates"""
        # SMSA doesn't provide public rate calculation API
        # Return estimated rates based on weight and distance
        estimated_cost = weight * 15  # SAR per kg, approximate

        return [{
            'provider': 'smsa',
            'service': 'Standard',
            'cost': estimated_cost,
            'currency': 'SAR',
            'estimated_days': 2 if origin_country == destination_country else 5
        }]

    def create_shipment(self, shipment_data: Dict) -> Dict:
        """Create new shipment via SMSA SOAP API"""
        soap_body = f"""
<addShipment>
  <passKey>{self.passkey}</passKey>
  <refNo>{shipment_data.get('reference', '')}</refNo>
  <sentDate>{shipment_data.get('sent_date', '')}</sentDate>
  <idNo>{shipment_data.get('id_no', '')}</idNo>
  <cName>{shipment_data.get('customer_name', '')}</cName>
  <cntry>{shipment_data.get('country', '')}</cntry>
  <cCity>{shipment_data.get('city', '')}</cCity>
  <cZip>{shipment_data.get('zip', '')}</cZip>
  <cPOBox>{shipment_data.get('po_box', '')}</cPOBox>
  <cMobile>{shipment_data.get('mobile', '')}</cMobile>
  <cTel1>{shipment_data.get('tel1', '')}</cTel1>
  <cTel2>{shipment_data.get('tel2', '')}</cTel2>
  <cAddr1>{shipment_data.get('address1', '')}</cAddr1>
  <cAddr2>{shipment_data.get('address2', '')}</cAddr2>
  <shipType>{shipment_data.get('ship_type', 'DLV')}</shipType>
  <PCs>{shipment_data.get('pieces', 1)}</PCs>
  <cEmail>{shipment_data.get('email', '')}</cEmail>
  <carrValue>{shipment_data.get('value', 0)}</carrValue>
  <carrCurr>{shipment_data.get('currency', 'SAR')}</carrCurr>
  <codAmt>{shipment_data.get('cod_amount', 0)}</codAmt>
  <weight>{shipment_data.get('weight', 1.0)}</weight>
  <custVal>{shipment_data.get('customs_value', 0)}</custVal>
  <custCurr>{shipment_data.get('customs_currency', 'SAR')}</custCurr>
  <insrAmt>{shipment_data.get('insurance', 0)}</insrAmt>
  <insrCurr>{shipment_data.get('insurance_currency', 'SAR')}</insrCurr>
  <itemDesc>{shipment_data.get('description', 'Goods')}</itemDesc>
  <sName>{shipment_data.get('shipper_name', '')}</sName>
  <sContact>{shipment_data.get('shipper_contact', '')}</sContact>
  <sAddr1>{shipment_data.get('shipper_address1', '')}</sAddr1>
  <sAddr2>{shipment_data.get('shipper_address2', '')}</sAddr2>
  <sCity>{shipment_data.get('shipper_city', '')}</sCity>
  <sPhone>{shipment_data.get('shipper_phone', '')}</sPhone>
  <sCntry>{shipment_data.get('shipper_country', '')}</sCntry>
  <prefDelvDate>{shipment_data.get('preferred_delivery_date', '')}</prefDelvDate>
  <gpsPoints>{shipment_data.get('gps_points', '')}</gpsPoints>
</addShipment>"""

        response_xml = self._make_soap_request('addShipment', soap_body)
        awb_no = self._parse_soap_response(response_xml, 'awbNo')

        if awb_no:
            return {
                'tracking_number': awb_no,
                'status': 'created',
                'provider': 'smsa'
            }
        else:
            error_msg = self._parse_soap_response(response_xml, 'error')
            raise Exception(f"SMSA shipment creation failed: {error_msg or 'Unknown error'}")

    def track_shipment(self, tracking_number: str) -> Dict:
        """Track shipment by AWB number"""
        soap_body = f"""
<getTracking>
  <passKey>{self.passkey}</passKey>
  <awbNo>{tracking_number}</awbNo>
</getTracking>"""

        response_xml = self._make_soap_request('getTracking', soap_body)

        # Parse tracking response
        try:
            root = ET.fromstring(response_xml)
            tracking_data = root.find('.//getTrackingResponse/getTrackingResult')

            if tracking_data is not None:
                status = tracking_data.find('status')
                date = tracking_data.find('date')
                activity = tracking_data.find('activity')
                location = tracking_data.find('location')

                return {
                    'tracking_number': tracking_number,
                    'status': status.text if status is not None else 'Unknown',
                    'date': date.text if date is not None else '',
                    'activity': activity.text if activity is not None else '',
                    'location': location.text if location is not None else '',
                    'provider': 'smsa'
                }
            else:
                return {
                    'tracking_number': tracking_number,
                    'status': 'Not found',
                    'provider': 'smsa'
                }

        except ET.ParseError:
            return {
                'tracking_number': tracking_number,
                'status': 'Parse error',
                'provider': 'smsa'
            }


def get_smsa_client() -> Optional[SMSAClient]:
    """Get configured SMSA client"""
    username = os.getenv('SMSA_USERNAME')
    password = os.getenv('SMSA_PASSWORD')
    account_number = os.getenv('SMSA_ACCOUNT_NUMBER')
    passkey = os.getenv('SMSA_PASSKEY')

    if not all([username, password, account_number, passkey]):
        return None

    return SMSAClient(
        username=username,
        password=password,
        account_number=account_number,
        passkey=passkey
    )