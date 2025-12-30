/**
 * 🚀 DEEPSEEK AI PROVIDER
 *
 * مزود الذكاء الاصطناعي DeepSeek - توفير 87% من التكاليف!
 *
 * Features:
 * - 🆓 Very affordable ($0.14/M tokens vs $1/M for GPT-3.5)
 * - 🚀 Fast response time
 * - 📚 128K context window
 * - 💪 Comparable to GPT-4 in coding tasks
 *
 * Model: deepseek-chat
 * Cost: $0.14 per 1M input tokens, $0.28 per 1M output tokens
 * Context: 128,000 tokens
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DeepSeekResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  model: string;
  timestamp: Date;
}

export class DeepSeekProvider {
  private client: ReturnType<typeof createOpenAI>;
  private config: Required<DeepSeekConfig>;

  // Pricing (per 1M tokens)
  private readonly PRICING = {
    input: 0.14,   // $0.14 per 1M input tokens
    output: 0.28,  // $0.28 per 1M output tokens
  };

  constructor(config: DeepSeekConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.deepseek.com',
      model: config.model || 'deepseek-chat',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
    };

    this.client = createOpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  /**
   * تنفيذ مهمة AI
   */
  async execute(prompt: string, systemPrompt?: string): Promise<DeepSeekResponse> {
    console.log('🚀 DeepSeek executing task...');

    try {
      const startTime = Date.now();

      const result = await generateText({
        model: this.client(this.config.model),
        prompt,
        system: systemPrompt,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Calculate costs
      const inputCost = (result.usage.promptTokens / 1_000_000) * this.PRICING.input;
      const outputCost = (result.usage.completionTokens / 1_000_000) * this.PRICING.output;
      const totalCost = inputCost + outputCost;

      console.log(`✅ DeepSeek completed in ${duration}ms`);
      console.log(`💰 Cost: $${totalCost.toFixed(6)} (Input: $${inputCost.toFixed(6)}, Output: $${outputCost.toFixed(6)})`);

      return {
        text: result.text,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        cost: {
          inputCost,
          outputCost,
          totalCost,
        },
        model: this.config.model,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ DeepSeek error:', error);
      throw new Error(`DeepSeek execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * تحليل كود
   */
  async analyzeCode(code: string, language: string = 'typescript'): Promise<DeepSeekResponse> {
    const systemPrompt = `You are an expert code analyst. Analyze the provided ${language} code and provide:
1. Code quality assessment (0-100)
2. Potential issues and bugs
3. Security vulnerabilities
4. Performance improvements
5. Best practices violations

Be concise and specific.`;

    const prompt = `Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide a detailed analysis.`;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * توليد اختبارات
   */
  async generateTests(code: string, framework: string = 'vitest'): Promise<DeepSeekResponse> {
    const systemPrompt = `You are an expert test generator. Generate comprehensive ${framework} tests for the provided code.
Include:
1. Unit tests for all functions
2. Edge case tests
3. Error handling tests
4. Integration tests if applicable

Generate only the test code, no explanations.`;

    const prompt = `Generate ${framework} tests for this code:

\`\`\`typescript
${code}
\`\`\``;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * إيجاد ثغرات أمنية
   */
  async findSecurityVulnerabilities(code: string): Promise<DeepSeekResponse> {
    const systemPrompt = `You are a security expert. Analyze the code for security vulnerabilities.
Focus on:
1. SQL Injection
2. XSS vulnerabilities
3. Authentication issues
4. Data exposure
5. Cryptographic weaknesses
6. OWASP Top 10

Provide CWE references where applicable.`;

    const prompt = `Find security vulnerabilities in this code:

\`\`\`typescript
${code}
\`\`\`

List all vulnerabilities with severity levels.`;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * تحسين الأداء
   */
  async suggestPerformanceImprovements(code: string): Promise<DeepSeekResponse> {
    const systemPrompt = `You are a performance optimization expert. Analyze the code and suggest improvements.
Focus on:
1. Algorithm optimization
2. Database query optimization
3. Memory efficiency
4. Caching opportunities
5. Async/await optimization
6. Big O complexity improvements

Provide specific code examples.`;

    const prompt = `Suggest performance improvements for this code:

\`\`\`typescript
${code}
\`\`\``;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * شرح الكود
   */
  async explainCode(code: string): Promise<DeepSeekResponse> {
    const systemPrompt = `You are a code documentation expert. Explain the code clearly and concisely.
Include:
1. What the code does
2. How it works
3. Key algorithms used
4. Potential issues
5. Usage examples`;

    const prompt = `Explain this code:

\`\`\`typescript
${code}
\`\`\``;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * إصلاح bug
   */
  async fixBug(code: string, bugDescription: string): Promise<DeepSeekResponse> {
    const systemPrompt = `You are a debugging expert. Fix the bug in the provided code.
Provide:
1. The fixed code
2. Explanation of what was wrong
3. Why the fix works
4. Any additional improvements`;

    const prompt = `Fix this bug:

Bug Description: ${bugDescription}

Code:
\`\`\`typescript
${code}
\`\`\`

Provide the fixed version.`;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * مراجعة Pull Request
   */
  async reviewPullRequest(diff: string): Promise<DeepSeekResponse> {
    const systemPrompt = `You are a senior code reviewer. Review this pull request and provide:
1. Overall assessment
2. Code quality issues
3. Security concerns
4. Performance issues
5. Suggestions for improvement
6. Approval recommendation (Approve/Request Changes/Comment)`;

    const prompt = `Review this pull request:

\`\`\`diff
${diff}
\`\`\``;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * توليد وثائق
   */
  async generateDocumentation(code: string, format: 'markdown' | 'jsdoc' = 'markdown'): Promise<DeepSeekResponse> {
    const systemPrompt = `You are a documentation expert. Generate comprehensive ${format} documentation for the provided code.
Include:
1. Overview
2. Function/class descriptions
3. Parameters and return values
4. Usage examples
5. Edge cases and limitations`;

    const prompt = `Generate ${format} documentation for this code:

\`\`\`typescript
${code}
\`\`\``;

    return this.execute(prompt, systemPrompt);
  }

  /**
   * حساب التكلفة المقدرة
   */
  estimateCost(inputTokens: number, outputTokens: number): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  } {
    const inputCost = (inputTokens / 1_000_000) * this.PRICING.input;
    const outputCost = (outputTokens / 1_000_000) * this.PRICING.output;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  }

  /**
   * مقارنة التكلفة مع GPT
   */
  compareCostWithGPT(tokens: number): {
    deepseek: number;
    gpt35: number;
    gpt4: number;
    savings35: number;
    savings4: number;
  } {
    // Pricing per 1M tokens
    const deepseekCost = (tokens / 1_000_000) * 0.14;
    const gpt35Cost = (tokens / 1_000_000) * 1.0;     // ~$1/M
    const gpt4Cost = (tokens / 1_000_000) * 30.0;     // ~$30/M

    return {
      deepseek: deepseekCost,
      gpt35: gpt35Cost,
      gpt4: gpt4Cost,
      savings35: ((gpt35Cost - deepseekCost) / gpt35Cost) * 100,
      savings4: ((gpt4Cost - deepseekCost) / gpt4Cost) * 100,
    };
  }
}

/**
 * Singleton instance
 */
let deepseekInstance: DeepSeekProvider | null = null;

export function getDeepSeek(apiKey?: string): DeepSeekProvider {
  if (!deepseekInstance) {
    const key = apiKey || process.env.DEEPSEEK_API_KEY;
    if (!key) {
      throw new Error('DeepSeek API key is required. Set DEEPSEEK_API_KEY environment variable.');
    }
    deepseekInstance = new DeepSeekProvider({ apiKey: key });
  }
  return deepseekInstance;
}

/**
 * Helper function للاستخدام السريع
 */
export async function askDeepSeek(question: string): Promise<string> {
  const deepseek = getDeepSeek();
  const result = await deepseek.execute(question);
  return result.text;
}
