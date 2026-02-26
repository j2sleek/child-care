import { requirePermission } from "../../utils/permissions.js";
import { env } from "../../config/env.js";
import redisClient from "../../config/redis.js";
import { getAiProvider } from "./providers/index.js";
import { buildAiContext, collectChildContext, collectRecentEvents, collectNorms } from "./ai.collector.js";
import AiDigestModel from "./aiDigest.model.js";
function ensureAiAvailable() {
    getAiProvider();
}
const SYSTEM_PROMPT = `You are a pediatric care analyst. Analyze the provided child care data and return structured JSON. Be evidence-based, cite specific data points, and flag anything outside normal ranges. Never provide medical diagnoses. Always be supportive and constructive in tone.`;
function formatContextForPrompt(ctx) {
    const { child, recentEvents, analytics, norms } = ctx;
    const sleepSummary = analytics.sleepSummary
        .map((d) => `  ${d._id}: ${d.totalSleepMinutes} min (${d.sessions} sessions)`)
        .join('\n') || '  No sleep data';
    const feedingSummary = analytics.feedingPattern
        .map((d) => `  ${d._id.day}: ${d.totalAmount ?? 0} ml (${d.feedCount} feeds)`)
        .join('\n') || '  No feeding data';
    const diaperCount = recentEvents.diaper.length;
    const moodEntries = recentEvents.mood
        .map((e) => `  ${new Date(e.startTime).toISOString().slice(0, 10)}: ${e.data?.mood ?? e.notes ?? 'logged'}`)
        .join('\n') || '  No mood data';
    const normsText = [
        norms.sleepMinutesPerDay ? `Sleep: ${norms.sleepMinutesPerDay.low}-${norms.sleepMinutesPerDay.high} min/day` : null,
        norms.feedsPerDay ? `Feeds: ${norms.feedsPerDay.low}-${norms.feedsPerDay.high} per day` : null,
        norms.wakeWindowMinutes ? `Wake windows: ${norms.wakeWindowMinutes.low}-${norms.wakeWindowMinutes.high} min` : null,
    ].filter(Boolean).join('\n') || 'No norms available for this age';
    return `Child: ${child.name}, Age: ${child.ageWeeks} weeks (${child.ageMonths} months)

## Recent Care Events (last 7 days)
### Sleep
${sleepSummary}

### Feeding
${feedingSummary}

### Diaper
  ${diaperCount} changes in last 7 days

### Mood
${moodEntries}

## Age-Appropriate Norms
${normsText}`;
}
async function getCached(key) {
    try {
        return await redisClient.get(key);
    }
    catch {
        return null;
    }
}
async function setCache(key, value) {
    try {
        await redisClient.set(key, value, { EX: env.AI_CACHE_TTL_SECONDS });
    }
    catch {
        // Cache failure is non-critical
    }
}
export async function invalidateAiCache(childId) {
    try {
        const keys = [
            `ai:insights:${childId}`,
            `ai:recommendations:${childId}`,
            `ai:anomalies:${childId}`
        ];
        await Promise.all(keys.map(k => redisClient.del(k)));
    }
    catch {
        // Cache invalidation failure is non-critical
    }
}
export async function generateInsights(userId, childId) {
    ensureAiAvailable();
    await requirePermission(userId, childId, 'canRead');
    const cacheKey = `ai:insights:${childId}`;
    const cached = await getCached(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const ctx = await buildAiContext(userId, childId);
    const contextText = formatContextForPrompt(ctx);
    const userPrompt = `${contextText}

## Request
Analyze this child's care data and return JSON with this exact structure:
{
  "insights": ["insight1", "insight2", ...],
  "concerns": ["concern1", ...],
  "positives": ["positive1", ...]
}
Provide 3-5 insights, flag any concerns compared to norms, and highlight positive patterns.`;
    const provider = getAiProvider();
    const raw = await provider.generateCompletion(SYSTEM_PROMPT, userPrompt);
    let result;
    try {
        result = JSON.parse(raw);
    }
    catch {
        result = { insights: [raw], concerns: [], positives: [] };
    }
    await setCache(cacheKey, JSON.stringify(result));
    return result;
}
export async function generateRecommendations(userId, childId) {
    ensureAiAvailable();
    await requirePermission(userId, childId, 'canRead');
    const cacheKey = `ai:recommendations:${childId}`;
    const cached = await getCached(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const ctx = await buildAiContext(userId, childId);
    const contextText = formatContextForPrompt(ctx);
    const userPrompt = `${contextText}

## Request
Based on this data and the age-appropriate norms, provide actionable recommendations. Return JSON with this exact structure:
{
  "recommendations": [
    { "category": "sleep|feeding|activity|general", "title": "short title", "description": "detailed recommendation", "priority": "high|medium|low" }
  ]
}
Provide 3-6 specific, actionable recommendations prioritized by importance.`;
    const provider = getAiProvider();
    const raw = await provider.generateCompletion(SYSTEM_PROMPT, userPrompt);
    let result;
    try {
        result = JSON.parse(raw);
    }
    catch {
        result = { recommendations: [{ category: 'general', title: 'AI Response', description: raw, priority: 'medium' }] };
    }
    await setCache(cacheKey, JSON.stringify(result));
    return result;
}
export async function detectAnomalies(userId, childId) {
    ensureAiAvailable();
    await requirePermission(userId, childId, 'canRead');
    const cacheKey = `ai:anomalies:${childId}`;
    const cached = await getCached(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const ctx = await buildAiContext(userId, childId);
    const contextText = formatContextForPrompt(ctx);
    // Rule-based pre-filtering
    const flags = [];
    const { analytics, norms } = ctx;
    if (norms.sleepMinutesPerDay && analytics.sleepSummary.length > 0) {
        const avgSleep = analytics.sleepSummary.reduce((sum, d) => sum + d.totalSleepMinutes, 0) / analytics.sleepSummary.length;
        if (avgSleep < norms.sleepMinutesPerDay.low)
            flags.push(`Average daily sleep (${Math.round(avgSleep)} min) is below the norm range (${norms.sleepMinutesPerDay.low}-${norms.sleepMinutesPerDay.high} min)`);
        if (avgSleep > norms.sleepMinutesPerDay.high)
            flags.push(`Average daily sleep (${Math.round(avgSleep)} min) is above the norm range (${norms.sleepMinutesPerDay.low}-${norms.sleepMinutesPerDay.high} min)`);
    }
    if (norms.feedsPerDay && analytics.feedingPattern.length > 0) {
        const avgFeeds = analytics.feedingPattern.reduce((sum, d) => sum + d.feedCount, 0) / analytics.feedingPattern.length;
        if (avgFeeds < norms.feedsPerDay.low)
            flags.push(`Average daily feeds (${avgFeeds.toFixed(1)}) is below the norm range (${norms.feedsPerDay.low}-${norms.feedsPerDay.high})`);
        if (avgFeeds > norms.feedsPerDay.high)
            flags.push(`Average daily feeds (${avgFeeds.toFixed(1)}) is above the norm range (${norms.feedsPerDay.low}-${norms.feedsPerDay.high})`);
    }
    const flagsText = flags.length > 0
        ? `\n## Pre-detected Flags\n${flags.map(f => `- ${f}`).join('\n')}`
        : '';
    const userPrompt = `${contextText}${flagsText}

## Request
Analyze this data for anomalies and unusual patterns. Return JSON with this exact structure:
{
  "anomalies": [
    { "metric": "sleep|feeding|diaper|mood", "severity": "high|medium|low", "description": "what was detected", "recommendation": "what to do about it" }
  ],
  "overallStatus": "normal|attention|concern"
}
Only flag genuine anomalies based on the data and norms. If everything looks normal, return an empty anomalies array with overallStatus "normal".`;
    const provider = getAiProvider();
    const raw = await provider.generateCompletion(SYSTEM_PROMPT, userPrompt);
    let result;
    try {
        result = JSON.parse(raw);
    }
    catch {
        result = { anomalies: [], overallStatus: 'normal', rawNote: raw };
    }
    await setCache(cacheKey, JSON.stringify(result));
    return result;
}
export async function getDailyDigest(userId, childId, date) {
    ensureAiAvailable();
    await requirePermission(userId, childId, 'canRead');
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const existing = await AiDigestModel.findOne({
        childId,
        date: targetDate
    }).lean();
    if (existing)
        return existing;
    // Generate on-demand if no stored digest
    return generateAndStoreDigest(userId, childId, targetDate);
}
async function generateAndStoreDigest(userId, childId, date) {
    const ctx = await buildAiContext(userId, childId);
    const contextText = formatContextForPrompt(ctx);
    const userPrompt = `${contextText}

## Request
Generate a comprehensive daily digest for this child. Return JSON with this exact structure:
{
  "summary": "A 2-3 sentence overall summary of the day",
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["recommendation1", ...],
  "anomalies": ["anomaly1", ...],
  "sleepScore": 0-100,
  "feedingScore": 0-100,
  "overallScore": 0-100
}
Scores should be 0-100 based on how well the child's metrics align with age-appropriate norms (100 = perfectly aligned).`;
    const provider = getAiProvider();
    const raw = await provider.generateCompletion(SYSTEM_PROMPT, userPrompt);
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        parsed = {
            summary: raw,
            insights: [],
            recommendations: [],
            anomalies: [],
            overallScore: undefined
        };
    }
    const digest = await AiDigestModel.findOneAndUpdate({ childId, date }, {
        childId,
        date,
        summary: parsed.summary ?? '',
        insights: parsed.insights ?? [],
        recommendations: parsed.recommendations ?? [],
        anomalies: parsed.anomalies ?? [],
        sleepScore: parsed.sleepScore,
        feedingScore: parsed.feedingScore,
        overallScore: parsed.overallScore,
        rawResponse: raw
    }, { upsert: true, new: true });
    return digest;
}
export async function generateDailyDigest(childId) {
    ensureAiAvailable();
    const child = await collectChildContext(childId);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);
    const recentEvents = await collectRecentEvents(childId, 1);
    const norms = await collectNorms(child.ageWeeks);
    const sleepSummary = recentEvents.sleep
        .map(e => `  ${e.durationMinutes ?? '?'} min session`)
        .join('\n') || '  No sleep data';
    const feedingSummary = recentEvents.feed
        .map(e => `  ${e.data?.amountMl ?? '?'} ml`)
        .join('\n') || '  No feeding data';
    const normsText = [
        norms.sleepMinutesPerDay ? `Sleep: ${norms.sleepMinutesPerDay.low}-${norms.sleepMinutesPerDay.high} min/day` : null,
        norms.feedsPerDay ? `Feeds: ${norms.feedsPerDay.low}-${norms.feedsPerDay.high} per day` : null,
        norms.wakeWindowMinutes ? `Wake windows: ${norms.wakeWindowMinutes.low}-${norms.wakeWindowMinutes.high} min` : null,
    ].filter(Boolean).join('\n') || 'No norms available';
    const userPrompt = `Child: ${child.name}, Age: ${child.ageWeeks} weeks (${child.ageMonths} months)
Date: ${date}

## Yesterday's Events
### Sleep
${sleepSummary}

### Feeding
${feedingSummary}

### Diaper
  ${recentEvents.diaper.length} changes

### Mood
  ${recentEvents.mood.length} entries

## Age-Appropriate Norms
${normsText}

## Request
Generate a comprehensive daily digest. Return JSON with this exact structure:
{
  "summary": "A 2-3 sentence overall summary of the day",
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["recommendation1", ...],
  "anomalies": ["anomaly1", ...],
  "sleepScore": 0-100,
  "feedingScore": 0-100,
  "overallScore": 0-100
}`;
    const provider = getAiProvider();
    const raw = await provider.generateCompletion(SYSTEM_PROMPT, userPrompt);
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        parsed = {
            summary: raw,
            insights: [],
            recommendations: [],
            anomalies: []
        };
    }
    await AiDigestModel.findOneAndUpdate({ childId, date }, {
        childId,
        date,
        summary: parsed.summary ?? '',
        insights: parsed.insights ?? [],
        recommendations: parsed.recommendations ?? [],
        anomalies: parsed.anomalies ?? [],
        sleepScore: parsed.sleepScore,
        feedingScore: parsed.feedingScore,
        overallScore: parsed.overallScore,
        rawResponse: raw
    }, { upsert: true, new: true });
}
