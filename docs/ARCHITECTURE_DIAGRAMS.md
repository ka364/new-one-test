# 🏗️ مخططات البنية - HADEROS AI Cloud
# Architecture Diagrams

---

## 📊 نظرة عامة على النظام

```mermaid
graph TB
    subgraph "🌐 Frontend"
        UI[React UI]
        Dashboard[Bio Dashboard]
        Admin[Admin Panel]
    end

    subgraph "🔌 API Layer"
        tRPC[tRPC Router]
        Auth[Auth Middleware]
        RateLimit[Rate Limiter]
    end

    subgraph "⚙️ Business Logic"
        OrderService[Order Service]
        PaymentService[Payment Service]
        ShippingService[Shipping Service]
        BNPLService[BNPL Service]
        WhatsAppService[WhatsApp Service]
    end

    subgraph "🧬 Bio-Modules"
        Tardigrade[Tardigrade]
        Chameleon[Chameleon]
        Cephalopod[Cephalopod]
        Mycelium[Mycelium]
    end

    subgraph "🗄️ Data Layer"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    subgraph "🔗 External Services"
        Shopify[Shopify API]
        Bosta[Bosta API]
        InstaPay[InstaPay API]
        PayMob[PayMob API]
        WhatsApp[WhatsApp API]
    end

    UI --> tRPC
    Dashboard --> tRPC
    Admin --> tRPC

    tRPC --> Auth
    Auth --> RateLimit

    RateLimit --> OrderService
    RateLimit --> PaymentService
    RateLimit --> ShippingService
    RateLimit --> BNPLService
    RateLimit --> WhatsAppService

    OrderService --> PostgreSQL
    PaymentService --> PostgreSQL
    ShippingService --> PostgreSQL

    OrderService --> Tardigrade
    PaymentService --> Chameleon
    ShippingService --> Cephalopod
    WhatsAppService --> Mycelium

    ShippingService --> Bosta
    PaymentService --> InstaPay
    PaymentService --> PayMob
    WhatsAppService --> WhatsApp
    OrderService --> Shopify

    Tardigrade --> Redis
    Chameleon --> Redis
```

---

## 📦 دورة حياة الطلب (Order Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> Pending: إنشاء طلب جديد

    Pending --> Confirmed: تأكيد الطلب
    Pending --> Cancelled: إلغاء

    Confirmed --> Processing: بدء التجهيز
    Confirmed --> Cancelled: إلغاء

    Processing --> Shipped: تسليم للشحن
    Processing --> Cancelled: إلغاء

    Shipped --> OutForDelivery: خارج للتوصيل
    Shipped --> Returned: إرجاع

    OutForDelivery --> Delivered: تم التوصيل
    OutForDelivery --> Returned: إرجاع

    Delivered --> [*]
    Cancelled --> [*]
    Returned --> [*]
```

---

## 💳 مسار الدفع (Payment Flow)

```mermaid
sequenceDiagram
    participant C as العميل
    participant UI as Frontend
    participant API as tRPC API
    participant PS as Payment Service
    participant PG as بوابة الدفع
    participant DB as PostgreSQL

    C->>UI: اختيار طريقة الدفع
    UI->>API: createPayment(orderId, method)
    API->>PS: processPayment()

    alt InstaPay
        PS->>PG: initiateInstaPay()
        PG-->>PS: paymentUrl
        PS-->>UI: redirect to payment
        C->>PG: إتمام الدفع
        PG->>API: webhook: payment.success
    else COD
        PS->>DB: markAsCOD()
        PS-->>UI: orderConfirmed
    else PayMob
        PS->>PG: initiatePayMob()
        PG-->>UI: payment iframe
        C->>PG: إدخال بيانات البطاقة
        PG->>API: webhook: payment.success
    end

    API->>DB: updateOrderStatus(paid)
    API-->>UI: paymentComplete
    UI-->>C: تأكيد الدفع
```

---

## 🚚 مسار الشحن (Shipping Flow)

```mermaid
sequenceDiagram
    participant S as النظام
    participant API as tRPC API
    participant SS as Shipping Service
    participant Bosta as Bosta API
    participant C as العميل

    S->>API: createShipment(orderId)
    API->>SS: initiateShipment()
    SS->>Bosta: createDelivery()
    Bosta-->>SS: trackingNumber

    SS->>API: updateOrder(trackingNumber)
    API-->>S: shipmentCreated

    loop تتبع الشحنة
        Bosta->>API: webhook: status_update
        API->>SS: processStatusUpdate()
        SS->>C: إشعار SMS/WhatsApp
    end

    Bosta->>API: webhook: delivered
    API->>SS: markAsDelivered()

    alt COD
        SS->>API: processCODCollection()
        API->>S: codCollected
    end
