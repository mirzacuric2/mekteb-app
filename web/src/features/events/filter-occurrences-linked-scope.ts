import { EVENT_AUDIENCE, EventOccurrenceRecord } from "./types";

export function filterOccurrencesToLinkedFamilyScope(
  items: EventOccurrenceRecord[],
  linkedChildIds: Set<string>,
  linkedNivos: Set<number>
): EventOccurrenceRecord[] {
  return items.filter((item) => {
    const ev = item.event;
    if (ev.audience === EVENT_AUDIENCE.GENERAL) return true;
    if (ev.audience === EVENT_AUDIENCE.NIVO) {
      return ev.nivo != null && linkedNivos.has(ev.nivo);
    }
    if (ev.audience === EVENT_AUDIENCE.CHILDREN) {
      return ev.children.some((row) => linkedChildIds.has(row.childId));
    }
    return false;
  });
}
