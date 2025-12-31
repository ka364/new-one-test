/**
 * AI Client Manager
 * Supports multiple AI providers: OpenAI, Gemini, Anthropic, Grok
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'grok' | 'deepseek';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}

export class AIClient {
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private geminiApiKey?: string;
  private grokApiKey?: string;
  private deepseekApiKey?: string;

  constructor() {
    // Initialize available clients based on environment variables
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_API_BASE,
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.geminiApiKey = process.env.GEMINI_API_KEY;
    }

    if (process.env.XAI_API_KEY) {
      this.grokApiKey = process.env.XAI_API_KEY;
    }

    if (process.env.DEEPSEEK_API_KEY) {
      this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    }
  }

  /**
   * Send a request to the specified AI provider
   */
  async chat(
    messages: AIMessage[],
    provider: AIProvider = 'openai',
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    switch (provider) {
      case 'openai':
        return this.chatOpenAI(messages, options);
      case 'anthropic':
        return this.chatAnthropic(messages, options);
      case 'gemini':
        return this.chatGemini(messages, options);
      case 'grok':
        return this.chatGrok(messages, options);
      case 'deepseek':
        return this.chatDeepSeek(messages, options);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * OpenAI Chat
   */
  private async chatOpenAI(
    messages: AIMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY environment variable.');
    }

    const response = await this.openaiClient.chat.completions.create({
      model: options?.model || 'gpt-4',
      messages: messages as any,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      provider: 'openai',
      model: response.model,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  /**
   * Anthropic (Claude) Chat
   */
  private async chatAnthropic(
    messages: AIMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized. Set ANTHROPIC_API_KEY environment variable.');
    }

    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await this.anthropicClient.messages.create({
      model: options?.model || 'claude-3-opus-20240229',
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
    });

    return {
      content: response.content[0]?.type === 'text' ? response.content[0].text : '',
      provider: 'anthropic',
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  /**
   * Google Gemini Chat
   */
  private async chatGemini(
    messages: AIMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not found. Set GEMINI_API_KEY environment variable.');
    }

    // Use google-genai SDK
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    
    const model = genAI.getGenerativeModel({ 
      model: options?.model || 'gemini-2.0-flash-exp',
    });

    // Combine messages into a single prompt
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      provider: 'gemini',
      model: options?.model || 'gemini-2.0-flash-exp',
    };
  }

  /**
   * Grok (xAI) Chat
   */
  private async chatGrok(
    messages: AIMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    if (!this.grokApiKey) {
      throw new Error('Grok API key not found. Set XAI_API_KEY environment variable.');
    }

    // Use xAI SDK
    const { Client } = await import('xai-sdk');
    const client = new Client({ apiKey: this.grokApiKey });

    const response = await client.chat.create({
      model: options?.model || 'grok-beta',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature || 0.7,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      provider: 'grok',
      model: options?.model || 'grok-beta',
    };
  }

  /**
   * Check which providers are available
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    
    if (this.deepseekApiKey) providers.push('deepseek');
    if (this.openaiClient) providers.push('openai');
    if (this.anthropicClient) providers.push('anthropic');
    if (this.geminiApiKey) providers.push('gemini');
    if (this.grokApiKey) providers.push('grok');

    return providers;
  }

  /**
   * DeepSeek Chat (Free and Fast!)
   */
  private async chatDeepSeek(
    messages: AIMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    if (!this.deepseekApiKey) {
      throw new Error('DeepSeek API key not found. Set DEEPSEEK_API_KEY environment variable.');
    }

    // DeepSeek uses OpenAI-compatible API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'deepseek-chat',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      provider: 'deepseek',
      model: data.model || 'deepseek-chat',
      tokensUsed: data.usage?.total_tokens,
    };
  }

  /**
   * Get the best available provider
   */
  getBestProvider(): AIProvider {
    const providers = this.getAvailableProviders();
    
    if (providers.length === 0) {
      throw new Error('No AI providers available. Please set at least one API key.');
    }

    // Prefer order: DeepSeek (free!) > OpenAI > Anthropic > Gemini > Grok
    if (providers.includes('deepseek')) return 'deepseek';
    if (providers.includes('openai')) return 'openai';
    if (providers.includes('anthropic')) return 'anthropic';
    if (providers.includes('gemini')) return 'gemini';
    return 'grok';
  }
}
