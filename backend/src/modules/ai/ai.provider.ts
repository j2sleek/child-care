export type AiCapability = 'chat' | 'transcription';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiProvider {
  /** One-shot text completion (system + single user turn). */
  generateCompletion(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Multi-turn chat completion.
   * Optional — check supportsCapability('chat') before calling.
   */
  generateChatCompletion?(messages: ChatMessage[]): Promise<string>;

  /**
   * Transcribe audio to text.
   * Optional — check supportsCapability('transcription') before calling.
   * @param audioBuffer Raw audio bytes.
   * @param mimeType  e.g. 'audio/webm', 'audio/mp4', 'audio/wav'
   */
  transcribeAudio?(audioBuffer: Buffer, mimeType: string): Promise<string>;

  /** Returns true if this provider supports the given optional capability. */
  supportsCapability(capability: AiCapability): boolean;
}
