import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "../../api";
import { Button } from "../../components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { CHILD_STATUS, ChildRecord } from "../children/types";
import { LESSON_NIVO_LABEL, LESSON_NIVO_ORDER, LessonNivo } from "../lessons/constants";
import { Lesson } from "../lessons/types";
import { useAuthedQuery } from "../common/use-authed-query";
import { ActivityLecture } from "./types";

type ActivityReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingActivity?: ActivityLecture | null;
  onSaved?: () => void;
};

type ChildRowState = {
  lessonId: string;
  isAbsent: boolean;
  homeworkDone: boolean;
  comment: string;
  lessonManuallyChanged: boolean;
};

type ChildRowErrors = Record<string, { lessonId?: string }>;
const reportSchema = z.object({
  nivo: z.number().int().min(1).max(5),
  rows: z
    .array(
      z.object({
        childId: z.string(),
        lessonId: z.string().trim().min(1, "Lesson is required."),
        isAbsent: z.boolean(),
        homeworkDone: z.boolean(),
        comment: z.string().trim(),
      })
    )
    .min(1, "At least one child is required."),
});

export function ActivityReportDialog({ open, onOpenChange, editingActivity = null, onSaved }: ActivityReportDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [nivo, setNivo] = useState<LessonNivo | "">("");
  const childrenQuery = useQuery<ChildRecord[]>({
    queryKey: ["activity-report-children", nivo],
    enabled: open && nivo !== "",
    queryFn: async () =>
      (
        await api.get("/children", {
          params: { nivo, status: CHILD_STATUS.ACTIVE },
        })
      ).data,
  });
  const lessonsQuery = useAuthedQuery<Lesson[]>("lessons", "/lessons", open);
  const [defaultLessonId, setDefaultLessonId] = useState("");
  const [rows, setRows] = useState<Record<string, ChildRowState>>({});
  const [fieldErrors, setFieldErrors] = useState<{ nivo?: string; rows?: string }>({});
  const [rowErrors, setRowErrors] = useState<ChildRowErrors>({});

  const activeChildrenForNivo = useMemo(() => childrenQuery.data || [], [childrenQuery.data]);
  const childrenForForm = useMemo(() => {
    if (!editingActivity) return activeChildrenForNivo;
    const unique = new Map<string, ChildRecord>();
    for (const attendance of editingActivity.attendance) {
      unique.set(attendance.child.id, {
        id: attendance.child.id,
        firstName: attendance.child.firstName,
        lastName: attendance.child.lastName,
        birthDate: "",
        nivo: attendance.child.nivo,
        status: attendance.child.status as ChildRecord["status"],
        communityId: "",
        parents: [],
      });
    }
    return Array.from(unique.values());
  }, [activeChildrenForNivo, editingActivity]);

  const nivoLessons = useMemo(
    () => (nivo === "" ? [] : (lessonsQuery.data || []).filter((lesson) => lesson.nivo === nivo)),
    [lessonsQuery.data, nivo]
  );

  const resetForm = () => {
    setNivo("");
    setDefaultLessonId("");
    setRows({});
    setFieldErrors({});
    setRowErrors({});
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    if (editingActivity) {
      setNivo(editingActivity.nivo || "");
      setDefaultLessonId("");
      setFieldErrors({});
      setRowErrors({});
    }
  }, [open, editingActivity]);

  useEffect(() => {
    if (editingActivity) {
      const next: Record<string, ChildRowState> = {};
      for (const attendance of editingActivity.attendance) {
        next[attendance.childId] = {
          lessonId: attendance.lessonId || defaultLessonId || "",
          isAbsent: !attendance.present,
          homeworkDone: attendance.homeworkDone || false,
          comment: attendance.comment || "",
          lessonManuallyChanged: false,
        };
      }
      setRows(next);
      return;
    }
    setRows((prev) => {
      const next: Record<string, ChildRowState> = {};
      for (const child of activeChildrenForNivo) {
        const existing = prev[child.id];
        next[child.id] = existing || {
          lessonId: defaultLessonId,
          isAbsent: false,
          homeworkDone: false,
          comment: "",
          lessonManuallyChanged: false,
        };
      }
      return next;
    });
  }, [activeChildrenForNivo, defaultLessonId, editingActivity]);

  useEffect(() => {
    if (editingActivity) return;
    setRows((prev) => {
      const next: Record<string, ChildRowState> = {};
      for (const childId of Object.keys(prev)) {
        const current = prev[childId];
        next[childId] = current.lessonManuallyChanged
          ? current
          : {
              ...current,
              lessonId: defaultLessonId,
            };
      }
      return next;
    });
  }, [defaultLessonId, editingActivity]);

  const saveActivityMutation = useMutation({
    mutationFn: async () => {
      const payloadRows = childrenForForm.map((child) => ({
        childId: child.id,
        lessonId: rows[child.id]?.lessonId || "",
        isAbsent: rows[child.id]?.isAbsent ?? false,
        homeworkDone: rows[child.id]?.homeworkDone ?? false,
        comment: rows[child.id]?.comment || "",
      }));
      const parsed = reportSchema.safeParse({
        nivo: typeof nivo === "number" ? nivo : undefined,
        rows: payloadRows,
      });

      if (!parsed.success) {
        const nextFieldErrors: { nivo?: string; rows?: string } = {};
        const nextRowErrors: ChildRowErrors = {};
        for (const issue of parsed.error.issues) {
          const [field, index, nestedField] = issue.path;
          if (field === "nivo") nextFieldErrors.nivo = t("activityReportNivoRequired");
          if (field === "rows" && typeof index === "number" && nestedField === "lessonId") {
            const childId = payloadRows[index]?.childId;
            if (childId) nextRowErrors[childId] = { lessonId: issue.message };
          }
          if (field === "rows" && index === undefined) {
            nextFieldErrors.rows = issue.message;
          }
        }
        setFieldErrors(nextFieldErrors);
        setRowErrors(nextRowErrors);
        throw new Error("validation_error");
      }

      return (
        await (editingActivity
          ? api.patch(`/lectures/${editingActivity.id}`, {
              nivo: parsed.data.nivo,
              attendance: parsed.data.rows.map((row) => ({
                childId: row.childId,
                lessonId: row.lessonId,
                present: !row.isAbsent,
                homeworkDone: row.isAbsent ? false : row.homeworkDone,
                comment: row.comment.trim() || undefined,
              })),
            })
          : api.post("/lectures", {
              nivo: parsed.data.nivo,
              attendance: parsed.data.rows.map((row) => ({
                childId: row.childId,
                lessonId: row.lessonId,
                present: !row.isAbsent,
                homeworkDone: row.isAbsent ? false : row.homeworkDone,
                comment: row.comment.trim() || undefined,
              })),
            }))
      ).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      await queryClient.invalidateQueries({ queryKey: ["activity-report-children"] });
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success(editingActivity ? t("activityReportUpdated") : t("activityReportCreated"));
      onSaved?.();
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validation_error") return;
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            (editingActivity ? t("activityReportUpdateFailed") : t("activityReportCreateFailed")))
          : editingActivity
            ? t("activityReportUpdateFailed")
            : t("activityReportCreateFailed");
      toast.error(message);
    },
  });
  const isCreateMode = !editingActivity;
  const saveDisabled =
    saveActivityMutation.isPending ||
    nivo === "" ||
    childrenQuery.isLoading ||
    childrenQuery.isError ||
    lessonsQuery.isLoading ||
    nivoLessons.length === 0 ||
    childrenForForm.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? t("activityReportCreateTitle") : t("activityReportEditTitle")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("childrenNivoLabel")}</p>
              <Select
                value={nivo === "" ? "" : String(nivo)}
                onChange={(event) => {
                  const selectedNivo = event.target.value ? (Number(event.target.value) as LessonNivo) : "";
                  setNivo(selectedNivo);
                  setRows({});
                  setDefaultLessonId("");
                  setFieldErrors((prev) => ({ ...prev, nivo: undefined }));
                  setRowErrors({});
                }}
              >
                <option value="">{t("activityReportSelectNivo")}</option>
                {LESSON_NIVO_ORDER.map((currentNivo) => (
                  <option key={currentNivo} value={String(currentNivo)}>
                    {LESSON_NIVO_LABEL[currentNivo]}
                  </option>
                ))}
              </Select>
              {fieldErrors.nivo ? <p className="mt-1 text-xs text-red-600">{fieldErrors.nivo}</p> : null}
            </div>
            <div />
          </div>

          <section className="rounded-md border border-border p-3">
            <div className="min-w-[240px]">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("activityReportDefaultLesson")}</p>
              <Select value={defaultLessonId} onChange={(event) => setDefaultLessonId(event.target.value)} disabled={nivo === ""}>
                <option value="">{t("activityReportSelectLesson")}</option>
                {nivoLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {t("activityReportChildrenCount", { count: childrenForForm.length })}
            </p>
            {fieldErrors.rows ? <p className="text-xs text-red-600">{fieldErrors.rows}</p> : null}
            {nivo === "" ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-slate-500">
                {t("activityReportSelectNivoFirst")}
              </div>
            ) : childrenQuery.isError ? (
              <div className="rounded-md border border-dashed border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{t("activityReportChildrenLoadFailed")}</p>
                <Button type="button" variant="outline" className="mt-2" onClick={() => childrenQuery.refetch()}>
                  {t("activityReportRetry")}
                </Button>
              </div>
            ) : childrenQuery.isLoading || lessonsQuery.isLoading ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-slate-500">
                {t("childrenLoading")}
              </div>
            ) : nivoLessons.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-slate-500">
                {t("activityReportNoLessonsForNivo")}
              </div>
            ) : childrenForForm.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-slate-500">
                {t("activityReportNoChildrenForNivo")}
              </div>
            ) : (
              <div className="max-h-[38dvh] space-y-2 overflow-y-auto pr-1">
                {childrenForForm.map((child) => {
                  const row = rows[child.id];
                  return (
                    <div key={child.id} className="rounded-md border border-border p-3">
                      <div className="mb-2 text-sm font-medium text-slate-800">{`${child.firstName} ${child.lastName}`}</div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs text-slate-500">{t("activityReportLessonPerChild")}</p>
                          <Select
                            value={row?.lessonId || ""}
                            onChange={(event) => {
                              const nextLessonId = event.target.value;
                              setRows((prev) => ({
                                ...prev,
                                [child.id]: {
                                  ...(prev[child.id] || {
                                    lessonId: "",
                                    isAbsent: false,
                                    homeworkDone: false,
                                    comment: "",
                                    lessonManuallyChanged: false,
                                  }),
                                  lessonId: nextLessonId,
                                  lessonManuallyChanged: true,
                                },
                              }));
                              setRowErrors((prev) => ({ ...prev, [child.id]: { lessonId: undefined } }));
                            }}
                          >
                            <option value="">{t("activityReportSelectLesson")}</option>
                            {nivoLessons.map((lesson) => (
                              <option key={lesson.id} value={lesson.id}>
                                {lesson.title}
                              </option>
                            ))}
                          </Select>
                          {rowErrors[child.id]?.lessonId ? (
                            <p className="mt-1 text-xs text-red-600">{rowErrors[child.id]?.lessonId}</p>
                          ) : null}
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-slate-500">{t("activityReportComment")}</p>
                          <Input
                            placeholder={t("activityReportCommentPlaceholder")}
                            value={row?.comment || ""}
                            onChange={(event) => {
                              const nextComment = event.target.value;
                              setRows((prev) => ({
                                ...prev,
                                [child.id]: {
                                  ...(prev[child.id] || {
                                    lessonId: "",
                                    isAbsent: false,
                                    homeworkDone: false,
                                    comment: "",
                                    lessonManuallyChanged: false,
                                  }),
                                  comment: nextComment,
                                },
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <Switch
                            checked={row?.isAbsent || false}
                            onCheckedChange={(checked) => {
                              const isChecked = checked === true;
                              setRows((prev) => ({
                                ...prev,
                                [child.id]: {
                                  ...(prev[child.id] || {
                                    lessonId: "",
                                    isAbsent: false,
                                    homeworkDone: false,
                                    comment: "",
                                    lessonManuallyChanged: false,
                                  }),
                                  isAbsent: isChecked,
                                  homeworkDone: isChecked ? false : prev[child.id]?.homeworkDone || false,
                                },
                              }));
                            }}
                          />
                          <span>{t("activityReportAbsent")}</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <Switch
                            checked={row?.homeworkDone || false}
                            disabled={row?.isAbsent || false}
                            onCheckedChange={(checked) => {
                              const isChecked = checked === true;
                              setRows((prev) => ({
                                ...prev,
                                [child.id]: {
                                  ...(prev[child.id] || {
                                    lessonId: "",
                                    isAbsent: false,
                                    homeworkDone: false,
                                    comment: "",
                                    lessonManuallyChanged: false,
                                  }),
                                  homeworkDone: isChecked,
                                },
                              }));
                            }}
                          />
                          <span>{t("activityReportHomeworkDone")}</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => saveActivityMutation.mutate()}
            disabled={saveDisabled}
          >
            {isCreateMode ? t("activityReportSubmit") : t("activityReportUpdate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
