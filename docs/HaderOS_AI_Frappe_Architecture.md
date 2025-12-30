# 🧠 haderos-ai - Frappe App Architecture

**Bio-Inspired AI Platform built on Frappe Framework + ERPNext**

---

## 🎯 المفهوم الجديد الصحيح

```
Foundation Layer:
├── Frappe Framework    ← Full-stack framework (Python + JS)
└── ERPNext            ← Complete ERP (Accounting, HR, CRM, etc.)

Custom Layer:
└── haderos-ai         ← Custom Frappe App
    ├── Bio-Modules (KAIA, Sentinel, Kinetic, Ledger)
    ├── NOW SHOES Integration
    ├── Launch System
    └── AI/ML Features
```

**الفكرة:**
- 🏗️ ERPNext = البنية التحتية (المحاسبة، HR، المخزون، المبيعات)
- 🧠 haderos-ai = التطبيق المخصص (AI, Bio-modules, Custom logic)
- 🔗 Integration = كل شيء متكامل في نظام واحد

---

## 📂 البنية الكاملة (Frappe Bench Structure)

```
haderos-workspace/                      # 🏗️ Frappe Bench Root
│
├── 📦 apps/                            # Frappe Apps
│   │
│   ├── frappe/                         # ✅ Frappe Framework (Core)
│   │   ├── frappe/
│   │   ├── node_modules/
│   │   └── setup.py
│   │
│   ├── erpnext/                        # ✅ ERPNext (Base ERP)
│   │   ├── erpnext/
│   │   │   ├── accounts/               # المحاسبة
│   │   │   ├── buying/                 # المشتريات
│   │   │   ├── selling/                # المبيعات
│   │   │   ├── stock/                  # المخزون
│   │   │   ├── manufacturing/          # الإنتاج
│   │   │   ├── hr/                     # الموارد البشرية
│   │   │   ├── crm/                    # إدارة العملاء
│   │   │   ├── projects/               # المشاريع
│   │   │   ├── support/                # الدعم الفني
│   │   │   └── assets/                 # الأصول
│   │   └── setup.py
│   │
│   └── haderos/                        # 🧠 haderos-ai (Custom App)
│       │
│       ├── haderos/                    # Main module
│       │   │
│       │   ├── 🧬 bio_modules/         # Bio-Inspired Modules
│       │   │   │
│       │   │   ├── kaia/               # KAIA Theology Engine
│       │   │   │   ├── doctype/
│       │   │   │   │   ├── kaia_compliance/
│       │   │   │   │   ├── sharia_rule/
│       │   │   │   │   └── compliance_check/
│       │   │   │   │
│       │   │   │   ├── api/
│       │   │   │   │   ├── compliance.py
│       │   │   │   │   └── validation.py
│       │   │   │   │
│       │   │   │   ├── kernel/
│       │   │   │   │   ├── theology.py
│       │   │   │   │   ├── safety.py
│       │   │   │   │   └── security.py
│       │   │   │   │
│       │   │   │   └── hooks.py
│       │   │   │
│       │   │   ├── sentinel/           # Sentinel Monitoring
│       │   │   │   ├── doctype/
│       │   │   │   │   ├── sentinel_alert/
│       │   │   │   │   ├── sentinel_agent/
│       │   │   │   │   └── sentinel_event/
│       │   │   │   │
│       │   │   │   ├── agents/
│       │   │   │   │   ├── decision_agent.py
│       │   │   │   │   └── monitoring_agent.py
│       │   │   │   │
│       │   │   │   ├── ml/
│       │   │   │   │   └── models.py
│       │   │   │   │
│       │   │   │   └── api/
│       │   │   │       └── monitoring.py
│       │   │   │
│       │   │   ├── kinetic/            # Kinetic Optimization
│       │   │   │   ├── doctype/
│       │   │   │   │   ├── demand_forecast/
│       │   │   │   │   ├── price_optimization/
│       │   │   │   │   └── inventory_optimization/
│       │   │   │   │
│       │   │   │   ├── ml/
│       │   │   │   │   ├── forecasting.py
│       │   │   │   │   └── optimization.py
│       │   │   │   │
│       │   │   │   └── api/
│       │   │   │       └── optimize.py
│       │   │   │
│       │   │   └── ledger/             # Blockchain Ledger
│       │   │       ├── doctype/
│       │   │       │   ├── blockchain_transaction/
│       │   │       │   ├── smart_contract/
│       │   │       │   └── token_holder/
│       │   │       │
│       │   │       ├── blockchain/
│       │   │       │   ├── service.py
│       │   │       │   └── interface.py
│       │   │       │
│       │   │       └── api/
│       │   │           └── blockchain.py
│       │   │
│       │   ├── 🚀 launch_system/       # Launch System (NOW SHOES)
│       │   │   ├── doctype/
│       │   │   │   ├── launch_order/
│       │   │   │   ├── launch_shipment/
│       │   │   │   ├── launch_kpi/
│       │   │   │   └── revenue_calculator/
│       │   │   │
│       │   │   ├── page/               # Custom pages
│       │   │   │   ├── launch_dashboard/
│       │   │   │   │   ├── launch_dashboard.html
│       │   │   │   │   ├── launch_dashboard.js
│       │   │   │   │   └── launch_dashboard.py
│       │   │   │   │
│       │   │   │   └── revenue_calculator/
│       │   │   │       ├── revenue_calculator.html
│       │   │   │       ├── revenue_calculator.js
│       │   │   │       └── revenue_calculator.py
│       │   │   │
│       │   │   ├── api/
│       │   │   │   ├── kpis.py
│       │   │   │   └── calculator.py
│       │   │   │
│       │   │   └── report/             # Custom reports
│       │   │       ├── launch_metrics/
│       │   │       └── revenue_forecast/
│       │   │
│       │   ├── 🔌 integrations/        # External Integrations
│       │   │   │
│       │   │   ├── shopify/
│       │   │   │   ├── doctype/
│       │   │   │   │   ├── shopify_settings/
│       │   │   │   │   ├── shopify_order/
│       │   │   │   │   └── shopify_product/
│       │   │   │   │
│       │   │   │   ├── api/
│       │   │   │   │   ├── sync.py
│       │   │   │   │   └── webhooks.py
│       │   │   │   │
│       │   │   │   └── utils.py
│       │   │   │
│       │   │   ├── shipping/
│       │   │   │   ├── doctype/
│       │   │   │   │   ├── shipping_provider/
│       │   │   │   │   ├── bosta_settings/
│       │   │   │   │   └── aramex_settings/
│       │   │   │   │
│       │   │   │   ├── providers/
│       │   │   │   │   ├── bosta.py
│       │   │   │   │   ├── aramex.py
│       │   │   │   │   └── gt_express.py
│       │   │   │   │
│       │   │   │   └── api/
│       │   │   │       └── shipping.py
│       │   │   │
│       │   │   └── payments/
│       │   │       ├── doctype/
│       │   │       │   ├── payment_gateway_settings/
│       │   │       │   └── payment_log/
│       │   │       │
│       │   │       └── gateways/
│       │   │           ├── fawry.py
│       │   │           └── paymob.py
│       │   │
│       │   ├── 📊 analytics/           # Analytics Engine
│       │   │   ├── doctype/
│       │   │   │   ├── analytics_dashboard/
│       │   │   │   └── analytics_metric/
│       │   │   │
│       │   │   ├── page/
│       │   │   │   └── analytics_hub/
│       │   │   │
│       │   │   └── api/
│       │   │       ├── metrics.py
│       │   │       └── dashboards.py
│       │   │
│       │   ├── 🎨 public/              # Frontend Assets
│       │   │   ├── css/
│       │   │   │   └── haderos.css
│       │   │   │
│       │   │   ├── js/
│       │   │   │   ├── haderos.bundle.js
│       │   │   │   ├── bio_modules.js
│       │   │   │   └── launch_system.js
│       │   │   │
│       │   │   └── images/
│       │   │       └── logo.png
│       │   │
│       │   ├── 🔧 config/              # App Configuration
│       │   │   ├── desktop.py          # Desktop icons
│       │   │   ├── docs.py             # Documentation
│       │   │   └── website_context.py  # Website context
│       │   │
│       │   ├── 🪝 hooks.py             # App Hooks
│       │   │
│       │   ├── 🔐 patches/             # Database Patches
│       │   │   └── v1_0/
│       │   │
│       │   ├── 📄 templates/           # Jinja Templates
│       │   │   ├── pages/
│       │   │   ├── emails/
│       │   │   └── print_formats/
│       │   │
│       │   ├── 🧪 tests/               # Tests
│       │   │   ├── test_kaia.py
│       │   │   ├── test_sentinel.py
│       │   │   └── test_integrations.py
│       │   │
│       │   └── 📚 modules.txt          # Module list
│       │
│       ├── 📦 requirements.txt         # Python dependencies
│       ├── 📄 setup.py                 # App setup
│       ├── 📖 README.md                # App README
│       ├── 📝 license.txt              # License
│       └── ⚙️ haderos.egg-info/        # Package info
│
├── 🌐 sites/                           # Frappe Sites
│   │
│   ├── haderos.local/                  # Development site
│   │   ├── private/
│   │   │   ├── files/
│   │   │   └── backups/
│   │   │
│   │   ├── public/
│   │   │   └── files/
│   │   │
│   │   ├── site_config.json
│   │   └── currentsite.txt
│   │
│   ├── production.haderos.ai/          # Production site
│   │   ├── private/
│   │   ├── public/
│   │   └── site_config.json
│   │
│   └── common_site_config.json
│
├── 🔧 config/                          # Bench Configuration
│   ├── nginx.conf
│   ├── supervisor.conf
│   └── redis_cache.conf
│
├── 📊 logs/                            # Logs
│   ├── bench.log
│   ├── web.error.log
│   └── worker.log
│
├── 🗄️ data/                            # Data (archived from haderos-platform)
│   │
│   ├── migrations/                     # Migration data
│   │   ├── from_haderos_mvp/
│   │   │   ├── products.json
│   │   │   ├── orders.json
│   │   │   └── customers.json
│   │   │
│   │   └── from_backend/
│   │       └── schema.sql
│   │
│   ├── seeds/                          # Seed data
│   │   ├── egypt_governorates.csv
│   │   ├── shipping_zones.csv
│   │   └── demo_data.json
│   │
│   └── archive/                        # Archived files
│       ├── deliveries/                 # Excel files
│       ├── media/                      # Videos
│       └── old_code/                   # Old implementations
│
├── 📚 docs/                            # Documentation
│   │
│   ├── strategic/                      # Strategic docs (from haderos-mvp)
│   │   ├── 90_DAY_EXECUTION_PLAN.md
│   │   ├── HADEROS_COMPLETE_STRATEGIC_PLAN.md
│   │   ├── HADEROS_ISLAMIC_FOUNDATION.md
│   │   └── STRATEGIC_ROADMAP_IMPLEMENTATION.md
│   │
│   ├── technical/                      # Technical docs
│   │   ├── architecture.md
│   │   ├── frappe_app_development.md
│   │   ├── bio_modules_guide.md
│   │   └── integration_guide.md
│   │
│   ├── deployment/                     # Deployment docs
│   │   ├── production_setup.md
│   │   ├── digitalocean_deployment.md
│   │   └── maintenance.md
│   │
│   ├── user_guides/                    # User guides
│   │   ├── launch_system_guide_ar.md
│   │   ├── kaia_user_guide.md
│   │   └── admin_manual.md
│   │
│   └── api/                            # API docs
│       ├── rest_api.md
│       └── webhooks.md
│
├── 🧪 tests/                           # Integration Tests
│   ├── integration/
│   ├── e2e/
│   └── performance/
│
├── 🔐 .github/                         # GitHub
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   └── tests.yml
│   └── ISSUE_TEMPLATE/
│
├── 🐳 docker/                          # Docker (optional)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.production.yml
│
└── 📄 Root Files
    ├── .gitignore
    ├── .editorconfig
    ├── Procfile                        # For deployment
    ├── env.py                          # Environment loader
    ├── README.md
    └── LICENSE
```

