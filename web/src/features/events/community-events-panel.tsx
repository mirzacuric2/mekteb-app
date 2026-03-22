import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { CalendarPlus2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { MANAGEMENT_PAGE_CARD_CLASSNAME } from "../common/components/entity-list-toolbar";
import { Loader } from "../common/components/loader";
import { CommunityEventFormDialog, mapEventFormValuesToCreatePayload, mapEventFormValuesToUpdatePayload } from "./community-event-form-dialog";
import { CommunityEventsCalendar } from "./community-events-calendar";
import { CommunityEventsMonthCalendar } from "./community-events-month-calendar";
import { CommunityEventsSummaryCards, EVENT_SUMMARY_FILTER, EventSummaryFilter } from "./community-events-summary-cards";
import { useRoleAccess } from "../auth/use-role-access";
import { WEEK_SUMMARY_VARIANT } from "./constants";
import { CommunityEventRecord, EVENT_RECURRENCE } from "./types";
import { filterOccurrencesToLinkedFamilyScope } from "./filter-occurrences-linked-scope";
import { useCommunityEventsQuery } from "./use-community-events-data";
import { useCommunityEventsMutations } from "./use-community-events-mutations";
import { useMineChildrenInCommunity } from "./use-mine-children-in-community";

type CommunityEventsPanelProps = {
  communityId?: string | null;
  canManageEvents: boolean;
  forceWeekly?: boolean;
  hoverActionsForDesktop?: boolean;
  stackWeeklyDays?: boolean;
  dashboardPreview?: boolean;
  showParentWeekSummary?: boolean;
};

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  return addDays(start, 6);
}

function toInputDate(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function toIso(value: Date) {
  return value.toISOString();
}

function getApiMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return ((error.response?.data as { message?: string } | undefined)?.message || fallback).trim();
  }
  return fallback;
}

function findSourceEventById(id: string, events: ReturnType<typeof useCommunityEventsQuery>["data"]) {
  if (!events?.items?.length) return null;
  const match = events.items.find((item) => item.event.id === id);
  return match?.event || null;
}

