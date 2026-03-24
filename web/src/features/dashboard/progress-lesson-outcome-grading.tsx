import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

function passedSwitchDefault(passed: boolean | null | undefined): boolean {
  return passed === true;
}

type ProgressLessonOutcomeGradingProps = {
  childId: string;
  lessonId: string;
  outcome: ChildLessonOutcome | undefined;
};

export function ProgressLessonOutcomeGrading({ childId, lessonId, outcome }: ProgressLessonOutcomeGradingProps) {
  const { t } = useTranslation();
  const patch = usePatchChildLessonOutcome();

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

    const trimmed = parsed.data.markInput.trim();
    let mark: number | null = null;
    if (trimmed !== "") {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        form.setError("markInput", { message: t("lessonOutcomeMarkInvalid") });
        return;
      }
      mark = n;
    }

    try {
      await patch.mutateAsync({
        childId,
        lessonId,
        passed: parsed.data.passed,
        mark,
      });
      toast.success(t("lessonOutcomeSaved"));
    } catch {
      toast.error(t("lessonOutcomeSaveFailed"));
    }
  });

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 border-t border-border/80 pt-3">
      <div className="flex items-start gap-2">
        <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
        <p className="text-xs font-medium leading-snug text-slate-800">{t("lessonOutcomeGradingTitle")}</p>
      </div>
      <LessonOutcomePassMarkFields
        control={form.control}
        register={form.register}
        errors={form.formState.errors}
        disabled={patch.isPending}
        idsPrefix={`lesson-${lessonId}`}
        onMarkChange={() => form.clearErrors("markInput")}
        markRowTrailing={
          <Button
            type="submit"
            className="h-9 shrink-0 px-3 text-xs sm:min-w-[6.5rem] sm:px-4 sm:text-sm"
            disabled={patch.isPending}
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