---

## 🔄 Integration with ERPNext

### How haderos-ai extends ERPNext:

```python
# apps/haderos/haderos/hooks.py

app_name = "haderos"
app_title = "HaderOS"
app_publisher = "HaderOS Team"
app_description = "Bio-Inspired AI Platform"
app_icon = "octicon octicon-file-directory"
app_color = "blue"
app_email = "team@haderos.ai"
app_license = "MIT"

# ✅ Extend ERPNext DocTypes
override_doctype_dashboards = {
    "Sales Order": "haderos.launch_system.dashboard.sales_order_dashboard",
    "Customer": "haderos.analytics.dashboard.customer_dashboard",
}

# ✅ Add custom fields to ERPNext
doc_events = {
    "Sales Order": {
        "validate": "haderos.launch_system.api.kpis.calculate_tcr",
        "on_submit": "haderos.integrations.shipping.api.create_shipment",
    },
    "Item": {
        "validate": "haderos.bio_modules.kaia.api.compliance.check_sharia_compliance",
    },
    "Customer": {
        "after_insert": "haderos.integrations.shopify.api.sync.sync_to_shopify",
    }
}

# ✅ Custom API endpoints
override_whitelisted_methods = {
    "haderos.bio_modules.kaia.api.compliance.validate_transaction",
    "haderos.launch_system.api.calculator.calculate_revenue",
    "haderos.integrations.shipping.api.track_shipment",
}

# ✅ Scheduled tasks
scheduler_events = {
    "hourly": [
        "haderos.bio_modules.sentinel.agents.monitoring_agent.check_alerts"
    ],
    "daily": [
        "haderos.launch_system.api.kpis.calculate_daily_metrics",
        "haderos.integrations.shopify.api.sync.sync_orders"
    ],
}

# ✅ Custom pages
web_include_js = [
    "/assets/haderos/js/haderos.bundle.js"
]

web_include_css = [
    "/assets/haderos/css/haderos.css"
]
```

