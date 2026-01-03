
import dotenv from 'dotenv';
dotenv.config();

/**
 * AI Service Configuration
 */
export const aiConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: 0.2, // Low temperature for consistent, rule-following outputs
    maxTokens: 1000,
};
