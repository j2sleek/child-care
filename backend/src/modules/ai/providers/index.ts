import { env } from '../../../config/env.ts';
import type { AiCapability, AiProvider } from '../ai.provider.ts';
import { MistralProvider } from './mistral.provider.ts';
import { OpenAiProvider } from './openai.provider.ts';

let cachedProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  const provider = env.AI_PROVIDER;

  if (provider === 'mistral') {
    if (!env.MISTRAL_API_KEY) {
      throw Object.assign(new Error('AI features require a configured MISTRAL_API_KEY'), {
        statusCode: 503,
        code: 'AI_UNAVAILABLE',
      });
    }
    cachedProvider = new MistralProvider(env.MISTRAL_API_KEY);
    return cachedProvider;
  }

  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) {
      throw Object.assign(new Error('AI features require a configured OPENAI_API_KEY'), {
        statusCode: 503,
        code: 'AI_UNAVAILABLE',
      });
    }
    cachedProvider = new OpenAiProvider(env.OPENAI_API_KEY);
    return cachedProvider;
  }

  throw Object.assign(new Error(`Unknown AI provider: ${provider}`), {
    statusCode: 503,
    code: 'AI_UNAVAILABLE',
  });
}

export function isAiAvailable(): boolean {
  try {
    getAiProvider();
    return true;
  } catch {
    return false;
  }
}

/** Returns true if the active provider supports the given capability. */
export function providerSupports(capability: AiCapability): boolean {
  try {
    return getAiProvider().supportsCapability(capability);
  } catch {
    return false;
  }
}

/** Throws 503 if AI is unavailable or the provider doesn't support the capability. */
export function requireCapability(capability: AiCapability): AiProvider {
  const p = getAiProvider(); // throws AI_UNAVAILABLE if not configured
  if (!p.supportsCapability(capability)) {
    throw Object.assign(
      new Error(`The configured AI provider does not support: ${capability}`),
      { statusCode: 503, code: 'AI_CAPABILITY_UNAVAILABLE' },
    );
  }
  return p;
}
