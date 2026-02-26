export type PlanTier = 'free' | 'pro';

export interface PlanLimits {
  maxChildren: number;        // Infinity = unlimited
  maxEventsPerMonth: number;  // Infinity = unlimited
  aiEnabled: boolean;
  voiceEnabled: boolean;
  avatarsEnabled: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxChildren: 1,
    maxEventsPerMonth: 500,
    aiEnabled: false,
    voiceEnabled: false,
    avatarsEnabled: false,
  },
  pro: {
    maxChildren: Infinity,
    maxEventsPerMonth: Infinity,
    aiEnabled: true,
    voiceEnabled: true,
    avatarsEnabled: true,
  },
};

/** Limits applied to a free user during an active trial (AI/voice only — rest stays free). */
export const TRIAL_LIMIT_OVERRIDES: Partial<PlanLimits> = {
  aiEnabled: true,
  voiceEnabled: true,
};

export const TRIAL_DURATION_DAYS = 14;
