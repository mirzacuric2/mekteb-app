import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { resolveEventColor } from "../common/nivo-colors";
import { formatTime } from "../../lib/date-time";
import { EventOccurrenceRecord } from "./types";

const MONTH_DAY_PREVIEW_EVENT_LIMIT = 5;

type CommunityEventsMonthDayCardProps = {
  day: Date;
  monthCursor: Date;
  dayItems: EventOccurrenceRecord[];
  highlightHasEvents?: boolean;
  canManageEvents: boolean;
  hoverActionsForDesktop: boolean;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onCreateFromDay: (date: Date) => void;
};

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)}-${formatTime(end)}`;
}

export function CommunityEventsMonthDayCard({
  day,
  monthCursor,
  dayItems,
  highlightHasEvents = false,
  canManageEvents,
  hoverActionsForDesktop,
  onEditEvent,
  onDeleteEvent,
  onCreateFromDay,
}: CommunityEventsMonthDayCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
  const isToday = sameDay(day, new Date());
  const visibleDayItems = isExpanded ? dayItems : dayItems.slice(0, MONTH_DAY_PREVIEW_EVENT_LIMIT);
  const highlightedClass = highlightHasEvents
    ? dayItems.length
      ? "border-primary/40 bg-primary/5"
      : "opacity-70"
    : "";

  return (
    <Card
      className={`min-h-[128px] p-2 ${highlightedClass} ${canManageEvents && isCurrentMonth ? "cursor-pointer hover:border-primary/40" : ""}`}
      onClick={() => {
        if (!canManageEvents || !isCurrentMonth) return;
        onCreateFromDay(day);
      }}
    >
      <div className="mb-2 flex items-center justify-between border-b border-border pb-1">
        <span className={`text-xs font-medium ${isCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>{day.getDate()}</span>
        {isToday ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Today</span> : null}
      </div>
      <div className="space-y-1">
        {visibleDayItems.map((item) => {
          const event = item.event;
          return (
            <div
              key={`${event.id}:${item.occurrenceStartAt}`}
              className={`group relative rounded border border-border bg-slate-50 px-1.5 py-1 transition-colors hover:bg-slate-100/70 ${canManageEvents ? "cursor-pointer" : ""}`}
              onClick={(eventClick) => {
                eventClick.stopPropagation();
                if (!canManageEvents) return;
                onEditEvent(event.id);
              }}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start gap-1.5">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: resolveEventColor(event.nivo) }}
                    />
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-800">{event.title}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-600">{formatTimeRange(item.occurrenceStartAt, item.occurrenceEndAt)}</p>
                </div>
                {canManageEvents ? (
                  <div className={hoverActionsForDesktop ? "lg:pointer-events-none lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100" : ""}>
                    <Button
                      type="button"
                      variant="outline"
                      className="absolute right-1 top-1 h-5 w-5 px-0 text-red-600 hover:text-red-700"
                      onClick={(eventClick) => {
                        eventClick.stopPropagation();
                        onDeleteEvent(event.id);
                      }}
                      aria-label={t("eventsDeleteEvent")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {dayItems.length > MONTH_DAY_PREVIEW_EVENT_LIMIT ? (
          <button
            type="button"
            className="text-[11px] text-slate-500 hover:text-slate-700"
            onClick={(eventClick) => {
              eventClick.stopPropagation();
              setIsExpanded((current) => !current);
            }}
          >
            {isExpanded ? t("eventsShowLess") : t("eventsShowMoreCount", { count: dayItems.length - MONTH_DAY_PREVIEW_EVENT_LIMIT })}
          </button>
        ) : null}
      </div>
    </Card>
  );
}
