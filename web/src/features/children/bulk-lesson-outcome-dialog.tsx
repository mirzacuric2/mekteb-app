import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { LoadingBlock } from "../common/components/loading-block";
import { useAuthedQuery } from "../common/use-authed-query";
import {
  LESSONS_API_PATH,
  LESSONS_QUERY_KEY,
  LESSON_NIVO_LABEL,
  LESSON_NIVO_ORDER,
  type LessonNivo,
} from "../lessons/constants";
import type { Lesson } from "../lessons/types";
import type { ChildRecord } from "./types";
import { useBulkLessonOutcomeChildrenQuery } from "./use-bulk-lesson-outcome-children";
import { useBulkLessonOutcomesMutation } from "./use-bulk-lesson-outcomes-mutation";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
type RowState = { passed: boolean; markInput: string };

function defaultRowForChild(child: ChildRecord, lid: string): RowState {
  const outcome = child.lessonOutcomes?.find((o) => o.lessonId === lid);
  return {
    passed: outcome?.passed === true,
    markInput: outcome?.mark != null ? String(outcome.mark) : "",
  };
}

type BulkLessonOutcomeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BulkLessonOutcomeDialog({ open, onOpenChange }: BulkLessonOutcomeDialogProps) {
  const { t } = useTranslation();
  const [nivo, setNivo] = useState<LessonNivo>(LESSON_NIVO_ORDER[0]);
  const [lessonId, setLessonId] = useState("");
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [markErrors, setMarkErrors] = useState<Record<string, string>>({});

  const lessonsQuery = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, open);
  const childrenQuery = useBulkLessonOutcomeChildrenQuery(nivo, open);
  const bulkMutation = useBulkLessonOutcomesMutation();

  const lessonsForNivo = useMemo(
    () => (lessonsQuery.data || []).filter((lesson) => lesson.nivo === nivo).sort((a, b) => a.title.localeCompare(b.title)),
    [lessonsQuery.data, nivo]
  );

  const selectedLesson = useMemo(
    () => lessonsForNivo.find((lesson) => lesson.id === lessonId),
    [lessonsForNivo, lessonId]
  );

  // Stable when data is missing — `data || []` would be a new [] every render and retrigger the sync effect forever.
  const children = useMemo(() => childrenQuery.data ?? [], [childrenQuery.data]);

  useEffect(() => {
    if (!lessonId || !children.length) {
      setRows({});
      return;
    }
    setRows(
      Object.fromEntries(
        children.map((child: ChildRecord) => {
          const outcome = child.lessonOutcomes?.find((o) => o.lessonId === lessonId);
          return [
            child.id,
            {
              passed: outcome?.passed === true,
              markInput: outcome?.mark != null ? String(outcome.mark) : "",
            },
          ];
        })
      )
    );
    setMarkErrors({});
  }, [children, lessonId]);

  useEffect(() => {
    if (!open) {
      setLessonId("");
      setMarkErrors({});
    }
  }, [open]);

  const updateRow = (childId: string, patch: Partial<RowState>) => {
    setRows((prev) => ({
      ...prev,
      [childId]: { ...prev[childId], ...patch },
    }));
    setMarkErrors((prev) => {
      const next = { ...prev };
      delete next[childId];
      return next;
    });
  };

  const setPassedForAllChildren = (passed: boolean) => {
    setRows((prev) => {
      const next = { ...prev };
      for (const child of children) {
        const base = prev[child.id] ?? defaultRowForChild(child, lessonId);
        next[child.id] = { ...base, passed };
      }
      return next;
    });
    setMarkErrors({});
  };

  const handleSave = async () => {
    if (!lessonId) {
      toast.error(t("bulkLessonOutcomePickLesson"));
      return;
    }
    if (!children.length) {
      toast.error(t("bulkLessonOutcomeNoChildren"));
      return;
    }

    const items: { childId: string; passed: boolean; mark: number | null }[] = [];
    const nextMarkErrors: Record<string, string> = {};

    for (const child of children) {
      const row = rows[child.id] ?? defaultRowForChild(child, lessonId);
      const trimmed = row.markInput.trim();
      let mark: number | null = null;
      if (trimmed !== "") {
        const n = Number(trimmed);
        if (!Number.isInteger(n) || n < 1 || n > 10) {
          nextMarkErrors[child.id] = t("lessonOutcomeMarkInvalid");
          continue;
        }
        mark = n;
      }
      items.push({ childId: child.id, passed: row.passed, mark });
    }

    if (Object.keys(nextMarkErrors).length > 0) {
      setMarkErrors(nextMarkErrors);
      toast.error(t("bulkLessonOutcomeFixMarks"));
      return;
    }

    try {
      const result = await bulkMutation.mutateAsync({ lessonId, items });
      toast.success(t("bulkLessonOutcomeSaved", { count: result.updated }));
      onOpenChange(false);
    } catch {
      toast.error(t("bulkLessonOutcomeSaveFailed"));
    }
  };

  const primarySaveLabel =
    bulkMutation.isPending
      ? t("bulkLessonOutcomeSaving")
      : lessonId && children.length > 0
        ? t("bulkLessonOutcomeSaveGradesForCount", { count: children.length })
        : t("bulkLessonOutcomeSaveGrades");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("bulkLessonOutcomeTitle")}</DialogTitle>
          <p className="mt-1 text-sm text-slate-600">{t("bulkLessonOutcomeSubtitle")}</p>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <section className="rounded-lg border border-border bg-slate-50/80 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{t("bulkLessonOutcomeSectionPickTitle")}</h3>
            <p className="mt-1 text-xs text-slate-600">{t("bulkLessonOutcomeSectionPickHelp")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="bulk-lesson-nivo" className="text-xs font-medium text-slate-700">
                  {t("childrenNivoLabel")}
                </label>
                <Select
                  id="bulk-lesson-nivo"
                  value={String(nivo)}
                  onChange={(e) => {
                    setNivo(Number(e.target.value) as LessonNivo);
                    setLessonId("");
                  }}
                  disabled={bulkMutation.isPending}
                >
                  {LESSON_NIVO_ORDER.map((n) => (
                    <option key={n} value={String(n)}>
                      {LESSON_NIVO_LABEL[n]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="bulk-lesson-pick" className="text-xs font-medium text-slate-700">
                  {t("bulkLessonOutcomeLessonLabel")}
                </label>
                <Select
                  id="bulk-lesson-pick"
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  disabled={bulkMutation.isPending || lessonsForNivo.length === 0 || lessonsQuery.isLoading}
                >
                  <option value="">{t("bulkLessonOutcomeLessonPlaceholder")}</option>
                  {lessonsForNivo.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {!lessonsQuery.isLoading && lessonsQuery.data && lessonsForNivo.length === 0 ? (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {t("bulkLessonOutcomeNoLessonsForNivo")}
              </p>
            ) : null}
          </section>

          {!lessonId ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-center text-sm text-slate-600">
              {t("bulkLessonOutcomeSelectLessonHint")}
            </div>
          ) : childrenQuery.isLoading ? (
            <LoadingBlock text={t("bulkLessonOutcomeLoadingChildren")} containerClassName="min-h-[120px]" />
          ) : children.length === 0 ? (
            <p className="text-sm text-slate-600">{t("bulkLessonOutcomeNoChildren")}</p>
          ) : (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t("bulkLessonOutcomeSectionGradeTitle")}</h3>
                <p className="mt-1 text-xs text-slate-600">{t("bulkLessonOutcomeSectionGradeHelp")}</p>
              </div>
              {selectedLesson ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-slate-800">
                  <span className="font-medium text-slate-900">{selectedLesson.title}</span>
                  <span className="text-slate-500"> · </span>
                  <span>{LESSON_NIVO_LABEL[nivo]}</span>
                  <span className="text-slate-500"> · </span>
                  <span>{t("bulkLessonOutcomeContextChildCount", { count: children.length })}</span>
                </div>
              ) : null}
              <div className="flex flex-col gap-2 rounded-md border border-border bg-slate-50/60 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <span className="text-xs font-medium text-slate-700">{t("bulkLessonOutcomeApplyToAll")}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    disabled={bulkMutation.isPending}
                    onClick={() => setPassedForAllChildren(true)}
                  >
                    {t("bulkLessonOutcomeAllPassed")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    disabled={bulkMutation.isPending}
                    onClick={() => setPassedForAllChildren(false)}
                  >
                    {t("bulkLessonOutcomeAllNotPassed")}
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-border bg-slate-50 text-xs font-medium text-slate-600">
                    <tr>
                      <th className="px-3 py-2">{t("usersTableName")}</th>
                      <th className="px-3 py-2">{t("lessonOutcomePassed")}</th>
                      <th className="px-3 py-2">
                        <span className="block">{t("lessonOutcomeMarkShort")}</span>
                        <span className="block font-normal text-slate-500">{t("bulkLessonOutcomeMarkHeaderHint")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((child) => {
                      const row = rows[child.id] ?? defaultRowForChild(child, lessonId);
                      return (
                        <tr key={child.id} className="border-b border-border/80 last:border-0">
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {child.firstName} {child.lastName}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={row.passed}
                                onCheckedChange={(v) => updateRow(child.id, { passed: v })}
                                disabled={bulkMutation.isPending}
                                id={`bulk-passed-${child.id}`}
                                aria-label={t("lessonOutcomePassedAria")}
                              />
                              <label htmlFor={`bulk-passed-${child.id}`} className="cursor-pointer text-sm text-slate-800">
                                {row.passed ? t("lessonOutcomePassed") : t("lessonOutcomeNotPassed")}
                              </label>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="text"
                              inputMode="numeric"
                              className="h-8 w-16"
                              placeholder="1–10"
                              value={row.markInput}
                              onChange={(e) => updateRow(child.id, { markInput: e.target.value })}
                              disabled={bulkMutation.isPending}
                              aria-label={t("lessonOutcomeMarkLabel")}
                            />
                            {markErrors[child.id] ? (
                              <p className="mt-0.5 text-xs text-destructive">{markErrors[child.id]}</p>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={bulkMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={
              bulkMutation.isPending || !lessonId || !children.length || childrenQuery.isLoading || lessonsQuery.isLoading
            }
          >
            {primarySaveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
