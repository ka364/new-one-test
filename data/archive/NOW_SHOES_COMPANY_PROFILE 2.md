# NOW SHOES - Company Profile & Operations Overview

## Company Information

**Name:** NOW SHOES  
**Industry:** Footwear Manufacturing & Retail  
**Business Model:** B2C (Retail) + B2B (Wholesale)  
**Location:** Egypt (Cairo - Sherouk area mentioned)

---

## Scale & Capacity

### Human Resources
- **Total Employees:** ~100 people
  - **Sales Team:** 25 employees (online sales, customer service)
  - **Home-based Workers:** 25 employees (remote operations)
  - **Factory Workers:** ~50 employees (production, warehouse, logistics)

### Production Capacity
- **Monthly Production:** 10,000 - 20,000 pairs (demand-driven)
- **Current Inventory:** ~20,000 pairs in stock
- **Product Range:** 1,019 SKUs (models/variants)

### Sales Volume
- **Daily Orders:** <500 orders/day
- **Monthly Orders:** ~15,000 orders/month (estimated)
- **Average Order:** 1-2 pairs per order (based on sample data)

---

## Operational Structure

### Physical Layout (From Video Tour)

```
┌─────────────────────────────────────────────────────┐
│                   NOW SHOES HQ                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📍 Ground Floor (Sherouk Area)                     │
│  ├─ Customer Pickup Zone (Wholesale clients)        │
│  └─ Shipping Dock (Delivery trucks waiting area)    │
│                                                      │
│  📍 Upper Level (Main Warehouse)                    │
│  ├─ Returns Inspection Zone                         │
│  │  └─ Quality check → Re-stock if OK               │
│  ├─ Wholesale Warehouse (B2B inventory)             │
│  ├─ Retail Warehouse (B2C inventory)                │
│  └─ Preparation Zone (Order fulfillment)            │
│     └─ Batch processing (continuous flow)           │
│                                                      │
│  🚚 Shipping Process                                │
│  └─ Batches prepared → Sent down immediately        │
│     └─ No end-of-day bulk shipping                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Warehouse Zones

1. **Customer Pickup Zone (Ground Floor - Sherouk)**
   - For wholesale (B2B) clients
   - Clients come to pick up their orders in person
   - Separate from retail operations

2. **Returns Inspection Zone**
   - Dedicated area for processing returns
   - Quality inspection process
   - Re-stocking of approved items
   - Defect tracking

3. **Wholesale Warehouse**
   - B2B inventory storage
   - Bulk orders
   - Separate from retail to avoid confusion

4. **Retail Warehouse (القطاعي)**
   - B2C inventory storage
   - Individual customer orders
   - Daily high-volume turnover

5. **Preparation Zone (منطقة التحضير)**
   - Active order fulfillment area
   - Employees working in batches
   - Continuous flow (not end-of-day bulk)
   - **Key Process:** "حولة" system (batch → ship immediately)

6. **Shipping Dock**
   - Trucks wait at designated area
   - Batches delivered as soon as ready
   - Multiple shipping companies (Bosta, J&T, GT Express, Eshhnly)

---

## Operational Workflow

### Order-to-Delivery Process

```
Customer Order
    ↓
Sales Team Confirmation
    ↓
Inventory Check (Critical!)
    ↓
Order Added to Batch
    ↓
Preparation Zone (Picking & Packing)
    ↓
Batch Ready ("حولة")
    ↓
Immediate Shipment (Not end-of-day)
    ↓
Truck Pickup
    ↓
