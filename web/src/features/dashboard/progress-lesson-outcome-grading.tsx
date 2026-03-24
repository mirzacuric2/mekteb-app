import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { ClipboardCheck, Loader2, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import type { ChildLessonOutcome } from "../children/types";
import { LessonOutcomePassMarkFields } from "./lesson-outcome-pass-mark-fields";
import { usePatchChildLessonOutcome } from "./use-patch-child-lesson-outcome";

const gradingFormSchema = z.object({
  passed: z.boolean(),
  markInput: z.string(),
});

export type LessonOutcomeGradingFormValues = z.infer<typeof gradingFormSchema>;

const LESSON_ACTIVITY_INCOMPLETE_CODE = "LESSON_ACTIVITY_INCOMPLETE";

function isLessonActivityIncompleteApiError(err: unknown): boolean {
  if (!axios.isAxiosError(err) || err.response?.status !== 400) return false;
  const data = err.response.data;
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { code?: string }).code === LESSON_ACTIVITY_INCOMPLETE_CODE
  );
}

function passedSwitchDefault(passed: boolean | null | undefined): boolean {
  return passed === true;
}

function parseLessonOutcomeMarkInput(trimmed: string): { ok: true; mark: number | null } | { ok: false } {
  if (trimmed === "") return { ok: true, mark: null };
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > 10) return { ok: false };
  return { ok: true, mark: n };
}

type ProgressLessonOutcomeGradingProps = {
  childId: string;
  lessonId: string;
  outcome: ChildLessonOutcome | undefined;
  activityReadyForPassedOutcome: boolean;
};

export function ProgressLessonOutcomeGrading({
  childId,
  lessonId,
  outcome,
  activityReadyForPassedOutcome,
}: ProgressLessonOutcomeGradingProps) {
  const { t } = useTranslation();
  const patch = usePatchChildLessonOutcome();

  const allowGradingEdits = activityReadyForPassedOutcome || outcome?.passed === true;

  const form = useForm<LessonOutcomeGradingFormValues>({
    defaultValues: {
      passed: passedSwitchDefault(outcome?.passed),
      markInput: outcome?.mark != null ? String(outcome.mark) : "",
    },
  });

  useEffect(() => {
    form.reset({
      passed: passedSwitchDefault(outcome?.passed),
      markInput: outcome?.mark != null ? String(outcome.mark) : "",
    });
  }, [childId, lessonId, outcome?.passed, outcome?.mark, outcome?.updatedAt, form.reset]);

  const onSubmit = form.handleSubmit(async (values) => {
    const parsed = gradingFormSchema.safeParse(values);
    if (!parsed.success) return;

    const markParsed = parseLessonOutcomeMarkInput(parsed.data.markInput.trim());
    if (!markParsed.ok) {
      form.setError("markInput", { message: t("lessonOutcomeMarkInvalid") });
      return;
    }

    if (!allowGradingEdits) {
      toast.error(t("lessonOutcomePassBlockedActivityIncomplete"));
      return;
    }

    if (parsed.data.passed && !activityReadyForPassedOutcome) {
      toast.error(t("lessonOutcomePassBlockedActivityIncomplete"));
      return;
    }

    try {
      await patch.mutateAsync({
        childId,
        lessonId,
        passed: parsed.data.passed,
        mark: markParsed.mark,
      });
      toast.success(t("lessonOutcomeSaved"));
    } catch (err) {
      if (isLessonActivityIncompleteApiError(err)) {
        toast.error(t("lessonOutcomePassBlockedActivityIncomplete"));
      } else {
        toast.error(t("lessonOutcomeSaveFailed"));
      }
    }
  });

  const onPassedWillChange = (next: boolean, _previous: boolean) => {
    if (next && !activityReadyForPassedOutcome) {
      toast.error(t("lessonOutcomePassBlockedActivityIncomplete"));
      return false;
    }
    const trimmed = form.getValues("markInput").trim();
    const markParsed = parseLessonOutcomeMarkInput(trimmed);
    if (!markParsed.ok) {
      form.setError("markInput", { message: t("lessonOutcomeMarkInvalid") });
      toast.error(t("lessonOutcomeMarkInvalid"));
      return false;
    }
    return true;
  };

  const onPassedPersist = async (nextPassed: boolean) => {
    if (nextPassed && !activityReadyForPassedOutcome) {
      toast.error(t("lessonOutcomePassBlockedActivityIncomplete"));
      throw new Error("activity_not_ready");
    }
    const trimmed = form.getValues("markInput").trim();
    const markParsed = parseLessonOutcomeMarkInput(trimmed);
    if (!markParsed.ok) {
      throw new Error("mark_invalid");
    }
    try {
      await patch.mutateAsync({
        childId,
        lessonId,
        passed: nextPassed,
        mark: markParsed.mark,
      });
      toast.success(t("lessonOutcomeSaved"));
    } catch (err) {
      if (isLessonActivityIncompleteApiError(err)) {
        toast.error(t("lessonOutcomePassBlockedActivityIncomplete"));
      } else {
        toast.error(t("lessonOutcomeSaveFailed"));
      }
      throw new Error("save_failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 border-t border-border/80 pt-3">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
          <p className="text-xs font-medium leading-snug text-slate-800">{t("lessonOutcomeGradingTitle")}</p>
        </div>
        {!allowGradingEdits ? (
          <p
            className="max-w-[min(100%,11rem)] shrink-0 text-right text-[10px] font-normal leading-snug text-amber-900 sm:max-w-[14rem] sm:text-[11px] md:max-w-xs"
            role="note"
          >
            {t("lessonOutcomeGradingBlockedHint")}
          </p>
        ) : null}
      </div>
      <LessonOutcomePassMarkFields
        control={form.control}
        register={form.register}
        errors={form.formState.errors}
        disabled={patch.isPending || !allowGradingEdits}
        idsPrefix={`lesson-${lessonId}`}
        onMarkChange={() => form.clearErrors("markInput")}
        onPassedWillChange={onPassedWillChange}
        onPassedPersist={(next, _prev) => onPassedPersist(next)}
        blockPassedTrueUntilActivityReady={!activityReadyForPassedOutcome}
        markRowTrailing={
          <Button
            type="submit"
            className="h-9 shrink-0 px-3 text-xs sm:min-w-[6.5rem] sm:px-4 sm:text-sm"
            disabled={patch.isPending || !allowGradingEdits}
          >
            {patch.isPending ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                {t("lessonOutcomeSaving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                {t("lessonOutcomeSave")}
              </>
            )}
          </Button>
        }
      />
    </form>
  );
}
