import OpenAI from 'openai';
import { Readable } from 'stream';
import type { AiCapability, AiProvider, ChatMessage } from '../ai.provider.ts';
import { env } from '../../../config/env.ts';

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    // Allow overriding via AI_MODEL; fall back to OPENAI_MODEL; default gpt-4o
    this.model = env.AI_MODEL || env.OPENAI_MODEL || 'gpt-4o';
  }

  supportsCapability(capability: AiCapability): boolean {
    return capability === 'chat' || capability === 'transcription';
  }

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected AI response format');
    }
    return content;
  }

  async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected AI response format');
    }
    return content;
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.split('/')[1]?.replace('mpeg', 'mp3') ?? 'webm';
    const filename = `audio.${ext}`;

    // OpenAI SDK expects a File-like object or a stream with a name property
    const file = new File([audioBuffer], filename, { type: mimeType });

    const response = await this.client.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      response_format: 'text',
    });

    // When response_format is 'text', the SDK returns the string directly
    return response as unknown as string;
  }
}
