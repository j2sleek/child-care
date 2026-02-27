import { apiClient } from '../client';

export interface BillingPlan {
  plan: 'free' | 'pro';
  trial: {
    active: boolean;
    used: boolean;
    expiresAt?: string;
  };
  features: string[];
}

export const billingApi = {
  getPlan: () => apiClient.get<BillingPlan>('/billing/plan').then((r) => r.data),

  startTrial: () => apiClient.post<BillingPlan>('/billing/trial/start').then((r) => r.data),
};
