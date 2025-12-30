# 🔄 Circuit Breaker Pattern Implementation in HaderOS

## نظرة عامة

تم تنفيذ نمط **Circuit Breaker** في نظام HaderOS لتوفير مرونة عالية في التعامل مع التكاملات الخارجية. هذا النمط يحمي النظام من فشل الخدمات الخارجية ويوفر آليات استرداد تلقائية.

## كيف يعمل Circuit Breaker؟

### الحالات الثلاث:
- **🔒 CLOSED**: العمل الطبيعي - الطلبات تمر عبر النظام
- **🔓 OPEN**: الخدمة تفشل - الطلبات تفشل فوراً (Fail Fast)
- **🔄 HALF_OPEN**: اختبار الاسترداد - تجربة بعض الطلبات

### المعايير:
- **عتبة الفشل**: 3 فشل متتالي → OPEN
- **مهلة الاسترداد**: 120 ثانية قبل المحاولة مرة أخرى
- **عتبة النجاح**: 2 نجاح متتالي → CLOSED

## الاستخدام في HaderOS

### 1. تكامل Aramex المحمي

```python
from integrations.shipping.aramex import get_aramex_client

# الحصول على العميل المحمي
client = get_aramex_client()

# استخدام مع حماية Circuit Breaker
try:
    rates = await client.get_rates("SA", "Riyadh", "AE", "Dubai", 1.5)
    print("Rates:", rates)
except CircuitBreakerOpenException as e:
    print("Aramex unavailable:", e)
    # التحويل التلقائي إلى SMSA
```

### 2. مراقبة حالة Circuit Breaker

```bash
# التحقق من حالة جميع Circuit Breakers
curl http://localhost:8000/api/v1/integrations/monitoring/circuit-breakers
```

**الرد المثالي:**
```json
{
  "circuit_breakers": {
    "aramex": {
      "state": "closed",
      "failure_count": 0,
      "success_count": 0,
      "last_failure_time": null,
      "time_since_last_failure": 0,
      "should_attempt_reset": false
    }
  },
  "alerts": [],
  "timestamp": "2025-12-28T10:30:00"
}
```

### 3. التعامل مع الأعطال

#### سيناريو: Aramex يفشل
1. **الكشف**: Circuit Breaker يكتشف 3 فشل متتالي
2. **الانتقال**: الحالة تتغير إلى OPEN
3. **الحماية**: الطلبات الجديدة تفشل فوراً
4. **الاسترداد**: بعد 120 ثانية، ينتقل إلى HALF_OPEN
5. **الاختبار**: يسمح ببعض الطلبات للاختبار
6. **العودة**: عند النجاح، يعود إلى CLOSED

## API Endpoints الجديدة

### مراقبة Circuit Breaker
```
GET /api/v1/integrations/monitoring/circuit-breakers
```
- يعرض حالة جميع Circuit Breakers
- يظهر التنبيهات النشطة
- يساعد في استكشاف الأخطاء

### تكامل Aramex المحسن
```
POST /api/v1/integrations/shipping/rates
```
- يجرب Aramex أولاً مع Circuit Breaker
- عند الفشل، ينتقل تلقائياً إلى SMSA
- يضمن استمرارية الخدمة

## فوائد التنفيذ

### 1. **استقرار النظام**
- منع انتشار الفشل من خدمة خارجية
- حماية الموارد النظامية
- تحسين تجربة المستخدم

### 2. **استرداد تلقائي**
- لا حاجة لتدخل يدوي
- عودة سريعة للخدمة الطبيعية
- تقليل وقت التوقف

### 3. **مراقبة متقدمة**
- رؤية فورية لحالة الخدمات
- تنبيهات مبكرة للمشاكل
- بيانات للتحليل والتحسين

## مثال عملي: طلب شحن محمي

```python
@app.post("/orders/{order_id}/ship")
async def ship_order(order_id: str):
    # محاولة Aramex أولاً
    aramex = get_aramex_client()
    try:
        shipment = await aramex.create_shipment(order_data)
        return {"provider": "aramex", "tracking": shipment["tracking_number"]}
    except CircuitBreakerOpenException:
        # التحويل إلى SMSA
        smsa = get_smsa_client()
        shipment = smsa.create_shipment(order_data)
        return {"provider": "smsa", "tracking": shipment["tracking_number"], "fallback": True}
```

## التكوين

### متغيرات البيئة
```env
# Circuit Breaker Settings (اختياري)
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=120
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
```

### مراقبة مستمرة
- استخدم `/integrations/monitoring/circuit-breakers` في لوحة التحكم
- ربط مع أنظمة التنبيه (Slack, Email)
- تسجيل المقاييس في Prometheus

## الخلاصة

Circuit Breaker Pattern حوّل "التكامل متعدد الموردين" من ضعف إلى قوة. النظام الآن:
- **أكثر مرونة** في مواجهة الأعطال
- **أكثر استقراراً** في التشغيل
- **أسهل مراقبة** وصيانة

هذا التنفيذ يضع HaderOS في المقدمة من حيث المعمارية المرنة والموثوقة.