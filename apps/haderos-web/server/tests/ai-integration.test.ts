import { test, expect, vi, describe, beforeEach } from 'vitest';
import { KAIAEngine } from '../kaia/engine';
import { llmService } from '../ai/llm.service';


// Mock AI Config to ensure API Key is present
vi.mock('../ai/config', () => ({
    aiConfig: {
        openaiApiKey: 'test-key',
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 100
    }
}));

// Mock LLM Service
vi.mock('../ai/llm.service', () => ({
    llmService: {
        generateCompletion: vi.fn(),
    },
}));

// Mock Database Calls
vi.mock('../db', () => ({
    getActiveEthicalRules: vi.fn().mockResolvedValue([
        {
            id: 1,
            ruleName: 'Review Haram',
            severity: 'high',
            requiresReview: false,
            ruleLogic: { conditions: [], action: 'approve' } // Basic pass-through rule
        }
    ])
}));

describe('AI Integration Tests', () => {
    let kaia: KAIAEngine;

    beforeEach(() => {
        vi.clearAllMocks();
        kaia = new KAIAEngine();
    });

    test('analyzeEthicalCompliance should call LLM service', async () => {
        const textToAnalyze = "Contract involves 5% fixed interest on loan.";

        // Mock AI Response
        const mockAIResponse = {
            content: "Verdict: NON-COMPLIANT. Reason: Riba (Interest) is explicitly mentioned."
        };
        (llmService.generateCompletion as any).mockResolvedValue(mockAIResponse);

        const result = await kaia.analyzeEthicalCompliance(textToAnalyze);

        expect(llmService.generateCompletion).toHaveBeenCalled();
        expect(result.content).toContain('NON-COMPLIANT');
    });

    test('evaluateTransaction should include AI analysis for unstructured data', async () => {
        const transaction = { id: 1, amount: 100 };
        const contractText = "Suspicious uncertain delivery date.";

        // Mock AI Response
        const mockAIResponse = {
            content: "Verdict: SUSPICIOUS. Reason: Gharar (Uncertainty) detected."
        };
        (llmService.generateCompletion as any).mockResolvedValue(mockAIResponse);

        // We need to wait for the async engine to use the service
        const decision = await kaia.evaluateTransaction(transaction as any, contractText);


        expect(decision.aiAnalysis).toBeDefined();
        expect(decision.aiAnalysis).toContain('SUSPICIOUS');
    });

    test('FinancialAgent.generateAIReport should return AI content when API key exists', async () => {
        const { getFinancialAgent } = await import('../agents/financialAgent');
        const agent = getFinancialAgent();

        // Mock generateFinancialSummary (internal method)
        vi.spyOn(agent, 'generateFinancialSummary').mockResolvedValue({
            period: { start: '2025-01-01', end: '2025-01-31' },
            totalIncome: 1000,
            totalExpenses: 500,
            netFlow: 500,
            transactionCount: 10,
            avgTransactionSize: 100
        });

        // Mock AI Response
        const mockAIResponse = {
            content: "Executive Summary: Healthy net flow of 500."
        };
        (llmService.generateCompletion as any).mockResolvedValue(mockAIResponse);

        const report = await agent.generateAIReport(new Date(), new Date());

        expect(report).toContain('Executive Summary');
        expect(llmService.generateCompletion).toHaveBeenCalled();
    });
});

