import { env } from "../../../config/env.js";
import { MistralProvider } from "./mistral.provider.js";
let cachedProvider = null;
export function getAiProvider() {
    if (cachedProvider)
        return cachedProvider;
    const provider = env.AI_PROVIDER;
    if (provider === 'mistral') {
        if (!env.MISTRAL_API_KEY) {
            throw Object.assign(new Error('AI features require a configured MISTRAL_API_KEY'), {
                statusCode: 503,
                code: 'AI_UNAVAILABLE'
            });
        }
        cachedProvider = new MistralProvider(env.MISTRAL_API_KEY);
        return cachedProvider;
    }
    throw Object.assign(new Error(`Unknown AI provider: ${provider}`), {
        statusCode: 503,
        code: 'AI_UNAVAILABLE'
    });
}
export function isAiAvailable() {
    try {
        getAiProvider();
        return true;
    }
    catch {
        return false;
    }
}
