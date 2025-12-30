// @ts-nocheck
// server/_core/ai-service.ts
import { TRPCError } from '@trpc/server';
import { invokeLLM } from './llm';

export enum AIProvider {
  MANUS = 'manus',      // مجاني (مدمج في Manus)
  DEEPSEEK = 'deepseek', // رخيص وسريع
  CLAUDE = 'claude',     // متقدم وإبداعي
}

export type AIOptions = {
  provider?: AIProvider;
  autoSelect?: boolean;
  maxCost?: number;
  timeout?: number;
  fallback?: boolean;
  model?: string;
  temperature?: number;
};

export type AIResponse = {
  provider: AIProvider;
  content: string;
  cost: number;
  usage: any;
  latency: number;
  model?: string;
};

export class UnifiedAIService {
  private startTime: number = 0;

  constructor() {}

  // ========== CORE AI PROVIDERS ==========

  // 1. Manus invokeLLM (المجاني والمضمون)
  async invokeManusLLM(
    messages: any[],
    options: { model?: string; temperature?: number } = {}
  ): Promise<AIResponse> {
    this.startTimer();
    
    try {
      console.log('🤖 Using Manus invokeLLM (Free Tier)...');
      
      const response = await invokeLLM({
        messages,
        temperature: options.temperature || 0.7,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        provider: AIProvider.MANUS,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        cost: 0, // مجاني تماماً
        usage: response.usage || { tokens: 0 },
        latency: this.getLatency(),
        model: response.model || 'deepseek-chat'
      };
    } catch (error: any) {
      console.error('❌ Manus LLM Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Manus invokeLLM failed: ${error.message}`
      });
    }
  }

