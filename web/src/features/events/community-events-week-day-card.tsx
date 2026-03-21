import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { resolveEventColor } from "../common/nivo-colors";
import { formatTime } from "../../lib/date-time";
import { EventOccurrenceRecord } from "./types";

const DAY_PREVIEW_EVENT_LIMIT = 5;

type CommunityEventsWeekDayCardProps = {
  label: string;
  date: Date;
  dayItems: EventOccurrenceRecord[];
  isToday: boolean;
  canManageEvents: boolean;
  hoverActionsForDesktop: boolean;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
};

function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function CommunityEventsWeekDayCard({
  label,
  date,
  dayItems,
  isToday,
  canManageEvents,
  hoverActionsForDesktop,
  onEditEvent,
  onDeleteEvent,
}: CommunityEventsWeekDayCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowOverflowToggle = dayItems.length > DAY_PREVIEW_EVENT_LIMIT;
  const visibleDayItems = isExpanded ? dayItems : dayItems.slice(0, DAY_PREVIEW_EVENT_LIMIT);

  return (
    <div className="lg:min-w-0" style={{ flexGrow: dayItems.length ? 1.45 : 0.9, flexBasis: 0 }}>
      <Card
        className={
          dayItems.length
            ? "h-full min-h-[110px] space-y-2 p-2 sm:min-h-[125px] sm:p-2.5"
            : "h-full min-h-[64px] space-y-2 p-2 sm:min-h-[78px] sm:p-2"
        }
      >
        <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <span
            className={
              isToday
                ? "inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                : "text-xs text-slate-500"
            }
          >
            {date.getDate()}
          </span>
        </div>

        <div className={`space-y-2 ${dayItems.length ? "max-h-[280px] overflow-y-auto pr-1" : ""}`}>
          {!dayItems.length ? (
            <p className="text-xs text-slate-500">{t("eventsNoEvents")}</p>
          ) : (
            visibleDayItems.map((item) => {
              const event = item.event;
              const badgeColor = resolveEventColor(event.nivo);
              return (
                <div
                  key={`${event.id}:${item.occurrenceStartAt}`}
                  className={`group relative rounded-md border border-border bg-slate-50 p-2 transition-colors hover:bg-slate-100/70 ${canManageEvents ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (!canManageEvents) return;
                    onEditEvent(event.id);
                  }}
                >
                  <div className="mb-1 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start gap-2">
                        <span
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: badgeColor }}
                          aria-hidden
                        />
                        <p className="line-clamp-1 text-xs font-semibold leading-tight text-slate-900 break-words">{event.title}</p>
                      </div>
                    </div>
                    {canManageEvents ? (
                      <div className={hoverActionsForDesktop ? "lg:pointer-events-none lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100" : ""}>
                        <Button
                          type="button"
                          variant="outline"
                          className="absolute right-1.5 top-1.5 h-5 w-5 px-0 text-red-600 hover:text-red-700"
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
                  <p className="text-xs text-slate-600">{formatTimeRange(item.occurrenceStartAt, item.occurrenceEndAt)}</p>
                </div>
              );
            })
          )}
          {shouldShowOverflowToggle ? (
            <Button
              type="button"
              variant="outline"
              className="h-7 w-full justify-center text-xs text-slate-600 hover:text-slate-900"
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? t("eventsShowLess") : t("eventsShowMoreCount", { count: dayItems.length - DAY_PREVIEW_EVENT_LIMIT })}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
