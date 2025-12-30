# ✅ Daily Operations Checklist - NOW SHOES System

This checklist ensures smooth daily operations of the NOW SHOES system. Complete all tasks daily to maintain system health and business continuity.

---

## 🌅 Morning Routine (9:00 AM - 10:00 AM)

### System Health Check

- [ ] **Check System Status**
  - Open dashboard at `/dashboard`
  - Verify all KPIs are loading correctly
  - Check for any error notifications

- [ ] **Database Backup Verification**
  - Confirm last night's backup completed successfully
  - Check backup file size (should be >10MB)
  - Verify backup is accessible in backup folder

- [ ] **Review Overnight Activity**
  - Check new orders from Shopify (when integrated)
  - Review new shipments
  - Check for failed transactions
  - Review system logs for errors

### HR System Check

- [ ] **Employee Account Status**
  - Check for employees with documents expiring in next 7 days
  - Review pending document verifications
  - Check for failed OTP attempts
  - Verify no accounts are locked

- [ ] **Monthly Accounts**
  - If it's the 1st of the month: Generate new monthly employee accounts
  - Download credentials Excel file
  - Send credentials to Amira via email
  - Archive previous month's accounts

### Shipment Management

- [ ] **Review Pending Shipments**
  - Open `/shipments` page
  - Filter by status: "pending"
  - Check for shipments older than 24 hours
  - Follow up with shipping companies if needed

- [ ] **Update Tracking Status**
  - Import latest tracking updates from shipping companies
  - Update customer notifications
  - Mark delivered shipments as complete

---

## 🏢 Mid-Day Operations (12:00 PM - 2:00 PM)

### Order Processing

- [ ] **Process New Orders**
  - Review all orders with status "pending"
  - Verify inventory availability
  - Assign to appropriate shipping company
  - Update order status to "processing"

- [ ] **Inventory Check**
  - Open `/nowshoes` dashboard
  - Review low stock alerts (red warnings)
  - Create purchase orders for items below threshold
  - Update inventory counts if physical count done

### Customer Service

- [ ] **Respond to Customer Inquiries**
  - Check customer messages/emails
  - Provide tracking information
  - Handle return requests
  - Update order notes

- [ ] **Handle Returns**
  - Process return requests
  - Create return shipments
  - Update inventory when returns received
  - Issue refunds if approved

---

## 🌆 Afternoon Tasks (3:00 PM - 5:00 PM)

### Financial Review

- [ ] **Transaction Monitoring**
  - Open `/transactions` page
  - Review all transactions for the day
  - Verify KAIA ethical approval status
  - Flag any suspicious transactions

- [ ] **Daily Sales Report**
  - Generate daily sales summary
  - Compare with yesterday's performance
  - Note any significant changes
  - Share report with management

### Campaign Management

- [ ] **Review Active Campaigns**
  - Open `/campaigns` page
  - Check campaign performance metrics
  - Adjust budgets if needed
  - Pause underperforming campaigns
  - Launch new campaigns if scheduled

- [ ] **Content Creator Coordination**
  - Check for new product image requests
  - Review completed content
  - Approve/reject submissions
  - Schedule posts for tomorrow

---

## 🌙 End-of-Day Routine (5:00 PM - 6:00 PM)

### Data Sync & Backup

- [ ] **Sync Shopify Data** (when integrated)
  - Run manual sync if automatic sync failed
  - Verify product inventory matches
  - Check for order sync errors

- [ ] **Export Daily Reports**
  - Export shipments for the day (Excel)
  - Export orders for the day (Excel)
  - Export transactions for the day (Excel)
  - Save reports in dated folder

- [ ] **Trigger Backup**
  - Run manual database backup
  - Verify backup completed successfully
  - Upload backup to cloud storage

### System Cleanup

- [ ] **Clear Temporary Data**
  - Delete old OTP records (>24 hours)
  - Archive old notifications (>30 days)
  - Clean up old session data

- [ ] **Review System Logs**
  - Check error logs for recurring issues
  - Note any performance problems
  - Create tickets for bugs found

### Documentation

- [ ] **Update Daily Log**
  - Record total orders processed
  - Record total shipments created
  - Record total revenue
  - Note any issues or incidents
  - Document resolutions

---

## 📅 Weekly Tasks (Every Friday)

### System Maintenance

