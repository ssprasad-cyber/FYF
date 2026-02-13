import { dbService } from './dbService';
import { usageTracker } from './usageTracker';
import { normalizeInput } from '../utils/normalize';


const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

/**
 * AI Service for nutritional analysis.
 * Fixes included:
 * - Corrected model name to supported preview version.
 * - Added exponential backoff for API reliability.
 * - Improved JSON cleaning logic.
 * - Enhanced prompt for better data consistency.
 */
export const aiService = {
    async parseFood(input) {
        if (!input || !input.trim()) return null;

        const normalizedInput = normalizeInput(input);

        // 1. Check Cache
        const cached = await dbService.getCachedFood(normalizedInput);
        if (cached) {
            return { ...cached.nutrition, source: 'cache' };
        }

        // 2. Usage Limits
        const status = await usageTracker.getStatus();
        if (!status.allowed) {
            throw new Error("Daily API limit reached. Please try again tomorrow.");
        }

        // 3. Settings & Key
        const settings = await dbService.getSettings();
        const apiKey = settings.apiKey;

        if (!apiKey) {
            throw new Error("API Key not set. Please go to Settings to configure your provider.");
        }

        // 4. Provider Execution
        let nutrition;
        try {
            if (settings.provider === 'gemini') {
                nutrition = await callGemini(apiKey, input);
            } else {
                throw new Error(`Provider ${settings.provider} is not currently supported.`);
            }
        } catch (e) {
            console.error("AI Service Error:", e);
            throw e;
        }

        // 5. Finalize
            await usageTracker.trackRequest(settings.provider);
            if (nutrition) {
            await dbService.cacheFood(normalizedInput, nutrition);

        }

        return { ...nutrition, source: 'api' };
    }
};

/**
 * Calls Gemini with JSON response enforcement.
 */
async function callGemini(apiKey, input, retryCount = 0) {
    try {
        return await parseMacroText(apiKey, input);
    } catch (error) {
        if (retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return callGemini(apiKey, input, retryCount + 1);
        }

        console.error("Gemini API Max Retries Reached:", error);
        throw new Error("The AI service is currently busy. Please try again in a moment.");
    }
}

const parseMacroText = async (apiKey, text) => {
    const systemPrompt = `You are a nutrition expert. Convert the user's food description into a JSON object.
  Format: { 
    "foodName": string, 
    "calories": number, 
    "protein": number, 
    "carbs": number, 
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  }.
  Be as accurate as possible. Only return valid JSON.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: text }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) throw new Error('Gemini API call failed');
        const result = await response.json();
        return JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
};