export function CommunityEventsPanel({
  communityId,
  canManageEvents,
  forceWeekly = false,
  hoverActionsForDesktop = false,
  stackWeeklyDays = false,
  dashboardPreview = false,
  showParentWeekSummary = false,
}: CommunityEventsPanelProps) {
  const { t } = useTranslation();
  const { isAdmin, isBoardMember, isSuperAdmin } = useRoleAccess();
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [editingEvent, setEditingEvent] = useState<CommunityEventRecord | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CommunityEventRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [presetCreateDate, setPresetCreateDate] = useState<string | null>(null);
  const [summaryFilter, setSummaryFilter] = useState<EventSummaryFilter>(EVENT_SUMMARY_FILTER.ALL);
  const [isLargeScreen, setIsLargeScreen] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => setIsLargeScreen(event.matches);
    setIsLargeScreen(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const showMonthView = isLargeScreen && !forceWeekly;
  const showWeekSummaryAboveDays = dashboardPreview ? showParentWeekSummary : !showMonthView;
  const weekStart = useMemo(() => startOfWeek(cursorDate), [cursorDate]);
  const monthStart = useMemo(() => startOfMonth(cursorDate), [cursorDate]);
  const monthGridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const monthGridEnd = useMemo(() => endOfWeek(endOfMonth(cursorDate)), [cursorDate]);

  const from = useMemo(() => (showMonthView ? toIso(monthGridStart) : toIso(weekStart)), [monthGridStart, showMonthView, weekStart]);
  const to = useMemo(
    () => (showMonthView ? toIso(addDays(monthGridEnd, 1)) : toIso(addDays(weekStart, 7))),
    [monthGridEnd, showMonthView, weekStart]
  );

  const events = useCommunityEventsQuery(
    {
      communityId,
      from,
      to,
    },
    Boolean(communityId)
  );
  const needsLinkedChildrenForDashboard =
    dashboardPreview && (isAdmin || isBoardMember || isSuperAdmin);
  const linkedChildrenQuery = useMineChildrenInCommunity(
    communityId ?? undefined,
    Boolean(communityId) && needsLinkedChildrenForDashboard
  );
  const rawOccurrences = events.data?.items || [];
  const displayOccurrences = useMemo(() => {
    if (!needsLinkedChildrenForDashboard) return rawOccurrences;
    const linked = linkedChildrenQuery.data;
    if (!linked?.length) return rawOccurrences;
    return filterOccurrencesToLinkedFamilyScope(
      rawOccurrences,
      new Set(linked.map((child) => child.id)),
      new Set(linked.map((child) => child.nivo))
    );
  }, [needsLinkedChildrenForDashboard, rawOccurrences, linkedChildrenQuery.data]);

  const mutations = useCommunityEventsMutations({ communityId: communityId || "" });
  const showEventsLoader =
    events.isLoading || (needsLinkedChildrenForDashboard && linkedChildrenQuery.isLoading);

  const monthFilteredOccurrences = useMemo(() => {
    const items = events.data?.items || [];
    if (summaryFilter === EVENT_SUMMARY_FILTER.UPCOMING) {
      const nowMs = Date.now();
      return items.filter((item) => new Date(item.occurrenceStartAt).getTime() >= nowMs);
    }
    if (summaryFilter === EVENT_SUMMARY_FILTER.WEEKLY) {
      return items.filter((item) => item.event.recurrence === EVENT_RECURRENCE.WEEKLY);
    }
    return items;
  }, [events.data?.items, summaryFilter]);

  if (!communityId) {
    return (
      <Card className={MANAGEMENT_PAGE_CARD_CLASSNAME}>
        <p className="text-sm text-slate-500">{t("communityNotAssigned")}</p>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      {!dashboardPreview ? (
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {showMonthView ? t("eventsMonthlyCalendar") : t("eventsWeeklyCalendar")}
            </p>
            <p className="text-xs text-slate-500">
              {showMonthView ? t("eventsMonthCreateHint") : t("eventsVisibilityHint")}
            </p>
          </div>
          {canManageEvents ? (
            <Button
              type="button"
              onClick={() => {
                setPresetCreateDate(null);
                setCreateOpen(true);
              }}
              aria-label={t("eventsCreateEvent")}
              title={t("eventsCreateEvent")}
              className="h-8 w-8 shrink-0 gap-1.5 px-0 py-0 text-xs sm:h-8 sm:w-auto sm:px-2.5 sm:text-sm"
            >
              <CalendarPlus2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("eventsCreateEvent")}</span>
            </Button>
          ) : null}
        </div>
      ) : null}

      {showEventsLoader ? (
        <Card className={MANAGEMENT_PAGE_CARD_CLASSNAME}>
          <Loader size="sm" text={t("eventsLoading")} />
        </Card>
      ) : showMonthView ? (
        <div className="space-y-3">
          <CommunityEventsSummaryCards
            monthCursor={cursorDate}
            occurrences={events.data?.items || []}
            title={t("eventsSummaryTitle")}
            totalLabel={t("eventsSummaryTotal")}
            activeDaysLabel={t("eventsSummaryActiveDays")}
            recurringWeeklyLabel={t("eventsSummaryRecurringWeekly")}
            upcomingLabel={t("eventsSummaryUpcoming")}
            activeFilter={summaryFilter}
            onFilterChange={(nextFilter) =>
              setSummaryFilter((current) => (current === nextFilter ? EVENT_SUMMARY_FILTER.ALL : nextFilter))
            }
          />
          <CommunityEventsMonthCalendar
            occurrences={monthFilteredOccurrences}
            monthCursor={cursorDate}
            highlightDaysWithEvents={summaryFilter === EVENT_SUMMARY_FILTER.ACTIVE_DAYS}
            canManageEvents={canManageEvents}
            hoverActionsForDesktop={hoverActionsForDesktop}
            onMonthChange={setCursorDate}
            onEditEvent={(eventId) => {
              const source = findSourceEventById(eventId, events.data);
              if (!source) return;
              setEditingEvent(source);
            }}
            onDeleteEvent={(eventId) => {
              const source = findSourceEventById(eventId, events.data);
              if (!source) return;
              setDeletingEvent(source);
            }}
            onCreateFromDay={(date) => {
              if (!canManageEvents) return;
              setPresetCreateDate(toInputDate(date));
              setCreateOpen(true);
            }}
          />
        </div>
      ) : (
        <CommunityEventsCalendar
          occurrences={displayOccurrences}
          weekStart={weekStart}
          onWeekChange={setCursorDate}
          canManageEvents={canManageEvents}
          hoverActionsForDesktop={hoverActionsForDesktop}
          stackWeeklyDays={stackWeeklyDays}
          dashboardPreview={dashboardPreview}
          weekPreviewHint={dashboardPreview ? t("eventsDashboardCommunityCalendarDescription") : undefined}
          showParentWeekSummary={showWeekSummaryAboveDays}
          weekSummaryVariant={dashboardPreview ? WEEK_SUMMARY_VARIANT.FAMILY : WEEK_SUMMARY_VARIANT.COMMUNITY}
          onEditEvent={(eventId) => {
            const source = findSourceEventById(eventId, events.data);
            if (!source) return;
            setEditingEvent(source);
          }}
          onDeleteEvent={(eventId) => {
            const source = findSourceEventById(eventId, events.data);
            if (!source) return;
            setDeletingEvent(source);
          }}
        />
      )}

      <CommunityEventFormDialog
        open={createOpen}
        mode="create"
        presetEventDate={presetCreateDate}
        lockEventDate={showMonthView && Boolean(presetCreateDate)}
        submitting={mutations.createEvent.isPending}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setPresetCreateDate(null);
        }}
        onSubmit={(values) => {
          mutations.createEvent.mutate(mapEventFormValuesToCreatePayload(values), {
            onSuccess: () => {
              toast.success(t("eventsCreated"));
              setCreateOpen(false);
            },
            onError: (error) => {
              toast.error(getApiMessage(error, t("eventsCreateFailed")));
            },
          });
        }}
      />

      <CommunityEventFormDialog
        open={Boolean(editingEvent)}
        mode="edit"
        initialEvent={editingEvent}
        submitting={mutations.updateEvent.isPending}
        onOpenChange={(open) => {
          if (!open) setEditingEvent(null);
        }}
        onSubmit={(values) => {
          if (!editingEvent) return;
          mutations.updateEvent.mutate(
            { id: editingEvent.id, payload: mapEventFormValuesToUpdatePayload(values) },
            {
              onSuccess: () => {
                toast.success(t("eventsUpdated"));
                setEditingEvent(null);
              },
              onError: (error) => {
                toast.error(getApiMessage(error, t("eventsUpdateFailed")));
              },
            }
          );
        }}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingEvent)}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null);
        }}
        title={t("eventsDeleteTitle")}
        description={
          deletingEvent
            ? t("eventsDeleteDescription", { title: deletingEvent.title })
            : t("eventsDeleteDescriptionFallback")
        }
        confirmText={t("eventsDeleteAction")}
        submitting={mutations.deleteEvent.isPending}
        onConfirm={() => {
          if (!deletingEvent) return;
          mutations.deleteEvent.mutate(deletingEvent.id, {
            onSuccess: () => {
              toast.success(t("eventsDeleted"));
              setDeletingEvent(null);
            },
            onError: (error) => toast.error(getApiMessage(error, t("eventsDeleteFailed"))),
          });
        }}
      />
    </div>
  );
}
