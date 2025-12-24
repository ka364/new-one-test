/**
 * Financial Agent
 * Analyzes financial transactions, detects patterns, and forecasts cash flows
 */

import { Event } from "../../drizzle/schema";
import { 
  getAllTransactions, 
  getTransactionsByDateRange,
  createAgentInsight,
  createNotification
} from "../db";
import { getEventBus } from "../events/eventBus";
import { evaluateTransactionWithKAIA } from "../kaia/engine";
import { notifyOwner } from "../_core/notification";

export interface CashFlowForecast {
  period: string;
  predictedIncome: number;
  predictedExpenses: number;
  predictedNetFlow: number;
  confidence: number;
}

export interface FinancialPattern {
  type: "recurring_income" | "recurring_expense" | "anomaly" | "trend";
  description: string;
  descriptionAr: string;
  amount: number;
  frequency: string;
  confidence: number;
}

/**
 * Financial Agent Class
 */
export class FinancialAgent {
  private readonly LARGE_TRANSACTION_THRESHOLD = 10000; // USD
  private readonly ANOMALY_THRESHOLD = 3; // Standard deviations

  constructor() {
    this.registerEventHandlers();
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers() {
    const eventBus = getEventBus();

    // Handle transaction created events
    eventBus.subscribe("transaction.created", async (event: Event) => {
      await this.handleTransactionCreated(event);
    });

    // Handle transaction updated events
    eventBus.subscribe("transaction.updated", async (event: Event) => {
      await this.handleTransactionUpdated(event);
    });

    // Handle financial threshold exceeded events
    eventBus.subscribe("financial.threshold_exceeded", async (event: Event) => {
      await this.handleThresholdExceeded(event);
    });

    console.log("[FinancialAgent] Event handlers registered");
  }

  /**
   * Handle transaction created event
   */
  private async handleTransactionCreated(event: Event) {
    try {
      const { transaction } = event.eventData;

      // Check if it's a large transaction
      if (Math.abs(Number(transaction.amount)) >= this.LARGE_TRANSACTION_THRESHOLD) {
        await this.notifyLargeTransaction(transaction);
      }

      // Evaluate with KAIA
      const kaiaDecision = await evaluateTransactionWithKAIA(transaction);
      
      if (!kaiaDecision.approved) {
        await this.notifyEthicalViolation(transaction, kaiaDecision);
      }

      // Detect anomalies
      const isAnomaly = await this.detectAnomaly(transaction);
      if (isAnomaly) {
        await this.notifyAnomaly(transaction);
      }

      console.log(`[FinancialAgent] Processed transaction ${transaction.id}`);
    } catch (error) {
      console.error("[FinancialAgent] Error handling transaction created:", error);
    }
  }

  /**
   * Handle transaction updated event
   */
  private async handleTransactionUpdated(event: Event) {
    try {
      const { transaction } = event.eventData;
      console.log(`[FinancialAgent] Transaction ${transaction.id} updated`);
      // Additional logic for updates can be added here
    } catch (error) {
      console.error("[FinancialAgent] Error handling transaction updated:", error);
    }
  }

  /**
   * Handle threshold exceeded event
   */
  private async handleThresholdExceeded(event: Event) {
    try {
      const { type, value, threshold } = event.eventData;
      
      await createAgentInsight({
        agentType: "financial",
        insightType: "threshold_alert",
        title: `Financial Threshold Exceeded: ${type}`,
        titleAr: `تجاوز الحد المالي: ${type}`,
        description: `The ${type} has exceeded the threshold of ${threshold}. Current value: ${value}`,
        descriptionAr: `تجاوز ${type} الحد المسموح به ${threshold}. القيمة الحالية: ${value}`,
        insightData: { type, value, threshold },
        priority: "high",
        status: "new"
      });

      console.log(`[FinancialAgent] Threshold exceeded alert created`);
    } catch (error) {
      console.error("[FinancialAgent] Error handling threshold exceeded:", error);
    }
  }

  /**
   * Notify about large transaction
   */
  private async notifyLargeTransaction(transaction: any) {
    try {
      // Notify owner
      await notifyOwner({
        title: `Large Transaction Detected: $${transaction.amount}`,
        content: `A large ${transaction.type} transaction of $${transaction.amount} was created.\n\nTransaction: ${transaction.transactionNumber}\nDescription: ${transaction.description || "N/A"}`
      });

      // Create insight
      await createAgentInsight({
        agentType: "financial",
        insightType: "large_transaction",
        title: `Large Transaction: $${transaction.amount}`,
        titleAr: `معاملة كبيرة: $${transaction.amount}`,
        description: `A large ${transaction.type} transaction was detected`,
        descriptionAr: `تم اكتشاف معاملة ${transaction.type} كبيرة`,
        insightData: { transaction },
        priority: "high",
        status: "new",
        relatedEntityType: "transaction",
        relatedEntityId: transaction.id
      });

      console.log(`[FinancialAgent] Large transaction notification sent`);
    } catch (error) {
      console.error("[FinancialAgent] Error notifying large transaction:", error);
    }
  }

  /**
   * Notify about ethical violation
   */
  private async notifyEthicalViolation(transaction: any, kaiaDecision: any) {
    try {
      // Notify owner
      await notifyOwner({
        title: `Ethical Violation Detected`,
        content: `Transaction ${transaction.transactionNumber} failed ethical compliance check.\n\nReason: ${kaiaDecision.overallReason}\n\nAction Required: Review and approve/reject manually.`
      });

      // Create insight
      await createAgentInsight({
        agentType: "financial",
        insightType: "ethical_violation",
        title: `Ethical Violation in Transaction ${transaction.transactionNumber}`,
        titleAr: `انتهاك أخلاقي في المعاملة ${transaction.transactionNumber}`,
        description: kaiaDecision.overallReason,
        descriptionAr: kaiaDecision.overallReasonAr,
        insightData: { transaction, kaiaDecision },
        priority: "critical",
        status: "new",
        relatedEntityType: "transaction",
        relatedEntityId: transaction.id
      });

      console.log(`[FinancialAgent] Ethical violation notification sent`);
    } catch (error) {
      console.error("[FinancialAgent] Error notifying ethical violation:", error);
    }
  }

  /**
   * Detect anomalies in transaction
   */
  private async detectAnomaly(transaction: any): Promise<boolean> {
    try {
      // Get recent transactions of the same type
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const recentTransactions = await getTransactionsByDateRange(startDate, endDate);
      const sameTypeTransactions = recentTransactions.filter(
        t => t.type === transaction.type && t.id !== transaction.id
      );

      if (sameTypeTransactions.length < 5) {
        return false; // Not enough data
      }

      // Calculate mean and standard deviation
      const amounts = sameTypeTransactions.map(t => Number(t.amount));
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Check if current transaction is an anomaly
      const transactionAmount = Math.abs(Number(transaction.amount));
      const zScore = Math.abs((transactionAmount - mean) / stdDev);

      return zScore > this.ANOMALY_THRESHOLD;
    } catch (error) {
      console.error("[FinancialAgent] Error detecting anomaly:", error);
      return false;
    }
  }

  /**
   * Notify about anomaly
   */
  private async notifyAnomaly(transaction: any) {
    try {
      await createAgentInsight({
        agentType: "financial",
        insightType: "anomaly_detected",
        title: `Anomaly Detected in Transaction ${transaction.transactionNumber}`,
        titleAr: `تم اكتشاف شذوذ في المعاملة ${transaction.transactionNumber}`,
        description: `This transaction amount (${transaction.amount}) is significantly different from recent similar transactions`,
        descriptionAr: `مبلغ هذه المعاملة (${transaction.amount}) يختلف بشكل كبير عن المعاملات المماثلة الأخيرة`,
        insightData: { transaction },
        priority: "medium",
        status: "new",
        relatedEntityType: "transaction",
        relatedEntityId: transaction.id
      });

      console.log(`[FinancialAgent] Anomaly notification created`);
    } catch (error) {
      console.error("[FinancialAgent] Error notifying anomaly:", error);
    }
  }

  /**
   * Forecast cash flow for the next period
   */
  async forecastCashFlow(months: number = 3): Promise<CashFlowForecast[]> {
    try {
      // Get historical data (last 12 months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const historicalTransactions = await getTransactionsByDateRange(startDate, endDate);

      // Simple moving average forecast
      const forecasts: CashFlowForecast[] = [];

      for (let i = 1; i <= months; i++) {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i);
        const period = forecastDate.toISOString().slice(0, 7); // YYYY-MM

        // Calculate average income and expenses
        const incomeTransactions = historicalTransactions.filter(t => t.type === "income");
        const expenseTransactions = historicalTransactions.filter(t => t.type === "expense");

        const avgIncome = incomeTransactions.length > 0
          ? incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / incomeTransactions.length
          : 0;

        const avgExpenses = expenseTransactions.length > 0
          ? expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / expenseTransactions.length
          : 0;

        forecasts.push({
          period,
          predictedIncome: avgIncome,
          predictedExpenses: avgExpenses,
          predictedNetFlow: avgIncome - avgExpenses,
          confidence: 0.7 // Simple confidence score
        });
      }

      return forecasts;
    } catch (error) {
      console.error("[FinancialAgent] Error forecasting cash flow:", error);
      return [];
    }
  }