- [ ] **Run Full System Health Check**
  - Test all major features
  - Verify all integrations working
  - Check database performance
  - Review disk space usage

- [ ] **Generate Weekly Reports**
  - Weekly sales report
  - Weekly shipment report
  - Weekly employee activity report
  - Weekly financial summary

- [ ] **Review Employee Performance**
  - Check employee data entry accuracy
  - Review document verification completion rate
  - Check OTP success rate
  - Identify training needs

### Data Cleanup

- [ ] **Archive Old Data**
  - Archive orders older than 90 days
  - Archive shipments older than 90 days
  - Archive old employee monthly data
  - Compress and backup archives

- [ ] **Update Inventory**
  - Reconcile physical inventory with system
  - Update product information
  - Remove discontinued products
  - Add new products

---

## 📆 Monthly Tasks (1st of Every Month)

### HR Operations

- [ ] **Generate Monthly Employee Accounts**
  - Run account generation script
  - Download credentials Excel
  - Send to Amira
  - Verify all accounts created successfully

- [ ] **Expire Previous Month Accounts**
  - Verify old accounts are deactivated
  - Archive old account data
  - Clean up old sessions

- [ ] **Document Re-Verification Check**
  - Generate list of employees with documents expiring in 30 days
  - Send notifications to employees
  - Send notifications to supervisors
  - Track re-verification progress

### Financial Operations

- [ ] **Monthly Financial Closing**
  - Generate monthly revenue report
  - Generate monthly expense report
  - Calculate profit/loss
  - Reconcile with accounting system

- [ ] **Campaign Performance Review**
  - Review all campaigns from last month
  - Calculate ROI for each campaign
  - Identify best-performing campaigns
  - Plan next month's campaigns

### System Updates

- [ ] **Check for System Updates**
  - Review available updates
  - Test updates in staging environment
  - Schedule production deployment
  - Notify team of upcoming changes

- [ ] **Review Security**
  - Review access logs
  - Check for suspicious activity
  - Update passwords if needed
  - Review user permissions

---

## 🚨 Emergency Procedures

### System Down

If the system is not accessible:

1. Check server status
2. Check database connectivity
3. Review error logs
4. Contact technical support
5. Notify team via backup communication channel
6. Document incident

### Data Loss

If data appears to be lost:

1. **DO NOT PANIC**
2. Stop all operations immediately
3. Check latest backup
4. Contact technical support
5. Restore from backup if confirmed
6. Document what was lost
7. Investigate root cause

### Security Breach

If you suspect a security breach:

1. **Immediately** change all passwords
2. Disable affected user accounts
3. Review access logs
4. Contact technical support
5. Document the incident
6. Notify management
7. Implement additional security measures

---

## 📞 Contact Information

### Technical Support
- **Email:** support@haderosai.com
- **Phone:** +20 XXX XXX XXXX
- **Available:** 9 AM - 6 PM (Sunday - Thursday)

### Team Leads
- **Ahmed Shawky (Programming):** ahmed@haderosai.com
- **Amira (HR Manager):** amira@haderosai.com
- **Operations Manager:** operations@haderosai.com

### Emergency Contacts
- **After Hours Support:** +20 XXX XXX XXXX
- **Database Admin:** dba@haderosai.com

---

## 📝 Daily Log Template

Use this template to record daily activities:

```
Date: [DD/MM/YYYY]
Operator: [Your Name]

=== Morning Checklist ===
System Health: [OK/Issues]
Backup Status: [OK/Failed]
Pending Documents: [Number]
Pending Shipments: [Number]

=== Daily Metrics ===
New Orders: [Number]
Orders Processed: [Number]
Shipments Created: [Number]
Revenue: [Amount] EGP
Transactions: [Number]

=== Issues/Incidents ===
[List any issues encountered and how they were resolved]

=== Notes ===
[Any additional notes or observations]

Completed by: [Your Name]
Time: [HH:MM]
```

---

## ✅ Checklist Completion

At the end of each day, verify:

- [ ] All morning tasks completed
- [ ] All mid-day tasks completed
- [ ] All afternoon tasks completed
- [ ] All end-of-day tasks completed
- [ ] Daily log updated
- [ ] No pending critical issues
- [ ] System ready for next day

---

**Last Updated:** December 18, 2025  
**Version:** 1.0  
**Maintained by:** Operations Team
