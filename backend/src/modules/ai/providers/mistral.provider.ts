import { Mistral } from '@mistralai/mistralai';
import type { AiCapability, AiProvider, ChatMessage } from '../ai.provider.ts';
import { env } from '../../../config/env.ts';

export class MistralProvider implements AiProvider {
  private client: Mistral;
  private model: string;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
    // Allow overriding the model via AI_MODEL env var; fall back to mistral-medium-latest
    this.model = env.AI_MODEL || 'mistral-medium-latest';
  }

  supportsCapability(capability: AiCapability): boolean {
    return capability === 'chat'; // Mistral supports multi-turn chat; no audio transcription API
  }

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.client.chat.complete({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected AI response format');
    }
    return content;
  }

  async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    const response = await this.client.chat.complete({
      model: this.model,
      messages: messages as any,
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected AI response format');
    }
    return content;
  }
}
