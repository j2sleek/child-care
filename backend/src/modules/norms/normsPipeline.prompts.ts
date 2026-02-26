export const METRICS = ['sleepMinutesPerDay', 'feedsPerDay', 'wakeWindowMinutes'] as const;
export type NormMetric = typeof METRICS[number];

export const AGE_BANDS: { min: number; max: number; label: string }[] = [
  { min: 0, max: 4, label: '0-4 weeks (newborn)' },
  { min: 4, max: 8, label: '4-8 weeks (1-2 months)' },
  { min: 8, max: 13, label: '8-13 weeks (2-3 months)' },
  { min: 13, max: 17, label: '13-17 weeks (3-4 months)' },
  { min: 17, max: 26, label: '17-26 weeks (4-6 months)' },
  { min: 26, max: 39, label: '26-39 weeks (6-9 months)' },
  { min: 39, max: 52, label: '39-52 weeks (9-12 months)' },
  { min: 52, max: 78, label: '52-78 weeks (12-18 months)' },
  { min: 78, max: 104, label: '78-104 weeks (18-24 months)' },
];

const METRIC_DESCRIPTIONS: Record<NormMetric, string> = {
  sleepMinutesPerDay: 'total sleep duration in minutes per 24-hour period',
  feedsPerDay: 'number of feedings (breast or bottle) per 24-hour period',
  wakeWindowMinutes: 'maximum appropriate awake time between naps in minutes',
};

export const SYSTEM_PROMPT = `You are a pediatric health data specialist with expertise in infant and toddler developmental norms. Your role is to provide evidence-based ranges for child care metrics based on established guidelines from AAP (American Academy of Pediatrics), WHO (World Health Organization), and peer-reviewed pediatric research.

You must return responses as valid JSON only — no markdown, no explanation outside the JSON. Be conservative with ranges and always cite your sources.`;

export function buildUserPrompt(metric: NormMetric, ageBand: { min: number; max: number; label: string }): string {
  const desc = METRIC_DESCRIPTIONS[metric];
  return `Provide the normal range for ${desc} for infants/toddlers aged ${ageBand.label} (${ageBand.min}-${ageBand.max} weeks).

Return a single JSON object with this exact structure:
{
  "low": <number - lower bound of normal range>,
  "high": <number - upper bound of normal range>,
  "notes": "<brief explanation of the range and any important considerations>",
  "sources": ["<source 1>", "<source 2>"],
  "confidence": "<high|medium|low>"
}

Rules:
- "low" and "high" must be numbers representing ${desc}
- "notes" should mention any important variations or considerations for this age group
- "sources" should cite specific guidelines (e.g., "AAP Sleep Guidelines 2022", "WHO Infant Feeding Recommendations")
- "confidence" should be "high" if well-established by multiple sources, "medium" if some variation in guidelines, "low" if limited evidence
- Return ONLY the JSON object, no other text`;
}
