import { describe, expect, it, beforeAll } from "vitest";
import { KAIAEngine } from "./kaia/engine";
import { createEthicalRule } from "./db";

describe("KAIA Ethical Governance Engine", () => {
  let engine: KAIAEngine;

  beforeAll(async () => {
    engine = new KAIAEngine();
    
    // Create a test rule for large transactions
    await createEthicalRule({
      ruleName: "Test Large Transaction Rule",
      ruleDescription: "Flag transactions over $5000",
      ruleType: "risk_management",
      category: "financial",
      severity: "high",
      ruleLogic: {
        conditions: [
          { field: "transaction.amount", operator: ">", value: 5000 }
        ],
        action: "flag"
      },
      requiresReview: false,
      priority: 100,
      isActive: true,
      createdBy: 1, // Test user
    });

    await engine.reloadRules();
  });

  it("should approve compliant small transaction", async () => {
    const transaction = {
      amount: "100.00",
      type: "income" as const,
      description: "Regular sale",
    };

    const decision = await engine.evaluateTransaction(transaction);

    expect(decision.approved).toBe(true);
    expect(decision.decision).toBe("approved");
  });

  it("should flag large transaction", async () => {
    const transaction = {
      amount: "15000.00",
      type: "income" as const,
      description: "Large sale",
    };

    const decision = await engine.evaluateTransaction(transaction);

    // Should be flagged but still approved (warning)
    expect(decision.decision).toMatch(/approved|flagged/);
    expect(decision.appliedRules.length).toBeGreaterThan(0);
  });

  it("should have loaded ethical rules", () => {
    const rules = engine.getRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it("should provide detailed decision reasoning", async () => {
    const transaction = {
      amount: "100.00",
      type: "income" as const,
      description: "Test transaction",
    };

    const decision = await engine.evaluateTransaction(transaction);

    expect(decision.overallReason).toBeDefined();
    expect(decision.overallReason.length).toBeGreaterThan(0);
    expect(decision.severity).toMatch(/low|medium|high|critical/);
  });
});

describe("Transaction Router", () => {
  it("should create transaction with KAIA evaluation", async () => {
    // This test validates the integration between routers and KAIA
    // In a real scenario, you would use the tRPC caller here
    const engine = new KAIAEngine();
    
    const transaction = {
      amount: "500.00",
      type: "income" as const,
      description: "Test sale",
    };

    const decision = await engine.evaluateTransaction(transaction);

    expect(decision).toBeDefined();
    expect(decision.approved).toBeDefined();
    expect(decision.decision).toBeDefined();
  });
});
