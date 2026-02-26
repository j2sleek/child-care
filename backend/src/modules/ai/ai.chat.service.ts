import { Types } from 'mongoose';
import { requirePermission } from '../../utils/permissions.ts';
import { env } from '../../config/env.ts';
import { requireCapability } from './providers/index.ts';
import redisClient from '../../config/redis.ts';
import { buildAiContext } from './ai.collector.ts';
import { formatContextForChat } from './ai.chat.context.ts';
import AiConversationModel, { type ConversationMessage } from './aiConversation.model.ts';
import type { ChatMessage } from './ai.provider.ts';

/**
 * System prompt that strictly scopes the AI to app data only.
 * The child's current data is injected per-request so the assistant always has fresh context.
 */
function buildSystemPrompt(contextSummary: string): string {
  return `You are a pediatric care assistant embedded in a child care tracking app.
You ONLY discuss topics related to this child's care data, sleep, feeding, development, and general pediatric health guidance.
If the user asks about anything outside child care (weather, coding, news, politics, recipes, etc.), politely decline and redirect to child care topics.
Never provide medical diagnoses. Always recommend consulting a pediatrician for medical concerns.
Be warm, supportive, and evidence-based.

## Current Child Data (as of this request)
${contextSummary}`;
}

/** Retrieve the conversation history for a user+child pair (or empty array if none). */
export async function getChatHistory(userId: string, childId: string) {
  await requirePermission(userId, childId, 'canRead');
  const conv = await AiConversationModel.findOne({
    userId: new Types.ObjectId(userId),
    childId: new Types.ObjectId(childId),
  }).lean();
  return conv?.messages ?? [];
}

/** Send a message and get an AI reply. Persists both turns to the conversation. */
export async function sendChatMessage(
  userId: string,
  childId: string,
  userMessage: string,
): Promise<{ reply: string; messages: ConversationMessage[] }> {
  await requirePermission(userId, childId, 'canRead');

  // Daily rate limit
  const today = new Date().toISOString().slice(0, 10);
  const rateLimitKey = `chat:limit:${userId}:${today}`;
  const msgCount = await redisClient.incr(rateLimitKey);
  if (msgCount === 1) await redisClient.expire(rateLimitKey, 25 * 60 * 60); // 25h TTL
  if (msgCount > env.AI_CHAT_DAILY_LIMIT) {
    throw Object.assign(
      new Error(`Daily chat limit of ${env.AI_CHAT_DAILY_LIMIT} messages reached. Limit resets at midnight.`),
      { statusCode: 429, code: 'CHAT_LIMIT_REACHED' },
    );
  }

  const provider = requireCapability('chat');

  // Build fresh child context for every request so the AI always has up-to-date data
  const ctx = await buildAiContext(userId, childId);
  const contextSummary = formatContextForChat(ctx);
  const systemPrompt = buildSystemPrompt(contextSummary);

  // Load existing conversation
  let conv = await AiConversationModel.findOne({
    userId: new Types.ObjectId(userId),
    childId: new Types.ObjectId(childId),
  });

  if (!conv) {
    conv = new AiConversationModel({
      userId: new Types.ObjectId(userId),
      childId: new Types.ObjectId(childId),
      messages: [],
    });
  }

  // Keep a sliding window of the last N turns (user + assistant each count as 1)
  const historyLimit = env.AI_CHAT_HISTORY_LIMIT;
  const recent = conv.messages.slice(-historyLimit);

  // Build the messages array for the provider
  const providerMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...recent.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const reply = await provider.generateChatCompletion!(providerMessages);

  // Persist both turns
  const now = new Date();
  conv.messages.push({ role: 'user', content: userMessage, timestamp: now });
  conv.messages.push({ role: 'assistant', content: reply, timestamp: now });

  // Trim stored history to 2× the limit to avoid unbounded growth
  const maxStored = historyLimit * 2;
  if (conv.messages.length > maxStored) {
    conv.messages = conv.messages.slice(-maxStored);
  }

  await conv.save();

  return { reply, messages: conv.messages };
}

/** Clear all conversation history for a user+child pair. */
export async function clearChat(userId: string, childId: string): Promise<void> {
  await requirePermission(userId, childId, 'canWrite');
  await AiConversationModel.deleteOne({
    userId: new Types.ObjectId(userId),
    childId: new Types.ObjectId(childId),
  });
}