Delivery to Customer
```

### Key Operational Principles

1. **Batch Processing (حولة System)**
   - Orders are NOT accumulated until end of day
   - As soon as a batch is ready → ship immediately
   - Ensures warehouse efficiency and fast turnover
   - Reduces bottlenecks

2. **Inventory Segregation**
   - Clear physical separation: Wholesale vs. Retail
   - Prevents stock confusion
   - Enables accurate tracking

3. **Returns Management**
   - Dedicated inspection zone
   - Quality control before re-stocking
   - Defect tracking for production feedback

4. **Multi-Channel Shipping**
   - Bosta (API available, tracking numbers)
   - J&T Express (API available, tracking numbers)
   - GT Express (Excel-based, cash COD)
   - Eshhnly (Excel-based, cash COD)

---

## Business Channels

### B2C (Retail - القطاعي)
- **Platform:** Facebook/Instagram ads → WhatsApp sales
- **Order Size:** 1-2 pairs typically
- **Volume:** High (majority of daily orders)
- **Shipping:** All 4 carriers (Bosta, J&T, GT, Eshhnly)
- **Payment:** Cash on Delivery (COD) + Bank transfer for coastal areas

### B2B (Wholesale - الجملة)
- **Customers:** Retailers, resellers
- **Order Size:** Bulk quantities
- **Pickup:** In-person at Sherouk location
- **Payment:** Likely upfront or credit terms
- **Volume:** Lower frequency, higher value

---

## Technology Stack (Current State)

### Marketing & Sales
- **Advertising:** Facebook Ads, Instagram Ads
- **Customer Communication:** WhatsApp (manual conversations)
- **Sales Team:** 25 employees handling inquiries
- **Daily Budget:** 3,000 EGP for ads

### Inventory Management
- **System:** Google Sheets (mentioned as "الشيت")
- **Problem:** Not always synced with actual stock
- **Impact:** Order cancellations, customer complaints

### Order Processing
- **System:** Manual (WhatsApp → Excel/Sheets)
- **Verification:** Manual stock checks before confirmation
- **Challenge:** Delays, human error

### Shipping
- **Bosta & J&T:** Excel exports → Manual upload to portals
- **GT Express & Eshhnly:** Excel exports → Manual upload
- **Tracking:** Manual (no automated updates)

### Financial
- **COD Reconciliation:** Manual (bank statements vs. shipments)
- **Accounting:** Excel-based (مركز مالي 2025.xlsx)
- **Challenges:** Time-consuming, error-prone

---

## Pain Points & Challenges

### 1. Inventory Accuracy
- **Issue:** "الشيت مش بيسمع عند البنات" (Sheets not updating for sales team)
- **Impact:** Confirmed orders → Out of stock → Cancellations
- **Root Cause:** Manual updates, no real-time sync

### 2. Shipping Complexity
- **Issue:** 4 different carriers, 2 with API, 2 Excel-only
- **Impact:** Manual work, no unified tracking
- **Time Waste:** Exporting, uploading, tracking manually

### 3. COD Reconciliation
- **Issue:** Matching bank transfers to shipments manually
- **Impact:** Accounting delays, cash flow uncertainty
- **Volume:** 500 orders/day = 500 potential COD transactions

### 4. Customer Communication
- **Issue:** 25 sales reps handling WhatsApp manually
- **Impact:** Inconsistent messaging, slow response
- **Quality Control:** Hard to ensure uniform customer experience

### 5. Returns Processing
- **Issue:** Manual inspection and re-stocking
- **Impact:** Delays in inventory availability
- **Tracking:** No automated defect analysis

### 6. Reporting & Analytics
- **Issue:** Manual daily reports from sales team
- **Impact:** Delayed insights, no real-time visibility
- **Decision Making:** Reactive instead of proactive

---

## HaderOS MVP - Transformation Goals

### Phase 1: Single Source of Truth (Immediate Priority)
1. **Unified Inventory System**
   - Replace Google Sheets with real-time database
   - Auto-sync across all channels
   - Prevent "out of stock" surprises

2. **Automated Shipping Integration**
   - Bosta API: Auto-create shipments, get tracking
   - J&T API: Auto-create shipments, get tracking
   - GT Express: Auto-generate Excel exports
   - Eshhnly: Auto-generate Excel exports

3. **COD Reconciliation Automation**
   - Parse bank statements (PDF/Excel)
   - Match TIN references to tracking numbers
   - Auto-generate reconciliation reports
   - Flag discrepancies

### Phase 2: Operational Efficiency
1. **Order Management Dashboard**
   - Real-time order status
   - Batch management (حولة tracking)
   - Shipping assignments
   - Returns processing

2. **Sales Team Tools**
   - Unified customer interface
   - Auto-check inventory before confirmation
   - Template responses for common questions
   - Performance analytics

3. **Warehouse Operations**
   - Digital picking lists
   - Batch tracking
   - Returns workflow
   - Stock movement logs

### Phase 3: Intelligence & Optimization
1. **Demand Forecasting**
   - Predict popular models/sizes
   - Optimize production planning
   - Reduce overstock/understock

2. **Campaign Optimization**
   - Auto-analyze ad performance
   - Recommend budget allocation
   - Track ROI by model/campaign

3. **Customer Insights**
   - Buying patterns
   - Churn prediction
   - Personalized recommendations

---

## Success Metrics (KPIs)

### Operational Efficiency
- **Order Confirmation Time:** <2 minutes (currently manual)
- **Stock Accuracy:** 99%+ (currently ~80-90%)
- **Shipping Export Time:** <5 minutes (currently 30+ minutes)
- **COD Reconciliation Time:** <1 hour (currently days)

### Customer Experience
- **Order Cancellation Rate:** <2% (currently ~10-15% due to stock issues)
- **Response Time:** <1 minute (currently varies)
- **Delivery Success Rate (OCR):** >90%

### Financial
- **Ad-to-Revenue Ratio (ADR):** <15%
- **COD Collection Rate:** >95%
- **Inventory Turnover:** Increase by 20%

### Team Productivity
- **Orders per Sales Rep:** Increase by 50%
- **Manual Tasks Reduced:** 80%
- **Report Generation Time:** From hours to minutes

---

## Next Steps (Implementation Roadmap)

### Week 1-2: Foundation
- [x] Bosta & J&T API clients built
- [x] Database schema designed
- [ ] Get API credentials (Bosta, J&T)
- [ ] Complete database migrations
- [ ] Build tRPC procedures for shipping

### Week 3-4: Core Features
- [ ] Product import from Google Sheets/Excel
- [ ] Inventory management UI
- [ ] Order creation & tracking
- [ ] Shipping integration (auto-create shipments)

### Week 5-6: Automation
- [ ] COD reconciliation system
- [ ] Bank statement parser
- [ ] Daily reports automation
- [ ] Sales team dashboard

### Week 7-8: Optimization
- [ ] Demand forecasting
- [ ] Campaign analytics
- [ ] Performance dashboards
- [ ] Training & rollout

---

## Critical Success Factors

1. **Data Migration Quality**
   - Accurate product data (1,019 SKUs)
   - Historical order data
   - Customer database

2. **Team Adoption**
   - Training for 25 sales reps
   - Warehouse staff onboarding
   - Management buy-in

3. **API Credentials**
   - Bosta API key (blocking)
   - J&T API account (blocking)
   - Shopify access (if applicable)

4. **Change Management**
   - Gradual rollout (pilot team first)
   - Parallel running (old + new system)
   - Feedback loops

---

## Files & Resources

### Sample Data
- `/docs/sample-data/shipment-exit-18-12.xlsx` (Eshhnly, 31 orders)
- `/docs/sample-data/bosta-shipment-exit-18-12.xlsx` (Bosta, 47 orders)
- `/docs/sample-data/bosta-delivery-receipt-18-12.png` (112 pieces, 21,390 EGP)

### Documentation
- `/docs/integrations/INTEGRATIONS_AUDIT.md` (Full system audit)
- `/docs/integrations/bosta-api-research.md` (Bosta API guide)
- `/docs/integrations/jnt-api-research.md` (J&T API guide)
- `/docs/integrations/shopify-api-research.md` (Shopify integration)
- `/docs/integrations/products-data-analysis.md` (1,019 products analysis)
- `/docs/integrations/google-sheets-products.md` (Live data structure)

### Operational Manual
- `pasted_content_2.txt` (Complete NOW SHOES operational guide)
  - Organizational structure
  - Marketing & sales processes
  - Inventory management
  - Shipping policies
  - KPIs and metrics
  - Daily reporting system

---

**Last Updated:** December 18, 2025  
**Status:** Active Development - MVP Phase  
**Next Milestone:** API Credentials → Full Integration
