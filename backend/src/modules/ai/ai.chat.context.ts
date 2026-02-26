import type { AiContext } from './ai.collector.ts';

/**
 * Formats AiContext as a concise, human-readable summary for injection
 * into the chat system prompt.  Kept short to minimise token usage.
 */
export function formatContextForChat(ctx: AiContext): string {
  const { child, recentEvents, analytics, norms } = ctx;

  const lines: string[] = [
    `Child: ${child.name}, ${child.ageWeeks} weeks old (${child.ageMonths} months)`,
    `Date of birth: ${new Date(child.dateOfBirth).toISOString().slice(0, 10)}`,
    '',
    '### Sleep (last 7 days)',
  ];

  if (analytics.sleepSummary.length === 0) {
    lines.push('  No sleep data recorded');
  } else {
    for (const d of analytics.sleepSummary) {
      lines.push(`  ${d._id}: ${d.totalSleepMinutes} min (${d.sessions} sessions)`);
    }
  }

  lines.push('', '### Feeding (last 7 days)');
  if (analytics.feedingPattern.length === 0) {
    lines.push('  No feeding data recorded');
  } else {
    for (const d of analytics.feedingPattern) {
      lines.push(`  ${d._id?.day ?? d._id}: ${d.totalAmount ?? 0} ml, ${d.feedCount} feeds`);
    }
  }

  lines.push('', `### Diapers: ${recentEvents.diaper.length} changes in last 7 days`);

  if (recentEvents.mood.length > 0) {
    lines.push('', '### Mood entries (recent)');
    for (const e of recentEvents.mood.slice(-5)) {
      const date = new Date(e.startTime).toISOString().slice(0, 10);
      lines.push(`  ${date}: ${e.data?.mood ?? e.notes ?? 'logged'}`);
    }
  }

  const normLines: string[] = [];
  if (norms.sleepMinutesPerDay) normLines.push(`Sleep: ${norms.sleepMinutesPerDay.low}-${norms.sleepMinutesPerDay.high} min/day`);
  if (norms.feedsPerDay) normLines.push(`Feeds: ${norms.feedsPerDay.low}-${norms.feedsPerDay.high} per day`);
  if (norms.wakeWindowMinutes) normLines.push(`Wake windows: ${norms.wakeWindowMinutes.low}-${norms.wakeWindowMinutes.high} min`);

  if (normLines.length > 0) {
    lines.push('', '### Age-appropriate norms', ...normLines.map(l => `  ${l}`));
  }

  return lines.join('\n');
}
