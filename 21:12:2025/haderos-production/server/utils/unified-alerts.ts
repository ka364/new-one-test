/**
 * Unified Alert System
 * 
 * Monitors expenses at both levels:
 * 1. Individual Entity Level (specific factory, merchant, etc.)
 * 2. Department Level (entire merchants department, marketing department, etc.)
 */

import { db } from '../db';
import {
  unifiedExpenses,
  subscriptions,
  departmentBudgets,
  expenseAlerts,
  expenseRequests,
} from '../../drizzle/schema-unified-expenses';
import { scalingHierarchy } from '../../drizzle/schema-7x7-scaling';
import { eq, and, gte, lte, sql, isNull, or } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

interface AlertConfig {
  budgetThreshold: number; // Percentage (e.g., 80 for 80%)
  renewalReminderDays: number; // Days before renewal to send reminder
  approvalPendingDays: number; // Days before sending approval reminder
  unusualSpendingThreshold: number; // Percentage increase compared to previous period
}

const DEFAULT_CONFIG: AlertConfig = {
  budgetThreshold: 80,
  renewalReminderDays: 7,
  approvalPendingDays: 3,
  unusualSpendingThreshold: 50,
};

// ============================================================================
// BUDGET ALERTS
// ============================================================================

export async function checkBudgetAlerts(config: AlertConfig = DEFAULT_CONFIG) {
  console.log('🔍 Checking budget alerts...');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Get all budgets for current month
  const budgets = await db
    .select()
    .from(departmentBudgets)
    .where(
      and(
        eq(departmentBudgets.year, currentYear),
        eq(departmentBudgets.month, currentMonth)
      )
    );
  
  for (const budget of budgets) {
    const allocated = parseFloat(budget.allocatedAmount);
    const spent = parseFloat(budget.spentAmount || '0');
    const utilizationPercentage = (spent / allocated) * 100;
    
    // Check if budget threshold exceeded
    if (utilizationPercentage >= config.budgetThreshold) {
      const severity = 
        utilizationPercentage >= 100 ? 'critical' :
        utilizationPercentage >= 90 ? 'high' :
        'medium';
      
      // Check if alert already exists
      const existingAlert = await db
        .select()
        .from(expenseAlerts)
        .where(
          and(
            eq(expenseAlerts.budgetId, budget.id),
            eq(expenseAlerts.alertType, 'budget_exceeded'),
            eq(expenseAlerts.isResolved, false)
          )
        )
        .limit(1);
      
      if (existingAlert.length === 0) {
        await db.insert(expenseAlerts).values({
          department: budget.department,
          budgetId: budget.id,
          alertType: 'budget_exceeded',
          title: `تجاوز الميزانية: ${budget.department} - ${budget.category}`,
          message: `تم استخدام ${utilizationPercentage.toFixed(1)}% من الميزانية المخصصة (${spent.toLocaleString()} من ${allocated.toLocaleString()} ${budget.currency})`,
          severity,
        });
        
        console.log(`⚠️  Budget alert created for ${budget.department} - ${budget.category}`);
      }
    }
  }
}

// ============================================================================
// SUBSCRIPTION RENEWAL ALERTS
// ============================================================================

