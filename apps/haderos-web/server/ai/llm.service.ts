
import OpenAI from 'openai';
import { aiConfig } from './config';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: aiConfig.openaiApiKey,
    dangerouslyAllowBrowser: false, // Server-side only
});

export interface LLMResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Generic Service for LLM Interactions
 * Abstraction layer to allow swapping providers later if needed
 */
export class LLMService {
    private static instance: LLMService;

    private constructor() { }

    public static getInstance(): LLMService {
        if (!LLMService.instance) {
            LLMService.instance = new LLMService();
        }
        return LLMService.instance;
    }

    /**
     * Generate a completion based on system and user prompt
     */
    async generateCompletion(
        systemPrompt: string,
        userPrompt: string,
        model = aiConfig.model
    ): Promise<LLMResponse> {
        try {
            if (!aiConfig.openaiApiKey) {
                console.warn('[LLMService] OPENAI_API_KEY not found. Returning mock response.');
                return { content: 'AI Service Unavailable: Missing API Key' };
            }

            const response = await openai.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: aiConfig.temperature,
                max_tokens: aiConfig.maxTokens,
            });

            return {
                content: response.choices[0]?.message?.content || '',
                usage: response.usage,
            };
        } catch (error) {
            console.error('[LLMService] Error generating completion:', error);
            throw new Error('Failed to generate AI response');
        }
    }

    /**
     * Generate a structured JSON response (Simulated with standard prompt for compatibility)
     */
    async generateJSON<T>(
        systemPrompt: string,
        userPrompt: string
    ): Promise<T> {
        const jsonSystemPrompt = `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.`;

        const response = await this.generateCompletion(jsonSystemPrompt, userPrompt);
        try {
            // Clean potential markdown blocks
            const cleanContent = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent) as T;
        } catch (error) {
            console.error('[LLMService] Failed to parse JSON response:', error);
            throw new Error('Invalid JSON response from AI');
        }
    }
}

export const llmService = LLMService.getInstance();