---

## 🏗️ Development Workflow

### Setup Development Environment:

```bash
# 1. Install Frappe Bench
pip install frappe-bench

# 2. Initialize bench
bench init haderos-workspace --frappe-branch version-15

# 3. Get ERPNext
cd haderos-workspace
bench get-app erpnext --branch version-15

# 4. Get haderos (our custom app)
bench get-app haderos https://github.com/your-org/haderos.git

# 5. Create site
bench new-site haderos.local --admin-password admin

# 6. Install apps
bench --site haderos.local install-app erpnext
bench --site haderos.local install-app haderos

# 7. Start development
bench start
```

### Development Commands:

```bash
# Start development server
bench start

# Run tests
bench --site haderos.local run-tests --app haderos

# Migrate database
bench --site haderos.local migrate

# Build assets
bench build

# Clear cache
bench --site haderos.local clear-cache

# Console access
bench --site haderos.local console
```

---

## 🎯 Key Features Integration

### 1️⃣ **Launch System → ERPNext Sales Module**

```python
# haderos/launch_system/doctype/launch_order/launch_order.py

import frappe
from frappe.model.document import Document
from erpnext.selling.doctype.sales_order.sales_order import SalesOrder

class LaunchOrder(Document):
    def validate(self):
        # Calculate KPIs
        self.calculate_tcr()
        self.calculate_tcc()
        
    def on_submit(self):
        # Create ERPNext Sales Order
        sales_order = frappe.get_doc({
            "doctype": "Sales Order",
            "customer": self.customer,
            "delivery_date": self.expected_delivery,
            "items": self.get_items(),
            "custom_launch_order": self.name  # Link back
        })
        sales_order.insert()
        sales_order.submit()
        
    def calculate_tcr(self):
        # Total Conversion Rate logic
        pass
```

