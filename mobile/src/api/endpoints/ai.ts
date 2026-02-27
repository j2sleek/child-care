import { apiClient } from '../client';

export interface AiInsight {
  type: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const aiApi = {
  status: () => apiClient.get('/ai/status').then((r) => r.data),

  insights: (childId: string) =>
    apiClient.get<{ insights: AiInsight[] }>(`/ai/insights/${childId}`).then((r) => r.data),

  recommendations: (childId: string) =>
    apiClient
      .get<{ recommendations: AiInsight[] }>(`/ai/recommendations/${childId}`)
      .then((r) => r.data),

  anomalies: (childId: string) =>
    apiClient.get<{ anomalies: AiInsight[] }>(`/ai/anomalies/${childId}`).then((r) => r.data),

  digest: (childId: string) =>
    apiClient.get<{ digest: string; generatedAt: string }>(`/ai/digest/${childId}`).then((r) => r.data),

  chat: (childId: string, message: string, history: ChatMessage[]) =>
    apiClient
      .post<{ reply: string }>(`/ai/chat/${childId}`, { message, history })
      .then((r) => r.data),
};