```

---

## 🧬 Bio-Modules Architecture

```mermaid
graph LR
    subgraph "🦠 Tardigrade Module"
        T1[Resilience Engine]
        T2[Auto-Recovery]
        T3[State Preservation]
    end

    subgraph "🦎 Chameleon Module"
        C1[Adaptation Engine]
        C2[Context Analyzer]
        C3[Response Optimizer]
    end

    subgraph "🐙 Cephalopod Module"
        O1[Distributed Intelligence]
        O2[Parallel Processing]
        O3[Decision Coordinator]
    end

    subgraph "🍄 Mycelium Module"
        M1[Network Hub]
        M2[Communication Router]
        M3[Resource Sharing]
    end

    T1 --> T2
    T2 --> T3

    C1 --> C2
    C2 --> C3

    O1 --> O2
    O2 --> O3

    M1 --> M2
    M2 --> M3

    T3 -.-> M1
    C3 -.-> M1
    O3 -.-> M1
```

---

## 📱 WhatsApp Commerce Flow

```mermaid
sequenceDiagram
    participant C as العميل
    participant WA as WhatsApp
    participant API as HADEROS API
    participant WS as WhatsApp Service
    participant OS as Order Service
    participant DB as Database

    C->>WA: "أريد طلب منتج"
    WA->>API: incoming message webhook
    API->>WS: processMessage()

    WS->>WS: analyzeIntent()
    WS->>DB: getProducts()
    WS-->>WA: إرسال الكتالوج

    C->>WA: اختيار المنتج
    WA->>API: product selection
    API->>WS: processSelection()

    WS->>OS: createOrder()
    OS->>DB: saveOrder()
    OS-->>WS: orderCreated

    WS-->>WA: تأكيد الطلب + رابط الدفع
    WS-->>C: رسالة التأكيد
```

---

## 💰 BNPL (التقسيط) Flow

```mermaid
flowchart TD
    A[طلب التقسيط] --> B{التحقق من الأهلية}

    B -->|مؤهل| C[عرض خطط التقسيط]
    B -->|غير مؤهل| D[رفض الطلب]

    C --> E{اختيار الخطة}

    E -->|3 أشهر| F1[بدون رسوم]
    E -->|6 أشهر| F2[رسوم 2%]
    E -->|12 شهر| F3[رسوم 5%]

    F1 --> G[التحقق من الهوية]
    F2 --> G
    F3 --> G

    G --> H{التحقق ناجح؟}

    H -->|نعم| I[إنشاء عقد التقسيط]
    H -->|لا| D

    I --> J[تأكيد الطلب]
    J --> K[جدولة الأقساط]
    K --> L[إرسال إشعارات الدفع]
```

---

## 🏪 Shopify Integration

```mermaid
flowchart LR
    subgraph "Shopify Store"
        SP[Products]
        SO[Orders]
        SC[Customers]
    end

    subgraph "HADEROS"
        HP[Products DB]
        HO[Orders DB]
        HC[Customers DB]
    end

    subgraph "Sync Engine"
        WH[Webhooks]
        PS[Product Sync]
        OS[Order Sync]
    end

    SP -->|webhook| WH
    SO -->|webhook| WH
    SC -->|webhook| WH

    WH --> PS
    WH --> OS

    PS <-->|bidirectional| HP
    OS <-->|bidirectional| HO

    HP --> SP
    HO --> SO
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as المستخدم
    participant UI as Frontend
    participant API as tRPC
    participant Auth as Auth Service
    participant DB as Database
    participant JWT as JWT Service

    U->>UI: إدخال البريد وكلمة المرور
    UI->>API: login(email, password)
    API->>Auth: validateCredentials()

    Auth->>DB: findUser(email)
    DB-->>Auth: userData

    Auth->>Auth: verifyPassword()

    alt كلمة المرور صحيحة
        Auth->>JWT: generateToken(userId)
        JWT-->>Auth: accessToken + refreshToken
        Auth->>DB: saveSession()
        Auth-->>API: tokens + userData
        API-->>UI: loginSuccess
        UI-->>U: توجيه للداشبورد
    else كلمة المرور خاطئة
        Auth-->>API: authError
        API-->>UI: loginFailed
        UI-->>U: رسالة خطأ
    end
