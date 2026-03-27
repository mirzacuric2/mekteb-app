import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Loader } from "../common/components/loader";
import { EmptyStateNotice } from "../common/components/empty-state-notice";
import {
  LESSON_NIVO_LABEL,
  LESSON_NIVO_ORDER,
  LESSON_PROGRAM,
  LessonNivo,
  LessonProgram,
} from "../lessons/constants";
import { ProgramScopeRadiogroup, type ProgramScopeFilterValue } from "../lessons/program-scope-radiogroup";
import { Lesson } from "../lessons/types";
import { useAuthedQuery } from "../common/use-authed-query";
import { ActivitiesListResponse, ActivityLecture } from "./types";
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
  program: z.nativeEnum(LESSON_PROGRAM),
  nivo: z.number().int().min(1).max(5).optional(),
  defaultLessonId: z.string().trim().optional(),
  lessonText: z.string().trim().optional(),
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
  if (data.program === LESSON_PROGRAM.ILMIHAL && typeof data.nivo !== "number") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nivo"], message: "Nivo is required." });
  }
  if (data.program !== LESSON_PROGRAM.QURAN && !data.defaultLessonId?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["defaultLessonId"], message: "Lesson is required." });
  }
  if (data.program === LESSON_PROGRAM.QURAN && !data.lessonText?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lessonText"], message: "Lesson text is required." });
  }
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
  const [program, setProgram] = useState<LessonProgram>(LESSON_PROGRAM.ILMIHAL);
  const [nivo, setNivo] = useState<LessonNivo | "">("");
  const [lessonText, setLessonText] = useState("");
  const childrenQuery = useQuery<ChildRecord[]>({
    queryKey: ["activity-report-children", program, nivo],
    enabled: open && (program !== LESSON_PROGRAM.ILMIHAL || nivo !== ""),
    queryFn: async () =>
      (
        await api.get("/children", {
          params: { nivo: program === LESSON_PROGRAM.ILMIHAL ? nivo : undefined, program, status: CHILD_STATUS.ACTIVE },
        })
      ).data,
  });
  const lessonsQuery = useAuthedQuery<Lesson[]>("lessons", "/lessons", open);
  const draftLecturesQuery = useQuery<ActivitiesListResponse>({
    queryKey: ["activity-report-drafts", program, nivo],
    enabled: open && !editingActivity && (program !== LESSON_PROGRAM.ILMIHAL || typeof nivo === "number"),
    queryFn: async () =>
      (
        await api.get("/lectures", {
          params: {
            program,
            nivo: program === LESSON_PROGRAM.ILMIHAL ? nivo : undefined,
            status: LECTURE_STATUS.DRAFT,
            page: 1,
            pageSize: 100,
          },
        })
      ).data,
  });
  const [defaultLessonId, setDefaultLessonId] = useState("");
  const [homeworkEnabled, setHomeworkEnabled] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [markCompleted, setMarkCompleted] = useState(false);
  const [rows, setRows] = useState<Record<string, ChildRowState>>({});
  const [fieldErrors, setFieldErrors] = useState<{
    nivo?: string;
    defaultLessonId?: string;
    lessonText?: string;
    rows?: string;
    homeworkTitle?: string;
  }>({});
  const [autoDraftActivity, setAutoDraftActivity] = useState<ActivityLecture | null>(null);

  const effectiveEditingActivity = editingActivity || autoDraftActivity;
  const draftItems = draftLecturesQuery.data?.items || [];
  const draftCountForNivo = draftItems.length;
  const matchedDraftForLesson = useMemo(() => {
    if (editingActivity || program === LESSON_PROGRAM.QURAN) return null;
    if (program === LESSON_PROGRAM.ILMIHAL && typeof nivo !== "number") return null;
    if (!defaultLessonId) return null;
    return (
      [...draftItems]
        .filter((lecture) => lecture.attendance.some((entry) => entry.lessonId === defaultLessonId))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] || null
    );
  }, [defaultLessonId, draftItems, editingActivity, nivo, program]);

  const activeChildrenForNivo = useMemo(() => childrenQuery.data || [], [childrenQuery.data]);
  const childrenForForm = useMemo(() => {
    if (!effectiveEditingActivity) return activeChildrenForNivo;
    const unique = new Map<string, ChildRecord>();
    for (const attendance of effectiveEditingActivity.attendance) {
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
  }, [activeChildrenForNivo, effectiveEditingActivity]);

  const nivoLessons = useMemo(
    () =>
      (lessonsQuery.data || []).filter((lesson) => {
        if (lesson.program !== program) return false;
        if (program === LESSON_PROGRAM.ILMIHAL) return nivo !== "" && lesson.nivo === nivo;
        return true;
      }),
    [lessonsQuery.data, nivo, program]
  );

  const resetForm = () => {
    setProgram(LESSON_PROGRAM.ILMIHAL);
    setNivo("");
    setDefaultLessonId("");
    setLessonText("");
    setHomeworkEnabled(false);
    setHomeworkTitle("");
    setHomeworkDescription("");
    setMarkCompleted(false);
    setRows({});
    setFieldErrors({});
    setAutoDraftActivity(null);
  };

  const applyProgramChange = useCallback((nextProgram: LessonProgram) => {
    setProgram(nextProgram);
    setRows({});
    setDefaultLessonId("");
    setLessonText("");
    if (nextProgram !== LESSON_PROGRAM.ILMIHAL) {
      setNivo("");
    }
    setHomeworkEnabled(false);
    setHomeworkTitle("");
    setHomeworkDescription("");
    setFieldErrors((prev) => ({ ...prev, nivo: undefined, defaultLessonId: undefined, lessonText: undefined }));
  }, []);

  const onProgramScopeChange = useCallback(
    (next: ProgramScopeFilterValue) => {
      if (next === "ALL") return;
      if (next === program) return;
      applyProgramChange(next);
    },
    [applyProgramChange, program]
  );

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    if (effectiveEditingActivity) {
      setProgram(effectiveEditingActivity.program);
      setNivo(effectiveEditingActivity.nivo || "");
      setDefaultLessonId(effectiveEditingActivity.attendance[0]?.lessonId || "");
      setLessonText(effectiveEditingActivity.attendance[0]?.lessonText || "");
      const sampleHomework = effectiveEditingActivity.attendance.find((entry) => Boolean(entry.homeworkTitle?.trim()));
      setHomeworkEnabled(Boolean(sampleHomework));
      setHomeworkTitle(sampleHomework?.homeworkTitle || "");
      setHomeworkDescription(sampleHomework?.homeworkDescription || "");
      setMarkCompleted(effectiveEditingActivity.status === LECTURE_STATUS.COMPLETED);
      setFieldErrors({});
    }
  }, [open, effectiveEditingActivity]);

  useEffect(() => {
    if (effectiveEditingActivity) {
      const next: Record<string, ChildRowState> = {};
      for (const attendance of effectiveEditingActivity.attendance) {
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
  }, [activeChildrenForNivo, effectiveEditingActivity]);

  useEffect(() => {
    if (editingActivity) return;
    setAutoDraftActivity(matchedDraftForLesson);
  }, [editingActivity, matchedDraftForLesson]);

  const saveActivityMutation = useMutation({
    mutationFn: async () => {
      const payloadRows = childrenForForm.map((child) => ({
        childId: child.id,
        present: rows[child.id]?.present ?? true,
        comment: rows[child.id]?.comment || "",
      }));
      const parsed = reportSchema.safeParse({
        program,
        nivo: typeof nivo === "number" ? nivo : undefined,
        defaultLessonId,
        lessonText,
        homeworkEnabled,
        homeworkTitle,
        homeworkDescription,
        rows: payloadRows,
      });

      if (!parsed.success) {
        const nextFieldErrors: {
          nivo?: string;
          defaultLessonId?: string;
          lessonText?: string;
          rows?: string;
          homeworkTitle?: string;
        } = {};
        for (const issue of parsed.error.issues) {
          const [field, index] = issue.path;
          if (field === "nivo") nextFieldErrors.nivo = t("activityReportNivoRequired");
          if (field === "defaultLessonId") nextFieldErrors.defaultLessonId = t("activityReportLessonRequired");
          if (field === "lessonText") nextFieldErrors.lessonText = t("activityReportLessonTextRequired");
          if (field === "homeworkTitle") nextFieldErrors.homeworkTitle = t("activityReportHomeworkTitleRequired");
          if (field === "rows" && index === undefined) {
            nextFieldErrors.rows = issue.message;
          }
        }
        setFieldErrors(nextFieldErrors);
        throw new Error("validation_error");
      }

      return (
        await (effectiveEditingActivity
          ? api.patch(`/lectures/${effectiveEditingActivity.id}`, {
              nivo: parsed.data.nivo,
              program: parsed.data.program,
              lessonText: parsed.data.program === LESSON_PROGRAM.QURAN ? parsed.data.lessonText?.trim() : undefined,
              attendance: parsed.data.rows.map((row) => ({
                childId: row.childId,
                lessonId: parsed.data.program === LESSON_PROGRAM.QURAN ? undefined : parsed.data.defaultLessonId,
                present: row.present,
                homeworkTitle: parsed.data.homeworkEnabled ? parsed.data.homeworkTitle.trim() : undefined,
                homeworkDescription: parsed.data.homeworkEnabled ? parsed.data.homeworkDescription.trim() || undefined : undefined,
                comment: row.comment.trim() || undefined,
              })),
              markCompleted,
            })
          : api.post("/lectures", {
              nivo: parsed.data.nivo,
              program: parsed.data.program,
              lessonText: parsed.data.program === LESSON_PROGRAM.QURAN ? parsed.data.lessonText?.trim() : undefined,
              attendance: parsed.data.rows.map((row) => ({
                childId: row.childId,
                lessonId: parsed.data.program === LESSON_PROGRAM.QURAN ? undefined : parsed.data.defaultLessonId,
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
      toast.success(effectiveEditingActivity ? t("activityReportUpdated") : t("activityReportCreated"));
      onSaved?.();
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validation_error") return;
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            (effectiveEditingActivity ? t("activityReportUpdateFailed") : t("activityReportCreateFailed")))
          : effectiveEditingActivity
            ? t("activityReportUpdateFailed")
            : t("activityReportCreateFailed");
      toast.error(message);
    },
  });
  const isCreateMode = !effectiveEditingActivity;
  const hasSelectedLesson = program === LESSON_PROGRAM.QURAN ? lessonText.trim().length > 0 : defaultLessonId.trim().length > 0;
  const saveDisabled =
    saveActivityMutation.isPending ||
    (program === LESSON_PROGRAM.ILMIHAL && nivo === "") ||
    (program === LESSON_PROGRAM.QURAN && !lessonText.trim()) ||
    childrenQuery.isLoading ||
    childrenQuery.isError ||
    lessonsQuery.isLoading ||
    (program !== LESSON_PROGRAM.QURAN && nivoLessons.length === 0) ||
    childrenForForm.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? t("activityReportCreateTitle") : t("activityReportEditTitle")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <section className="space-y-3 rounded-md border border-border p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("lessonsProgramLabel")}</p>
                <ProgramScopeRadiogroup
                  value={program}
                  onChange={onProgramScopeChange}
                  includeAll={false}
                  showLabel={false}
                  ariaLabelKey="communityOverviewProgressProgramFilterLabel"
                />
              </div>
              {program === LESSON_PROGRAM.ILMIHAL ? (
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
                  {typeof nivo === "number" && draftCountForNivo > 0 ? (
                    <p className="mt-1 text-xs text-slate-500">{t("activityReportDraftCountForNivo", { count: draftCountForNivo })}</p>
                  ) : null}
                </div>
              ) : (
                <div>
                  {program === LESSON_PROGRAM.QURAN ? (
                    <>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("activityReportQuranLessonText")}</p>
                      <Input
                        value={lessonText}
                        onChange={(event) => {
                          setLessonText(event.target.value);
                          setFieldErrors((prev) => ({ ...prev, lessonText: undefined }));
                        }}
                        placeholder={t("activityReportQuranLessonTextPlaceholder")}
                      />
                      {fieldErrors.lessonText ? <p className="mt-1 text-xs text-red-600">{fieldErrors.lessonText}</p> : null}
                    </>
                  ) : (
                    <>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("activityReportDefaultLesson")}</p>
                      <Select value={defaultLessonId} onChange={(event) => setDefaultLessonId(event.target.value)}>
                        <option value="">{t("activityReportSelectLesson")}</option>
                        {nivoLessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </Select>
                      {fieldErrors.defaultLessonId ? <p className="mt-1 text-xs text-red-600">{fieldErrors.defaultLessonId}</p> : null}
                    </>
                  )}
                </div>
              )}
            </div>
            {program === LESSON_PROGRAM.ILMIHAL ? (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("activityReportDefaultLesson")}</p>
                <Select
                  value={defaultLessonId}
                  onChange={(event) => setDefaultLessonId(event.target.value)}
                  disabled={nivo === ""}
                >
                  <option value="">{t("activityReportSelectLesson")}</option>
                  {nivoLessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </Select>
                {fieldErrors.defaultLessonId ? <p className="mt-1 text-xs text-red-600">{fieldErrors.defaultLessonId}</p> : null}
              </div>
            ) : null}
            {!editingActivity && matchedDraftForLesson ? (
              <p className="mt-1 text-xs text-amber-700">{t("activityReportUsingExistingDraftForLesson")}</p>
            ) : null}
          </section>

          <section className="rounded-md border border-border p-3">
            <div className="flex items-center">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <Switch
                  checked={homeworkEnabled}
                  onCheckedChange={(checked) => setHomeworkEnabled(checked === true)}
                  disabled={!hasSelectedLesson}
                />
                <span>{t("activityReportAssignHomeworkForLecture")}</span>
              </label>
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
            {program === LESSON_PROGRAM.ILMIHAL && nivo === "" ? (
              <EmptyStateNotice className="p-4">{t("activityReportSelectNivoFirst")}</EmptyStateNotice>
            ) : childrenQuery.isError ? (
              <div className="rounded-md border border-dashed border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{t("activityReportChildrenLoadFailed")}</p>
                <Button type="button" variant="outline" className="mt-2" onClick={() => childrenQuery.refetch()}>
                  {t("activityReportRetry")}
                </Button>
              </div>
            ) : childrenQuery.isLoading || lessonsQuery.isLoading ? (
              <EmptyStateNotice className="p-4">
                <Loader size="sm" text={t("reportingLoading")} />
              </EmptyStateNotice>
            ) : program !== LESSON_PROGRAM.QURAN && nivoLessons.length === 0 ? (
              <EmptyStateNotice className="p-4">{t("activityReportNoLessonsForNivo")}</EmptyStateNotice>
            ) : childrenForForm.length === 0 ? (
              <EmptyStateNotice className="p-4">{t("activityReportNoChildrenForNivo")}</EmptyStateNotice>
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
