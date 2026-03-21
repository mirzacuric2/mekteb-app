import { EVENT_AUDIENCE, EventOccurrenceRecord } from "./types";

const DAY_IN_MS = 86_400_000;

export function startOfWeekMonday(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function filterOccurrencesInLocalWeek(
  occurrences: EventOccurrenceRecord[],
  weekStart: Date
): EventOccurrenceRecord[] {
  const start = startOfWeekMonday(weekStart);
  const from = start.getTime();
  const to = from + 7 * DAY_IN_MS;
  return occurrences.filter((item) => {
    const t = new Date(item.occurrenceStartAt).getTime();
    return t >= from && t < to;
  });
}

export type ParentWeekEventsSummaryModel = {
  total: number;
  upcomingCount: number;
  perChildOccurrences: Array<{ name: string; count: number }>;
  next: EventOccurrenceRecord | null;
};

export function buildParentWeekEventsSummary(weekOccurrences: EventOccurrenceRecord[]): ParentWeekEventsSummaryModel {
  const now = Date.now();
  const sorted = [...weekOccurrences].sort((a, b) =>
    a.occurrenceStartAt.localeCompare(b.occurrenceStartAt)
  );
  const childTotals = new Map<string, number>();

  for (const o of weekOccurrences) {
    if (o.event.audience === EVENT_AUDIENCE.CHILDREN) {
      for (const row of o.event.children) {
        const name = row.child.firstName?.trim() || "—";
        childTotals.set(name, (childTotals.get(name) || 0) + 1);
      }
    }
  }

  const perChildOccurrences = [...childTotals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const upcomingCount = weekOccurrences.filter((o) => new Date(o.occurrenceStartAt).getTime() >= now).length;
  const next = sorted.find((o) => new Date(o.occurrenceStartAt).getTime() >= now) ?? null;

  return {
    total: weekOccurrences.length,
    upcomingCount,
    perChildOccurrences,
    next,
  };
}