export async function checkSubscriptionRenewals(config: AlertConfig = DEFAULT_CONFIG) {
  console.log('🔍 Checking subscription renewals...');
  
  const now = new Date();
  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + config.renewalReminderDays);
  
  // Get subscriptions expiring soon
  const expiringSubscriptions = await db
    .select({
      subscription: subscriptions,
      hierarchy: scalingHierarchy,
    })
    .from(subscriptions)
    .leftJoin(scalingHierarchy, eq(subscriptions.hierarchyId, scalingHierarchy.id))
    .where(
      and(
        eq(subscriptions.isActive, true),
        lte(subscriptions.renewalDate, reminderDate),
        gte(subscriptions.renewalDate, now)
      )
    );
  
  for (const { subscription, hierarchy } of expiringSubscriptions) {
    const daysUntilRenewal = Math.ceil(
      (new Date(subscription.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if alert already exists
    const existingAlert = await db
      .select()
      .from(expenseAlerts)
      .where(
        and(
          eq(expenseAlerts.subscriptionId, subscription.id),
          eq(expenseAlerts.alertType, 'renewal_reminder'),
          eq(expenseAlerts.isResolved, false)
        )
      )
      .limit(1);
    
    if (existingAlert.length === 0) {
      const level = subscription.department 
        ? `قسم ${subscription.department}`
        : hierarchy 
        ? `كيان ${hierarchy.name}`
        : 'غير محدد';
      
      await db.insert(expenseAlerts).values({
        hierarchyId: subscription.hierarchyId,
        department: subscription.department,
        subscriptionId: subscription.id,
        alertType: 'renewal_reminder',
        title: `تذكير بتجديد الاشتراك: ${subscription.name}`,
        message: `الاشتراك في ${subscription.name} (${level}) سينتهي خلال ${daysUntilRenewal} يوم. التكلفة الشهرية: ${parseFloat(subscription.monthlyCost).toLocaleString()} ${subscription.currency}`,
        severity: daysUntilRenewal <= 3 ? 'high' : 'medium',
      });
      
      console.log(`⚠️  Renewal alert created for ${subscription.name}`);
    }
  }
}

// ============================================================================
// APPROVAL PENDING ALERTS
// ============================================================================

export async function checkPendingApprovals(config: AlertConfig = DEFAULT_CONFIG) {
  console.log('🔍 Checking pending approvals...');
  
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - config.approvalPendingDays);
  
  // Get old pending expense requests
  const pendingRequests = await db
    .select({
      request: expenseRequests,
      hierarchy: scalingHierarchy,
    })
    .from(expenseRequests)
    .leftJoin(scalingHierarchy, eq(expenseRequests.hierarchyId, scalingHierarchy.id))
    .where(
      and(
        or(
          eq(expenseRequests.status, 'submitted'),
          eq(expenseRequests.status, 'pending')
        ),
        lte(expenseRequests.createdAt, thresholdDate)
      )
    );
  
  for (const { request, hierarchy } of pendingRequests) {
    const daysWaiting = Math.ceil(
      (now.getTime() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if alert already exists
    const existingAlert = await db
      .select()
      .from(expenseAlerts)
      .where(
        and(
          eq(expenseAlerts.alertType, 'approval_needed'),
          eq(expenseAlerts.isResolved, false),
          sql`${expenseAlerts.metadata}->>'requestId' = ${request.id}`
        )
      )
      .limit(1);
    
    if (existingAlert.length === 0) {
      const level = request.department 
        ? `قسم ${request.department}`
        : hierarchy 
        ? `كيان ${hierarchy.name}`
        : 'غير محدد';
      
      await db.insert(expenseAlerts).values({
        hierarchyId: request.hierarchyId,
        department: request.department,
        alertType: 'approval_needed',
        title: `طلب مصروف بانتظار الموافقة: ${request.title}`,
        message: `الطلب (${level}) بانتظار الموافقة منذ ${daysWaiting} يوم. المبلغ: ${parseFloat(request.amount).toLocaleString()} ${request.currency}`,
        severity: daysWaiting >= 7 ? 'high' : 'medium',
        metadata: { requestId: request.id },
      });
      
      console.log(`⚠️  Approval alert created for request ${request.id}`);
    }
  }
}

// ============================================================================
// UNUSUAL SPENDING ALERTS
// ============================================================================

export async function checkUnusualSpending(config: AlertConfig = DEFAULT_CONFIG) {
  console.log('🔍 Checking unusual spending patterns...');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const currentMonthEnd = new Date(currentYear, currentMonth, 0);
  
  const previousMonthStart = new Date(currentYear, currentMonth - 2, 1);
  const previousMonthEnd = new Date(currentYear, currentMonth - 1, 0);
  
  // Check by department
  const departments = ['merchants', 'marketing', 'developers', 'operations', 'hr', 'finance', 'sales', 'customer_support'];
  
  for (const department of departments) {
    // Current month expenses
    const currentExpenses = await db
      .select()
      .from(unifiedExpenses)
      .where(
        and(
          eq(unifiedExpenses.department, department as any),
          gte(unifiedExpenses.expenseDate, currentMonthStart),
          lte(unifiedExpenses.expenseDate, currentMonthEnd)
        )
      );
    
    // Previous month expenses
    const previousExpenses = await db
      .select()
      .from(unifiedExpenses)
      .where(
        and(
          eq(unifiedExpenses.department, department as any),
          gte(unifiedExpenses.expenseDate, previousMonthStart),
          lte(unifiedExpenses.expenseDate, previousMonthEnd)
        )
      );
    
    const currentTotal = currentExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const previousTotal = previousExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    if (previousTotal > 0) {
      const increasePercentage = ((currentTotal - previousTotal) / previousTotal) * 100;
      
      if (increasePercentage >= config.unusualSpendingThreshold) {
        // Check if alert already exists
        const existingAlert = await db
          .select()
          .from(expenseAlerts)
          .where(
            and(
              eq(expenseAlerts.department, department as any),
              eq(expenseAlerts.alertType, 'unusual_spending'),
              eq(expenseAlerts.isResolved, false),
              gte(expenseAlerts.createdAt, currentMonthStart)
            )
          )
          .limit(1);
        
        if (existingAlert.length === 0) {
          await db.insert(expenseAlerts).values({
            department: department as any,
            alertType: 'unusual_spending',
            title: `نمط إنفاق غير معتاد: ${department}`,
            message: `زيادة ${increasePercentage.toFixed(1)}% في المصروفات مقارنة بالشهر السابق (${currentTotal.toLocaleString()} مقابل ${previousTotal.toLocaleString()})`,
            severity: increasePercentage >= 100 ? 'high' : 'medium',
          });
          
          console.log(`⚠️  Unusual spending alert created for ${department}`);
        }
      }
    }
  }
}

// ============================================================================
// OVERDUE EXPENSES ALERTS
// ============================================================================

export async function checkOverdueExpenses() {
  console.log('🔍 Checking overdue expenses...');
  
  const now = new Date();
  
  // Get unpaid expenses past due date
  const overdueExpenses = await db
    .select({
      expense: unifiedExpenses,
      hierarchy: scalingHierarchy,
    })
    .from(unifiedExpenses)
    .leftJoin(scalingHierarchy, eq(unifiedExpenses.hierarchyId, scalingHierarchy.id))
    .where(
      and(
        or(
          eq(unifiedExpenses.status, 'pending'),
          eq(unifiedExpenses.status, 'approved')
        ),
        lte(unifiedExpenses.dueDate, now)
      )
    );
  
  for (const { expense, hierarchy } of overdueExpenses) {
    const daysOverdue = Math.ceil(
      (now.getTime() - new Date(expense.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Update expense status to overdue
    await db
      .update(unifiedExpenses)
      .set({ status: 'overdue' })
      .where(eq(unifiedExpenses.id, expense.id));
    
    // Check if alert already exists
    const existingAlert = await db
      .select()
      .from(expenseAlerts)
      .where(
        and(
          eq(expenseAlerts.expenseId, expense.id),
          eq(expenseAlerts.alertType, 'overdue'),
          eq(expenseAlerts.isResolved, false)
        )
      )
      .limit(1);
    
    if (existingAlert.length === 0) {
      const level = expense.department 
        ? `قسم ${expense.department}`
        : hierarchy 
        ? `كيان ${hierarchy.name}`
        : 'غير محدد';
      
      await db.insert(expenseAlerts).values({
        hierarchyId: expense.hierarchyId,
        department: expense.department,
        expenseId: expense.id,
        alertType: 'overdue',
        title: `مصروف متأخر: ${expense.title}`,
        message: `المصروف (${level}) متأخر ${daysOverdue} يوم. المبلغ: ${parseFloat(expense.amount).toLocaleString()} ${expense.currency}`,
        severity: daysOverdue >= 30 ? 'critical' : daysOverdue >= 7 ? 'high' : 'medium',
      });
      
      console.log(`⚠️  Overdue alert created for expense ${expense.id}`);
    }
  }
}

// ============================================================================
// MAIN ALERT CHECK FUNCTION
// ============================================================================

export async function runAllAlertChecks(config: AlertConfig = DEFAULT_CONFIG) {
  console.log('🚀 Starting unified alert system...');
  console.log(`Configuration: ${JSON.stringify(config, null, 2)}`);
  
  try {
    await checkBudgetAlerts(config);
    await checkSubscriptionRenewals(config);
    await checkPendingApprovals(config);
    await checkUnusualSpending(config);
    await checkOverdueExpenses();
    
    console.log('✅ All alert checks completed successfully');
  } catch (error) {
    console.error('❌ Error running alert checks:', error);
    throw error;
  }
}

// ============================================================================
// SCHEDULED EXECUTION
// ============================================================================

export async function startAlertScheduler(intervalMinutes: number = 60) {
  console.log(`⏰ Starting alert scheduler (runs every ${intervalMinutes} minutes)`);
  
  // Run immediately
  await runAllAlertChecks();
  
  // Schedule periodic checks
  setInterval(async () => {
    await runAllAlertChecks();
  }, intervalMinutes * 60 * 1000);
}

// For manual execution
if (require.main === module) {
  runAllAlertChecks()
    .then(() => {
      console.log('✅ Manual alert check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manual alert check failed:', error);
      process.exit(1);
    });
}