```

---

## 📊 Data Flow Overview

```mermaid
graph TB
    subgraph "Input Sources"
        WEB[Web UI]
        WHATSAPP[WhatsApp]
        SHOPIFY[Shopify]
        API_EXT[External API]
    end

    subgraph "Processing Layer"
        ROUTER[tRPC Router]
        VALIDATOR[Zod Validator]
        SERVICE[Business Services]
    end

    subgraph "Storage Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis)]
        FILES[File Storage]
    end

    subgraph "Output Channels"
        DASHBOARD[Dashboard]
        NOTIFICATIONS[Notifications]
        REPORTS[Reports]
        WEBHOOKS[Webhooks Out]
    end

    WEB --> ROUTER
    WHATSAPP --> ROUTER
    SHOPIFY --> ROUTER
    API_EXT --> ROUTER

    ROUTER --> VALIDATOR
    VALIDATOR --> SERVICE

    SERVICE --> POSTGRES
    SERVICE --> REDIS
    SERVICE --> FILES

    POSTGRES --> DASHBOARD
    POSTGRES --> REPORTS
    SERVICE --> NOTIFICATIONS
    SERVICE --> WEBHOOKS
```

---

## 🌐 Deployment Architecture

```mermaid
graph TB
    subgraph "CDN Layer"
        CF[Cloudflare CDN]
    end

    subgraph "Load Balancer"
        LB[Load Balancer]
    end

    subgraph "Application Servers"
        APP1[App Server 1]
        APP2[App Server 2]
        APP3[App Server 3]
    end

    subgraph "Database Cluster"
        DB_PRIMARY[(Primary DB)]
        DB_REPLICA1[(Replica 1)]
        DB_REPLICA2[(Replica 2)]
    end

    subgraph "Cache Layer"
        REDIS1[Redis Master]
        REDIS2[Redis Replica]
    end

    subgraph "External Services"
        BOSTA_API[Bosta]
        PAYMENT_API[Payment Gateways]
        WHATSAPP_API[WhatsApp]
    end

    CF --> LB
    LB --> APP1
    LB --> APP2
    LB --> APP3

    APP1 --> DB_PRIMARY
    APP2 --> DB_PRIMARY
    APP3 --> DB_PRIMARY

    DB_PRIMARY --> DB_REPLICA1
    DB_PRIMARY --> DB_REPLICA2

    APP1 --> REDIS1
    APP2 --> REDIS1
    APP3 --> REDIS1

    REDIS1 --> REDIS2

    APP1 --> BOSTA_API
    APP1 --> PAYMENT_API
    APP1 --> WHATSAPP_API
```

---

## 📈 Monitoring & Observability

```mermaid
graph LR
    subgraph "Application"
        APP[HADEROS App]
        LOGS[Application Logs]
        METRICS[Performance Metrics]
        TRACES[Request Traces]
    end

    subgraph "Collection"
        FLUENTD[Fluentd]
        PROM[Prometheus]
        JAEGER[Jaeger]
    end

    subgraph "Storage"
        ES[(Elasticsearch)]
        TSDB[(Time Series DB)]
    end

    subgraph "Visualization"
        GRAFANA[Grafana]
        KIBANA[Kibana]
    end

    subgraph "Alerting"
        ALERT[Alert Manager]
        SLACK[Slack]
        EMAIL[Email]
    end

    APP --> LOGS
    APP --> METRICS
    APP --> TRACES

    LOGS --> FLUENTD
    METRICS --> PROM
    TRACES --> JAEGER

    FLUENTD --> ES
    PROM --> TSDB
    JAEGER --> ES

    ES --> KIBANA
    TSDB --> GRAFANA

    PROM --> ALERT
    ALERT --> SLACK
    ALERT --> EMAIL
```

---

## 💡 كيفية استخدام المخططات

### في GitHub
المخططات ستُعرض تلقائياً في GitHub لأنه يدعم Mermaid.

### في VS Code
ثبّت إضافة **Markdown Preview Mermaid Support**.

### في التطبيق
استخدم مكتبة `mermaid` في React:
```tsx
import mermaid from 'mermaid';

useEffect(() => {
  mermaid.initialize({ startOnLoad: true });
  mermaid.contentLoaded();
}, []);
```

---

**HADEROS AI Cloud** - مخططات البنية v1.0.0
