# HaderOS Resilience System

نظام المرونة الشامل لمنصة HaderOS - يوفر قدرات متقدمة للتعامل مع الأعطال والحفاظ على استمرارية الخدمة.

## المكونات

### 1. Local Queue Fallback (الطوابير المحلية للعمليات الفاشلة)

نظام طوابير مبني على Redis لتخزين العمليات الفاشلة وإعادة محاولتها عند عودة الخدمات.

**الميزات:**
- طوابير منفصلة لكل نوع عملية (الطلبات، الشحن، الإشعارات)
- إعادة محاولة ذكية مع backoff أسي
- تتبع حالة العمليات وإحصائيات الأداء
- دعم الأولويات للعمليات الحرجة

**الاستخدام:**
```python
from services.api_gateway.integrations.resilience import LocalQueueFallback

queue_system = LocalQueueFallback()

# وضع عملية فاشلة في الطابور
await queue_system.queue_failed_operation(
    operation="create_order",
    data=order_data,
    service_name="shopify",
    error="Connection timeout"
)

# الحصول على حالة النظام
status = await queue_system.get_system_status()
```

### 2. Health Check System (نظام مراقبة الصحة)

نظام شامل لمراقبة صحة جميع الخدمات المتكاملة مع تتبع الأداء والأعطال.

**الميزات:**
- فحوصات صحة تلقائية لجميع الخدمات
- تتبع نسبة الجهوزية والأداء
- تنبيهات عند الأعطال المتكررة
- حفظ البيانات في Redis للاستمرارية

**الاستخدام:**
```python
from services.api_gateway.integrations.resilience import health_checker, ServiceConfig

# تسجيل خدمة للمراقبة
config = ServiceConfig(
    name="shopify",
    check_interval=30,  # ثانية
    timeout=10,
    health_check_url="https://shopify-api.com/health"
)

health_checker.register_service(config)

# بدء المراقبة
await health_checker.start_monitoring()

# التحقق من صحة خدمة
is_healthy = health_checker.is_service_healthy("shopify")
```

### 3. Chaos Engineering (هندسة الفوضى)

نظام لإدخال أعطال محكومة لاختبار مرونة النظام وتحديد نقاط الضعف.

**الميزات:**
- سيناريوهات اختبار محددة مسبقاً
- إدخال تأخيرات الشبكة وعطل الخدمات
- اختبار استنزاف الموارد
- سيناريوهات "يوم اللعبة" الجاهزة

**الاستخدام:**
```python
from services.api_gateway.integrations.resilience import chaos_system

# تفعيل نظام الفوضى (فقط في البيئات التجريبية)
chaos_system.enable_chaos()

# الحصول على monkey للخدمة
monkey = chaos_system.get_chaos_monkey("shopify")

# إدخال تأخير شبكي
experiment_id = await monkey.inject_network_delay(
    delay_ms=1000,  # 1 ثانية تأخير
    duration_seconds=300  # 5 دقائق
)

# تشغيل سيناريو جاهز
results = await chaos_system.run_game_days_scenario("network_storm")
```

## السيناريوهات الجاهزة

### Network Storm (عاصفة شبكية)
- إدخال تأخيرات عشوائية وأعطال شبكية عبر جميع الخدمات
- مدة: 5 دقائق للتأخيرات، 3 دقائق للأعطال

### Service Cascade (تسلسل أعطال الخدمات)
- بدء بفشل خدمة رئيسية ثم انتشار الفشل للخدمات الأخرى
- يحاكي سيناريوهات الأعطال المتسلسلة

### Resource Crunch (ضغط الموارد)
- استنزاف الذاكرة والمعالج لدى خدمات محددة
- يختبر قدرة النظام على التعامل مع ضغط الموارد

### Total Blackout (انقطاع كامل)
- فشل جميع الخدمات بنسبة 100%
- يختبر آليات الطوارئ والتعافي الكامل

## التكامل مع Adapter Pattern

يعمل نظام المرونة كطبقة إضافية فوق Adapter Pattern المطبق مسبقاً:

1. **Circuit Breaker**: يحمي من الأعطال المتكررة
2. **Local Queue**: يخزن العمليات الفاشلة لإعادة المحاولة
3. **Health Monitoring**: يراقب صحة الخدمات
4. **Chaos Engineering**: يختبر المرونة تحت ضغط

## المراقبة والمقاييس

### مقاييس الطوابير
- عدد العمليات المعلقة والمكتملة والفاشلة
- متوسط وقت إعادة المحاولة
- معدل نجاح إعادة المحاولات

### مقاييس الصحة
- نسبة الجهوزية لكل خدمة
- متوسط وقت الاستجابة
- عدد الأعطال المتتالية

### مقاييس الفوضى
- عدد التجارب النشطة
- تأثير كل تجربة على الأداء
- معدل تعافي النظام

## الأمان والحماية

- **البيئات المحمية**: نظام الفوضى يعمل فقط في البيئات التجريبية
- **حدود الأمان**: حدود زمنية ومعدلية لمنع الإفراط في الاختبار
- **إيقاف طوارئ**: إمكانية إيقاف جميع التجارب فوراً
- **تسجيل شامل**: جميع الأحداث والتغييرات مسجلة للمراجعة

## الاعتمادات

- **Redis**: لتخزين الطوابير وحالة الصحة
- **asyncio**: للعمليات غير المتزامنة
- **structlog**: للتسجيل المنظم
- **httpx**: لفحوصات الصحة عبر HTTP

## الاختبار

```bash
# تشغيل اختبارات المرونة
pytest tests/test_resilience/

# تشغيل اختبارات الفوضى (في بيئة آمنة فقط)
pytest tests/test_chaos_engineering/
```

## الاستخدام في الإنتاج

⚠️ **تحذير**: نظام الفوضى مخصص للبيئات التجريبية فقط. لا تقم بتفعيله في الإنتاج.

للاستخدام في الإنتاج، ركز على:
- مراقبة الصحة
- إدارة الطوابير
- إحصائيات الأداء

النظام مصمم ليعمل تلقائياً دون تدخل يدوي في معظم الحالات.