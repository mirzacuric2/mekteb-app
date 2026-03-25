import { AlertCircle, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import type { LessonNivo } from "./constants";
import { NivoBookLink } from "./nivo-book-link";
import type { Lesson, NivoBook } from "./types";

type LessonNivoCollapsibleProps = {
  nivo: LessonNivo;
  title: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  lessons: Lesson[];
  nivoBook: NivoBook | null;
  canManage: boolean;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
};

export function LessonNivoCollapsible({
  nivo,
  title,
  open,
  onOpenChange,
  lessons,
  nivoBook,
  canManage,
  onEditLesson,
  onDeleteLesson,
}: LessonNivoCollapsibleProps) {
  const { t } = useTranslation();
  const count = lessons.length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <button
        type="button"
        id={`lessons-nivo-trigger-${nivo}`}
        className="flex w-full items-center justify-between gap-3 bg-slate-50/95 px-3 py-3 text-left transition-colors hover:bg-slate-100/95"
        aria-expanded={open}
        aria-controls={`lessons-nivo-panel-${nivo}`}
        onClick={() => onOpenChange(!open)}
      >
        <span id={`lessons-nivo-heading-${nivo}`} className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-slate-900">{title}</span>
          {nivoBook ? (
            <NivoBookLink nivo={nivo} label={nivoBook.originalName} stopPropagation />
          ) : (
            <span
              className="inline-flex max-w-[220px] items-center gap-1 truncate rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200"
              title={t("lessonsBookNotUploaded")}
            >
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
              <span>{t("lessonsBookNotUploaded")}</span>
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 ring-1 ring-border",
              count === 0 && "text-slate-400"
            )}
          >
            {t("lessonsNivoLessonCount", { count })}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div
          id={`lessons-nivo-panel-${nivo}`}
          role="region"
          aria-labelledby={`lessons-nivo-heading-${nivo}`}
          className="space-y-1 border-t border-border p-2"
        >
          {count ? (
            lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-white p-2"
              >
                <span>{lesson.title}</span>
                {canManage ? (
                  <div className="flex shrink-0 gap-1 sm:gap-1.5">
                    <Button
                      variant="outline"
                      type="button"
                      className="h-8 w-8 shrink-0 px-0 py-0 text-xs sm:h-8 sm:w-auto sm:gap-1 sm:px-2 sm:py-0"
                      aria-label={t("edit")}
                      onClick={() => onEditLesson(lesson)}
                    >
                      <Pencil className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      <span className="hidden sm:inline">{t("edit")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="h-8 w-8 shrink-0 border-red-200 px-0 py-0 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 sm:h-8 sm:w-auto sm:gap-1 sm:px-2 sm:py-0"
                      aria-label={t("delete")}
                      onClick={() => onDeleteLesson(lesson)}
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      <span className="hidden sm:inline">{t("delete")}</span>
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="px-1 py-2 text-slate-500">{t("lessonsNoResults")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