  /**
   * Detect financial patterns
   */
  async detectPatterns(): Promise<FinancialPattern[]> {
    try {
      const patterns: FinancialPattern[] = [];

      // Get last 3 months of transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const transactions = await getTransactionsByDateRange(startDate, endDate);

      // Detect recurring transactions (simplified)
      const transactionsByDescription = new Map<string, any[]>();
      
      transactions.forEach(t => {
        const desc = t.description || "Unknown";
        if (!transactionsByDescription.has(desc)) {
          transactionsByDescription.set(desc, []);
        }
        transactionsByDescription.get(desc)!.push(t);
      });

      // Find recurring patterns
      transactionsByDescription.forEach((txns, desc) => {
        if (txns.length >= 2) {
          const avgAmount = txns.reduce((sum, t) => sum + Number(t.amount), 0) / txns.length;
          const type = txns[0].type;

          patterns.push({
            type: type === "income" ? "recurring_income" : "recurring_expense",
            description: `Recurring ${type}: ${desc}`,
            descriptionAr: `${type === "income" ? "دخل متكرر" : "مصروف متكرر"}: ${desc}`,
            amount: avgAmount,
            frequency: `${txns.length} times in 3 months`,
            confidence: 0.8
          });
        }
      });

      return patterns;
    } catch (error) {
      console.error("[FinancialAgent] Error detecting patterns:", error);
      return [];
    }
  }

  /**
   * Generate financial summary
   */
  async generateFinancialSummary(startDate: Date, endDate: Date) {
    try {
      const transactions = await getTransactionsByDateRange(startDate, endDate);

      const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const netFlow = income - expenses;

      return {
        period: {
          start: startDate.toISOString().slice(0, 10),
          end: endDate.toISOString().slice(0, 10)
        },
        totalIncome: income,
        totalExpenses: expenses,
        netFlow,
        transactionCount: transactions.length,
        avgTransactionSize: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length : 0
      };
    } catch (error) {
      console.error("[FinancialAgent] Error generating summary:", error);
      return null;
    }
  }
}

// Singleton instance
let financialAgentInstance: FinancialAgent | null = null;

/**
 * Get the singleton Financial Agent instance
 */
export function getFinancialAgent(): FinancialAgent {
  if (!financialAgentInstance) {
    financialAgentInstance = new FinancialAgent();
  }
  return financialAgentInstance;
}

// Initialize the agent
getFinancialAgent();
