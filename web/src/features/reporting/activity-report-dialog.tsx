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
import { LECTURE_STATUS } from "./reporting.constants";

type ActivityReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingActivity?: ActivityLecture | null;
  onSaved?: () => void;
};

type ChildRowState = {
  present: boolean;
  comment: string;
};

const reportSchema = z.object({
  nivo: z.number().int().min(1).max(5),
  defaultLessonId: z.string().trim().min(1, "Lesson is required."),
  homeworkEnabled: z.boolean(),
  homeworkTitle: z.string().trim(),
  homeworkDescription: z.string().trim(),
  rows: z
    .array(
      z.object({
        childId: z.string(),
        present: z.boolean(),
        comment: z.string().trim(),
      })
    )
    .min(1, "At least one child is required."),
}).superRefine((data, ctx) => {
  if (data.homeworkEnabled && !data.homeworkTitle.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["homeworkTitle"],
      message: "Homework title is required.",
    });
  }
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
  const [homeworkEnabled, setHomeworkEnabled] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [markCompleted, setMarkCompleted] = useState(false);
  const [rows, setRows] = useState<Record<string, ChildRowState>>({});
  const [fieldErrors, setFieldErrors] = useState<{ nivo?: string; defaultLessonId?: string; rows?: string; homeworkTitle?: string }>({});

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
    setHomeworkEnabled(false);
    setHomeworkTitle("");
    setHomeworkDescription("");
    setMarkCompleted(false);
    setRows({});
    setFieldErrors({});
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    if (editingActivity) {
      setNivo(editingActivity.nivo || "");
      setDefaultLessonId(editingActivity.attendance[0]?.lessonId || "");
      const sampleHomework = editingActivity.attendance.find((entry) => Boolean(entry.homeworkTitle?.trim()));
      setHomeworkEnabled(Boolean(sampleHomework));
      setHomeworkTitle(sampleHomework?.homeworkTitle || "");
      setHomeworkDescription(sampleHomework?.homeworkDescription || "");
      setMarkCompleted(editingActivity.status === LECTURE_STATUS.COMPLETED);
      setFieldErrors({});
    }
  }, [open, editingActivity]);

  useEffect(() => {
    if (editingActivity) {
      const next: Record<string, ChildRowState> = {};
      for (const attendance of editingActivity.attendance) {
        next[attendance.childId] = {
          present: attendance.present,
          comment: attendance.comment || "",
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
          present: true,
          comment: "",
        };
      }
      return next;
    });
  }, [activeChildrenForNivo, editingActivity]);

  const saveActivityMutation = useMutation({
    mutationFn: async () => {
      const payloadRows = childrenForForm.map((child) => ({
        childId: child.id,
        present: rows[child.id]?.present ?? true,
        comment: rows[child.id]?.comment || "",
      }));
      const parsed = reportSchema.safeParse({
        nivo: typeof nivo === "number" ? nivo : undefined,
        defaultLessonId,
        homeworkEnabled,
        homeworkTitle,
        homeworkDescription,
        rows: payloadRows,
      });

      if (!parsed.success) {
        const nextFieldErrors: { nivo?: string; defaultLessonId?: string; rows?: string; homeworkTitle?: string } = {};
        for (const issue of parsed.error.issues) {
          const [field, index] = issue.path;
          if (field === "nivo") nextFieldErrors.nivo = t("activityReportNivoRequired");
          if (field === "defaultLessonId") nextFieldErrors.defaultLessonId = t("activityReportLessonRequired");
          if (field === "homeworkTitle") nextFieldErrors.homeworkTitle = t("activityReportHomeworkTitleRequired");
          if (field === "rows" && index === undefined) {
            nextFieldErrors.rows = issue.message;
          }
        }
        setFieldErrors(nextFieldErrors);
        throw new Error("validation_error");
      }

      return (
        await (editingActivity
          ? api.patch(`/lectures/${editingActivity.id}`, {
              nivo: parsed.data.nivo,
              attendance: parsed.data.rows.map((row) => ({
                childId: row.childId,
                lessonId: parsed.data.defaultLessonId,
                present: row.present,
                homeworkTitle: parsed.data.homeworkEnabled ? parsed.data.homeworkTitle.trim() : undefined,
                homeworkDescription: parsed.data.homeworkEnabled ? parsed.data.homeworkDescription.trim() || undefined : undefined,
                comment: row.comment.trim() || undefined,
              })),
              markCompleted,
            })
          : api.post("/lectures", {
              nivo: parsed.data.nivo,
              attendance: parsed.data.rows.map((row) => ({
                childId: row.childId,
                lessonId: parsed.data.defaultLessonId,
                present: row.present,
                homeworkTitle: parsed.data.homeworkEnabled ? parsed.data.homeworkTitle.trim() : undefined,
                homeworkDescription: parsed.data.homeworkEnabled ? parsed.data.homeworkDescription.trim() || undefined : undefined,
                comment: row.comment.trim() || undefined,
              })),
              markCompleted,
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
          <div className="grid md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("childrenNivoLabel")}</p>
              <Select
                value={nivo === "" ? "" : String(nivo)}
                onChange={(event) => {
                  const selectedNivo = event.target.value ? (Number(event.target.value) as LessonNivo) : "";
                  setNivo(selectedNivo);
                  setRows({});
                  setDefaultLessonId("");
                  setHomeworkEnabled(false);
                  setHomeworkTitle("");
                  setHomeworkDescription("");
                  setFieldErrors((prev) => ({ ...prev, nivo: undefined, defaultLessonId: undefined }));
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
            <div className="grid gap-3 md:grid-cols-2 md:items-center">
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
                {fieldErrors.defaultLessonId ? <p className="mt-1 text-xs text-red-600">{fieldErrors.defaultLessonId}</p> : null}
              </div>
              <div className="flex items-center md:pt-6">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <Switch checked={homeworkEnabled} onCheckedChange={(checked) => setHomeworkEnabled(checked === true)} />
                  <span>{t("activityReportAssignHomeworkForLecture")}</span>
                </label>
              </div>
            </div>
            {homeworkEnabled ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-slate-500">{t("activityReportHomeworkTitle")}</p>
                  <Input
                    placeholder={t("activityReportHomeworkTitlePlaceholder")}
                    value={homeworkTitle}
                    onChange={(event) => {
                      setHomeworkTitle(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, homeworkTitle: undefined }));
                    }}
                  />
                  {fieldErrors.homeworkTitle ? <p className="mt-1 text-xs text-red-600">{fieldErrors.homeworkTitle}</p> : null}
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500">{t("activityReportHomeworkDescription")}</p>
                  <Input
                    placeholder={t("activityReportHomeworkDescriptionPlaceholder")}
                    value={homeworkDescription}
                    onChange={(event) => setHomeworkDescription(event.target.value)}
                  />
                </div>
              </div>
            ) : null}
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
                      <div className="grid gap-2 md:grid-cols-3 md:items-start">
                        <div className="md:col-span-2">
                          <p className="mb-1 text-xs text-slate-500">{t("activityReportAttendanceComment")}</p>
                          <textarea
                            placeholder={t("activityReportAttendanceCommentPlaceholder")}
                            value={row?.comment || ""}
                            onChange={(event) => {
                              const nextComment = event.target.value;
                              setRows((prev) => ({
                                ...prev,
                                [child.id]: {
                                  ...(prev[child.id] || {
                                    present: true,
                                    comment: "",
                                  }),
                                  comment: nextComment,
                                },
                              }));
                            }}
                            rows={1}
                            className="w-full resize-none overflow-y-auto rounded-md border border-input bg-white px-3 py-2 text-sm leading-5 outline-none ring-0 focus:border-ring min-h-[2.25rem] max-h-[6.25rem]"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <p className="mb-1 text-xs text-transparent hidden md:block" aria-hidden>
                            {t("activityReportAttendanceComment")}
                          </p>
                          <div className="flex h-auto items-center md:h-10">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                              <Switch
                                checked={row?.present ?? true}
                                onCheckedChange={(checked) => {
                                  const isChecked = checked === true;
                                  setRows((prev) => ({
                                    ...prev,
                                    [child.id]: {
                                      ...(prev[child.id] || {
                                        present: true,
                                        comment: "",
                                      }),
                                      present: isChecked,
                                    },
                                  }));
                                }}
                              />
                              <span>{t("activityReportPresent")}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </DialogBody>
        <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:mr-auto">
            <Switch checked={markCompleted} onCheckedChange={(checked) => setMarkCompleted(checked === true)} />
            <span>{t("activityReportMarkCompletedOnSave")}</span>
          </label>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full whitespace-nowrap sm:w-auto">
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => saveActivityMutation.mutate()}
              disabled={saveDisabled}
              className="w-full whitespace-nowrap sm:w-auto"
            >
              {isCreateMode ? t("activityReportSubmit") : t("activityReportUpdate")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