  // 2. DeepSeek API (رخيص وسريع - ممتاز للكود)
  async invokeDeepSeek(
    messages: any[],
    options: { model?: string; temperature?: number } = {}
  ): Promise<AIResponse> {
    this.startTimer();
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'DEEPSEEK_API_KEY not configured in environment variables'
      });
    }

    try {
      console.log('🚀 Using DeepSeek API (Cost-effective)...');
      
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'deepseek-chat',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response format from DeepSeek API');
      }

      return {
        provider: AIProvider.DEEPSEEK,
        content: data.choices[0].message.content,
        cost: this.calculateDeepSeekCost(data.usage || {}),
        usage: data.usage || {},
        latency: this.getLatency(),
        model: options.model || 'deepseek-chat'
      };
    } catch (error: any) {
      console.error('❌ DeepSeek API Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `DeepSeek API failed: ${error.message}`
      });
    }
  }

  // 3. Claude API (متقدم - للمهام المعقدة)
  async invokeClaude(
    messages: any[],
    options: { model?: string; maxTokens?: number } = {}
  ): Promise<AIResponse> {
    this.startTimer();
    
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'CLAUDE_API_KEY not configured in environment variables'
      });
    }

    try {
      console.log('🎯 Using Claude API (Advanced tasks)...');
      
      // تحويل تنسيق الرسائل ليكون متوافقاً مع Claude
      const claudeMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

      const systemMessage = messages.find(msg => msg.role === 'system')?.content || 
        'You are a helpful AI assistant that speaks Arabic fluently.';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens || 1000,
          messages: claudeMessages,
          system: systemMessage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0]) {
        throw new Error('Invalid response format from Claude API');
      }

      return {
        provider: AIProvider.CLAUDE,
        content: data.content[0].text,
        cost: this.calculateClaudeCost(data.usage || {}),
        usage: data.usage || {},
        latency: this.getLatency(),
        model: options.model || 'claude-3-sonnet-20240229'
      };
    } catch (error: any) {
      console.error('❌ Claude API Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Claude API failed: ${error.message}`
      });
    }
  }

  // ========== SMART ROUTER ==========

  async generateResponse(
    messages: any[],
    options: AIOptions = {}
  ): Promise<AIResponse> {
    const {
      provider,
      autoSelect = true,
      maxCost = 0.1, // $0.10 كحد أقصى
      fallback = true,
      model = 'auto',
      temperature = 0.7
    } = options;

    console.log('🧠 Unified AI Service - Processing request...');
    console.log(`   Auto-select: ${autoSelect}, Max cost: $${maxCost}, Fallback: ${fallback}`);

    // إذا حدد provider محدد، استخدمه مباشرة
    if (provider && !autoSelect) {
      console.log(`🎯 Using specified provider: ${provider}`);
      return this.invokeProvider(provider, messages, { model, temperature });
    }

    // الذكي: اختيار أفضل provider بناءً على المهمة والتكلفة
    const selectedProvider = this.selectSmartProvider(
      messages[messages.length - 1]?.content || '',
      maxCost,
      model
    );
    
    console.log(`🤖 Smart router selected: ${selectedProvider}`);

    try {
      return await this.invokeProvider(selectedProvider, messages, { model, temperature });
    } catch (error) {
      // Fallback تلقائي إذا فشل Provider
      if (fallback) {
        console.warn(`⚠️ Provider ${selectedProvider} failed, trying fallback...`);
        return this.fallbackProvider(selectedProvider, messages, { model, temperature });
      }
      throw error;
    }
  }

  // ========== INTELLIGENT PROVIDER SELECTION ==========

  private selectSmartProvider(
    userMessage: string,
    maxCost: number,
    model: string
  ): AIProvider {
    const message = userMessage.toLowerCase();
    
    // 1. إذا كانت المهمة بسيطة → Manus (مجاني)
    if (this.isSimpleTask(message)) {
      console.log('📝 Task type: Simple → Manus (Free)');
      return AIProvider.MANUS;
    }

    // 2. إذا كانت المهمة متعلقة بالبرمجة → DeepSeek (ممتاز للكود)
    if (this.isCodeTask(message) && process.env.DEEPSEEK_API_KEY) {
      console.log('💻 Task type: Coding → DeepSeek (Best for code)');
      return AIProvider.DEEPSEEK;
    }

    // 3. إذا كانت المهمة إبداعية ومعقدة → Claude (إذا سمحت التكلفة)
    if (this.isCreativeTask(message) && maxCost >= 0.1 && process.env.CLAUDE_API_KEY) {
      console.log('🎨 Task type: Creative/Complex → Claude (Premium)');
      return AIProvider.CLAUDE;
    }

    // 4. إذا كانت المهمة تحليلية → DeepSeek (جيد وسريع)
    if (this.isAnalyticalTask(message) && maxCost >= 0.01 && process.env.DEEPSEEK_API_KEY) {
      console.log('🔍 Task type: Analytical → DeepSeek (Fast & accurate)');
      return AIProvider.DEEPSEEK;
    }

    // 5. الافتراضي: Manus (مجاني)
    console.log('⚡ Default: Manus (Free & reliable)');
    return AIProvider.MANUS;
  }

  // ========== TASK DETECTION ==========

  private isSimpleTask(message: string): boolean {
    const simplePatterns = [
      /^(مرحبا|hello|hi|اهلا|السلام)/i,
      /^(كيف حالك|how are you)/i,
      /^(ما اسمك|who are you)/i,
      /^(شكرا|thank you|ممتاز)/i,
      /^(بسيط|simple|سؤال بسيط)/i,
      /^(نعم|yes|لا|no|ok|حسنا)/i
    ];
    return simplePatterns.some(pattern => pattern.test(message));
  }

  private isCodeTask(message: string): boolean {
    const codePatterns = [
      /(كود|code|برنامج|program)/i,
      /(دالة|function|class|واجهة)/i,
      /(javascript|typescript|python|java|php|html|css)/i,
      /(bug|error|خطأ|تصحيح)/i,
      /(مكتبة|library|package|npm|yarn)/i,
      /(خوارزمية|algorithm|بنية بيانات)/i
    ];
    return codePatterns.some(pattern => pattern.test(message));
  }

  private isCreativeTask(message: string): boolean {
    const creativePatterns = [
      /(قصة|story|رواية)/i,
      /(شعر|poem|قصيدة)/i,
      /(إبداع|creative|تخيل|imagine)/i,
      /(تخطيط|planning|استراتيجية|strategy)/i,
      /(تصميم|design|art|فن)/i,
      /(ابتكار|innovation|جديد|new idea)/i
    ];
    return creativePatterns.some(pattern => pattern.test(message));
  }

  private isAnalyticalTask(message: string): boolean {
    const analyticalPatterns = [
      /(حلل|analyze|تحليل)/i,
      /(قارن|compare|comparison)/i,
      /(بحث|research|study)/i,
      /(شرح|explain|explanations)/i,
      /(رأيك|opinion|نصيحة|advice)/i,
      /(تقييم|evaluate|assessment)/i
    ];
    return analyticalPatterns.some(pattern => pattern.test(message));
  }

  // ========== HELPER METHODS ==========

  private async invokeProvider(
    provider: AIProvider,
    messages: any[],
    options: { model?: string; temperature?: number }
  ): Promise<AIResponse> {
    switch (provider) {
      case AIProvider.MANUS:
        return this.invokeManusLLM(messages, {
          model: options.model === 'auto' ? 'deepseek-chat' : options.model,
          temperature: options.temperature
        });
      case AIProvider.DEEPSEEK:
        return this.invokeDeepSeek(messages, {
          model: options.model === 'auto' ? 'deepseek-chat' : options.model,
          temperature: options.temperature
        });
      case AIProvider.CLAUDE:
        return this.invokeClaude(messages, {
          model: options.model === 'auto' ? 'claude-3-sonnet-20240229' : options.model
        });
      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown provider: ${provider}`
        });
    }
  }

  private async fallbackProvider(
    failedProvider: AIProvider,
    messages: any[],
    options: { model?: string; temperature?: number }
  ): Promise<AIResponse> {
    // ترتيب Fallback (المجاني أولاً)
    const fallbackOrder = [
      AIProvider.MANUS,    // مجاني ومضمون
      AIProvider.DEEPSEEK, // رخيص
      AIProvider.CLAUDE    // متقدم
    ].filter(p => p !== failedProvider);

    for (const provider of fallbackOrder) {
      try {
        console.log(`🔄 Trying fallback: ${provider}`);
        return await this.invokeProvider(provider, messages, options);
      } catch (error: any) {
        console.log(`❌ Fallback ${provider} also failed:`, error.message);
        // استمر في المحاولة مع Provider التالي
      }
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'All AI providers failed. Please check your API keys and internet connection.'
    });
  }

  // ========== COST CALCULATION ==========

  private calculateDeepSeekCost(usage: any): number {
    // DeepSeek pricing: $0.14 per 1M tokens
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    
    return (totalTokens / 1000000) * 0.14;
  }

  private calculateClaudeCost(usage: any): number {
    // Claude Sonnet pricing: $3 per 1M input, $15 per 1M output
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    
    const inputCost = (inputTokens / 1000000) * 3;
    const outputCost = (outputTokens / 1000000) * 15;
    
    return inputCost + outputCost;
  }

  // ========== PERFORMANCE MONITORING ==========

  private startTimer(): void {
    this.startTime = Date.now();
  }

  private getLatency(): number {
    return Date.now() - this.startTime;
  }

  // ========== UTILITY METHODS ==========

  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [AIProvider.MANUS];
    
    if (process.env.DEEPSEEK_API_KEY) {
      providers.push(AIProvider.DEEPSEEK);
    }
    
    if (process.env.CLAUDE_API_KEY) {
      providers.push(AIProvider.CLAUDE);
    }
    
    return providers;
  }

  getProviderInfo(provider: AIProvider) {
    const info = {
      [AIProvider.MANUS]: {
        name: 'Manus invokeLLM',
        cost: 'Free',
        bestFor: 'Simple queries, greetings, basic tasks',
        maxTokens: 2000
      },
      [AIProvider.DEEPSEEK]: {
        name: 'DeepSeek API',
        cost: '$0.14 per 1M tokens',
        bestFor: 'Code generation, analysis, technical tasks',
        maxTokens: 2000
      },
      [AIProvider.CLAUDE]: {
        name: 'Claude API',
        cost: '$3-15 per 1M tokens',
        bestFor: 'Creative writing, complex analysis, strategy',
        maxTokens: 1000
      }
    };
    
    return info[provider] || { name: 'Unknown', cost: 'N/A', bestFor: 'N/A', maxTokens: 0 };
  }
}