### 2️⃣ **KAIA → ERPNext Item Validation**

```python
# haderos/bio_modules/kaia/api/compliance.py

import frappe

@frappe.whitelist()
def validate_item_sharia_compliance(item_code):
    item = frappe.get_doc("Item", item_code)
    
    # Check against KAIA rules
    kaia_rules = frappe.get_all(
        "KAIA Sharia Rule",
        filters={"enabled": 1},
        fields=["name", "rule_type", "validation_method"]
    )
    
    for rule in kaia_rules:
        if not validate_rule(item, rule):
            frappe.throw(f"Item violates Sharia rule: {rule.name}")
    
    return True
```

### 3️⃣ **Shopify Integration → ERPNext Customer/Orders**

```python
# haderos/integrations/shopify/api/sync.py

import frappe
import shopify

def sync_shopify_orders():
    """Sync Shopify orders to ERPNext Sales Orders"""
    
    # Get Shopify settings
    settings = frappe.get_single("Shopify Settings")
    shopify.ShopifyResource.set_site(settings.shop_url)
    
    # Fetch orders
    orders = shopify.Order.find(status="open")
    
    for order in orders:
        # Create/update customer
        customer = get_or_create_customer(order.customer)
        
        # Create sales order
        sales_order = frappe.get_doc({
            "doctype": "Sales Order",
            "customer": customer,
            "po_no": str(order.id),
            "items": get_order_items(order),
            "custom_shopify_order_id": str(order.id)
        })
        sales_order.insert()
```

---

## 📊 Database Schema (Frappe DocTypes)

### Custom DocTypes in haderos:

```
KAIA Module:
├── KAIA Compliance Check
├── Sharia Rule
├── Compliance Log
└── Validation Result

Sentinel Module:
├── Sentinel Alert
├── Sentinel Agent
├── Sentinel Event
└── Monitoring Log

Launch System:
├── Launch Order
├── Launch KPI
├── Revenue Calculator
└── Launch Dashboard Config

Integrations:
├── Shopify Settings
├── Shopify Order
├── Shipping Provider
├── Bosta Shipment
└── Payment Gateway Log
```

