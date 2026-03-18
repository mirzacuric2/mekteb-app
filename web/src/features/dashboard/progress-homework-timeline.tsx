import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { Card } from "../../components/ui/card";
import { formatDateTime } from "../../lib/date-time";
import { Button } from "../../components/ui/button";

export const HOMEWORK_PROGRESS_STATUS = {
  DONE: "DONE",
  PENDING: "PENDING",
  NOT_RECORDED: "NOT_RECORDED",
} as const;

export type HomeworkProgressStatus = (typeof HOMEWORK_PROGRESS_STATUS)[keyof typeof HOMEWORK_PROGRESS_STATUS];

export type HomeworkProgressItem = {
  key: string;
  title: string;
  lessonTitle?: string | null;
  homeworkDescription?: string | null;
  status: HomeworkProgressStatus;
  homeworkTitle: string | null;
  lastReportedAt: string | null;
};

type ProgressHomeworkTimelineProps = {
  items: HomeworkProgressItem[];
  onMessageImam?: (item: HomeworkProgressItem) => void;
};

export function ProgressHomeworkTimeline({ items, onMessageImam }: ProgressHomeworkTimelineProps) {
  const { t } = useTranslation();

  if (!items.length) {
    return <p className="text-sm text-slate-500">{t("parentDashboardNoActivityFallback")}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isDone = item.status === HOMEWORK_PROGRESS_STATUS.DONE;
        const isPending = item.status === HOMEWORK_PROGRESS_STATUS.PENDING;
        const statusLabel = isDone
          ? t("parentDashboardHomeworkStateDone")
          : isPending
            ? t("parentDashboardHomeworkStatePending")
            : t("parentDashboardHomeworkStateNotRecorded");

        return (
          <Card key={item.key} className="rounded-lg border border-border/70 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isDone
                    ? "bg-emerald-100 text-emerald-700"
                    : isPending
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {statusLabel}
              </span>
            </div>
            {item.lessonTitle ? <p className="mt-1 text-xs text-slate-600">{item.lessonTitle}</p> : null}
            {item.homeworkTitle && item.title !== item.homeworkTitle ? (
              <p className="mt-1 text-xs text-slate-600">{`${t("parentDashboardHomeworkTitlePrefix")}: ${item.homeworkTitle}`}</p>
            ) : null}
            {item.homeworkDescription ? <p className="mt-1 text-xs text-slate-600">{item.homeworkDescription}</p> : null}
            {item.lastReportedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                {t("parentDashboardLastReportAt", { date: formatDateTime(item.lastReportedAt) })}
              </p>
            ) : null}
            {onMessageImam ? (
              <div className="mt-2 border-t border-border/70 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2 py-1 text-xs"
                  onClick={() => onMessageImam(item)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message imam
                </Button>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
