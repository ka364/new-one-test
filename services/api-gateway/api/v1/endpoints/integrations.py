"""

Integrations API Endpoints

Shopify, Shipping, and Notifications

"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.core.database import get_db
from backend.core.models.order import Order, OrderStatus
from integrations.shopify.client import get_shopify_client
from integrations.shipping.aramex import get_aramex_client
from integrations.shipping.smsa import get_smsa_client
from integrations.notifications.sms import send_order_sms
from integrations.notifications.email import send_order_email

router = APIRouter()


# Pydantic Models
class ShopifyWebhookPayload(BaseModel):
    id: int
    email: str
    created_at: str
    updated_at: str
    total_price: str
    subtotal_price: str
    total_tax: str
    currency: str
    financial_status: str
    fulfillment_status: Optional[str]
    line_items: List[dict]
    shipping_address: Optional[dict]
    billing_address: Optional[dict]


class ShippingRateRequest(BaseModel):
    origin_country: str
    origin_city: str
    destination_country: str
    destination_city: str
    weight: float
    dimensions: Optional[dict] = None


class ShippingRateResponse(BaseModel):
    provider: str
    service: str
    cost: float
    currency: str
    estimated_days: int


class NotificationRequest(BaseModel):
    order_id: str
    customer_phone: str
    customer_email: str
    message: str
    notification_type: str  # 'order_created', 'order_shipped', 'order_delivered'


# Shopify Integration Endpoints
@router.post("/shopify/webhook/order-created")
async def shopify_order_webhook(
    payload: ShopifyWebhookPayload,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Handle Shopify order creation webhook"""
    try:
        # Verify webhook (implement HMAC verification)
        # For now, assume valid

        # Create order in our system
        order_data = {
            'shopify_order_id': str(payload.id),
            'customer_email': payload.email,
            'total_amount': float(payload.total_price),
            'currency': payload.currency,
            'status': OrderStatus.PENDING,
            'items': payload.line_items,
            'shipping_address': payload.shipping_address,
            'billing_address': payload.billing_address
        }

        # Save to database (implement order creation logic)
        # order = create_order_from_shopify(db, order_data)

        # Send notifications
        background_tasks.add_task(
            send_order_sms,
            payload.id,
            "تم استلام طلبك بنجاح! رقم الطلب: " + str(payload.id)
        )

        background_tasks.add_task(
            send_order_email,
            payload.email,
            "تأكيد الطلب",
            f"تم استلام طلبك رقم {payload.id} بنجاح"
        )

        return {"status": "success", "order_id": payload.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shopify/orders/{order_id}")
async def get_shopify_order(order_id: str):
    """Get order details from Shopify"""
    try:
        client = get_shopify_client()
        order = client.get_order(order_id)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shopify/orders/{order_id}/fulfill")
async def fulfill_shopify_order(order_id: str, tracking_info: dict):
    """Fulfill order in Shopify"""
    try:
        client = get_shopify_client()
        result = client.fulfill_order(order_id, tracking_info)
        return {"status": "fulfilled", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Shipping Integration Endpoints
@router.post("/shipping/rates")
async def get_shipping_rates(request: ShippingRateRequest):
    """Get shipping rates from multiple providers with circuit breaker"""
    try:
        rates = []

        # Aramex rates with circuit breaker
        aramex_client = get_aramex_client()
        if aramex_client:
            try:
                aramex_rates = await aramex_client.get_rates(
                    request.origin_country,
                    request.origin_city,
                    request.destination_country,
                    request.destination_city,
                    request.weight
                )
                rates.extend(aramex_rates)
            except Exception as e:
                # Log error but continue with other providers
                print(f"Aramex rates failed: {e}")

        # SMSA rates (synchronous for now)
        smsa_client = get_smsa_client()
        if smsa_client:
            try:
                smsa_rates = smsa_client.get_rates(
                    request.origin_country,
                    request.origin_city,
                    request.destination_country,
                    request.destination_city,
                    request.weight
                )
                rates.extend(smsa_rates)
            except Exception as e:
                print(f"SMSA rates failed: {e}")

        if not rates:
            raise HTTPException(status_code=503, detail="All shipping providers unavailable")

        return {"rates": rates}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shipping/aramex/create-shipment")
async def create_aramex_shipment(shipment_data: dict):
    """Create shipment with Aramex using circuit breaker"""
    try:
        client = get_aramex_client()
        if not client:
            raise HTTPException(status_code=503, detail="Aramex service not configured")

        result = await client.create_shipment(shipment_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shipping/smsa/create-shipment")
async def create_smsa_shipment(shipment_data: dict):
    """Create shipment with SMSA"""
    try:
        client = get_smsa_client()
        result = client.create_shipment(shipment_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shipping/track/{tracking_number}")
async def track_shipment(tracking_number: str, provider: str = "aramex"):
    """Track shipment with circuit breaker protection"""
    try:
        if provider == "aramex":
            client = get_aramex_client()
            if not client:
                raise HTTPException(status_code=503, detail="Aramex service not configured")
            tracking_info = await client.track_shipment(tracking_number)
        elif provider == "smsa":
            client = get_smsa_client()
            if not client:
                raise HTTPException(status_code=503, detail="SMSA service not configured")
            tracking_info = client.track_shipment(tracking_number)
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")

        return tracking_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Notifications Endpoints
@router.post("/notifications/send")
async def send_notification(
    notification: NotificationRequest,
    background_tasks: BackgroundTasks
):
    """Send SMS and Email notifications"""
    try:
        # Send SMS
        if notification.customer_phone:
            sms_message = f"تحديث الطلب {notification.order_id}: {notification.message}"
            background_tasks.add_task(send_order_sms, notification.order_id, sms_message)

        # Send Email
        if notification.customer_email:
            email_subject = f"تحديث طلب #{notification.order_id}"
            background_tasks.add_task(
                send_order_email,
                notification.customer_email,
                email_subject,
                notification.message
            )

        return {"status": "notifications_queued"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/test")
async def test_notifications():
    """Test notification services"""
    try:
        # Test SMS
        sms_result = send_order_sms("TEST123", "رسالة اختبار من HaderOS")

        # Test Email
        email_result = send_order_email(
            "test@example.com",
            "اختبار HaderOS",
            "هذه رسالة اختبار من نظام HaderOS"
        )

        return {
            "sms_test": "success" if sms_result else "failed",
            "email_test": "success" if email_result else "failed"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Configuration Endpoints
@router.get("/config/status")
async def get_integration_status():
    """Get status of all integrations"""
    try:
        status = {
            "shopify": {
                "configured": bool(get_shopify_client()),
                "status": "active" if get_shopify_client() else "not_configured"
            },
            "aramex": {
                "configured": bool(get_aramex_client()),
                "status": "active" if get_aramex_client() else "not_configured",
                "circuit_breaker": get_aramex_client().get_circuit_status() if get_aramex_client() else None
            },
            "smsa": {
                "configured": bool(get_smsa_client()),
                "status": "active" if get_smsa_client() else "not_configured"
            },
            "sms_notifications": {
                "configured": True,  # Assume configured if module loads
                "status": "active"
            },
            "email_notifications": {
                "configured": True,
                "status": "active"
            }
        }

        return {"integrations": status}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitoring/circuit-breakers")
async def get_circuit_breaker_status():
    """Get status of all circuit breakers"""
    try:
        from integrations.shipping.circuit_breaker import get_circuit_monitor
        monitor = get_circuit_monitor()
        status = monitor.get_all_status()
        alerts = monitor.check_alerts()

        return {
            "circuit_breakers": status,
            "alerts": alerts,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))