---

## 🚀 Migration Plan from Current State

### Phase 1: Setup Frappe Bench (Week 1)

```bash
✅ Day 1-2: Install Frappe + ERPNext
✅ Day 3-4: Create haderos app structure
✅ Day 5: Setup development environment
✅ Day 6-7: Initial configuration
```

### Phase 2: Migrate haderos-mvp Logic (Week 2-4)

```
✅ Week 2: 
   □ Migrate database schema → Frappe DocTypes
   □ Convert tRPC routes → Frappe API
   □ Move React components → Frappe Pages

✅ Week 3:
   □ Migrate Launch System
   □ Migrate NOW SHOES integration
   □ Setup Shopify webhooks

✅ Week 4:
   □ Migrate shipping integrations
   □ Port analytics engine
   □ Testing & debugging
```

### Phase 3: Migrate Bio-Modules (Week 5-6)

```
✅ Week 5:
   □ Port KAIA engine to Python
   □ Create KAIA DocTypes
   □ Integrate with ERPNext Item

✅ Week 6:
   □ Port Sentinel monitoring
   □ Setup scheduled tasks
   □ Create dashboards
```

### Phase 4: Testing & Documentation (Week 7-8)

```
✅ Week 7:
   □ Integration testing
   □ Load testing
   □ Security audit

✅ Week 8:
   □ Documentation
   □ User training
   □ Deployment preparation
```

---

## 💰 Benefits of Frappe/ERPNext Foundation

### ✅ What You Get for FREE:

```
📊 Accounting
   ├── Chart of Accounts
   ├── Journal Entries
   ├── Invoicing
   ├── Payments
   └── Financial Reports

👥 HR
   ├── Employee Management
   ├── Attendance
   ├── Payroll
   ├── Leave Management
   └── Appraisals

📦 Stock
   ├── Item Management
   ├── Warehouse
   ├── Stock Entry
   ├── Serial Numbers
   └── Stock Reports

💼 CRM
   ├── Lead Management
   ├── Opportunities
   ├── Customers
   └── Communications

🏗️ Projects
   ├── Project Tracking
   ├── Tasks
   ├── Timesheets
   └── Issues

🛠️ Framework Features
   ├── User Management
   ├── Roles & Permissions
   ├── Workflows
   ├── Email Integration
   ├── Print Formats
   ├── Custom Fields
   ├── Custom Scripts
   └── REST API
```

### 💡 What You Build (Custom):

```
🧠 Bio-Modules
   ├── KAIA (Sharia Compliance)
   ├── Sentinel (Monitoring)
   ├── Kinetic (Optimization)
   └── Ledger (Blockchain)

🚀 Launch System
   ├── KPI Dashboard
   ├── Revenue Calculator
   └── Analytics

🔌 Integrations
   ├── Shopify
   ├── Shipping APIs
   └── Payment Gateways
```

---

## ✅ Success Criteria

```
✅ Frappe Bench running
✅ ERPNext installed
✅ haderos app installed
✅ All DocTypes created
✅ Data migrated from haderos-mvp
✅ Integrations working
✅ Bio-modules operational
✅ Tests passing
✅ Documentation complete
✅ Team trained
```

---

## 🎯 الخطوة التالية؟

### **Option A: ابدأ Setup فوراً** ⭐ (موصى به)

```bash
# اليوم:
1. Install Frappe Bench
2. Setup ERPNext
3. Create haderos app skeleton
4. Start migrating schema

# بعد أسبوع:
✅ Basic structure ready
✅ First DocTypes created
✅ Development environment working
```

### **Option B: Plan أولاً**

```
□ مراجعة البنية المقترحة
□ تعديل حسب الحاجة
□ تحديد الأولويات
□ ثم البدء
```

### **Option C: POC أولاً**

```
□ بناء Proof of Concept صغير
□ اختبار الفكرة
□ تقييم النتائج
□ ثم Full migration
```

---

**رأيي:**

**Option A - ابدأ فوراً!**

Frappe + ERPNext هو **exactly** ما تحتاجه:
- ✅ Production-ready backend
- ✅ Complete ERP modules
- ✅ Python framework (matches your backend/)
- ✅ Extensible architecture
- ✅ Active community

**جاهز نبدأ؟** 🚀
