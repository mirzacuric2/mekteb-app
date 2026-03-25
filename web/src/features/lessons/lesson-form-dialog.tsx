import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BookPlus, PencilLine, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DEFAULT_LESSON_NIVO,
  LESSON_NIVO,
  LESSON_NIVO_LABEL,
  LESSON_NIVO_ORDER,
} from "./constants";

const lessonFormSchema = z.object({
  title: z.string().trim().min(2, "Lesson title must be at least 2 characters."),
  nivo: z.nativeEnum(LESSON_NIVO),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;

type LessonFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  submitting: boolean;
  initialValues?: Partial<LessonFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LessonFormValues) => void;
};

export function LessonFormDialog({
  open,
  mode,
  submitting,
  initialValues,
  onOpenChange,
  onSubmit,
}: LessonFormDialogProps) {
  const { t } = useTranslation();
  const [submitLocked, setSubmitLocked] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LessonFormValues>({
    defaultValues: {
      title: "",
      nivo: DEFAULT_LESSON_NIVO,
    },
  });

  useEffect(() => {
    if (!open) return;
    setSubmitLocked(false);
    reset({
      title: initialValues?.title || "",
      nivo: initialValues?.nivo || DEFAULT_LESSON_NIVO,
    });
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!submitting) {
      setSubmitLocked(false);
    }
  }, [submitting]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? <BookPlus className="h-4 w-4 text-slate-500" /> : <PencilLine className="h-4 w-4 text-slate-500" />}
            <span>{mode === "create" ? t("lessonsCreate") : t("lessonsEdit")}</span>
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => {
            clearErrors();
            const parsed = lessonFormSchema.safeParse(values);
            if (!parsed.success) {
              for (const issue of parsed.error.issues) {
                const [field] = issue.path;
                if (field === "title" || field === "nivo") {
                  setError(field, { type: "manual", message: issue.message });
                }
              }
              return;
            }
            setSubmitLocked(true);
            onSubmit(parsed.data);
          })}
        >
          <DialogBody className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("lessonsTitleLabel")}</label>
              <Input {...register("title")} />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("lessonsNivoLabel")}</label>
              <Select {...register("nivo", { valueAsNumber: true })}>
                {LESSON_NIVO_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {LESSON_NIVO_LABEL[value]}
                  </option>
                ))}
              </Select>
              {errors.nivo ? <p className="mt-1 text-xs text-red-600">{errors.nivo.message}</p> : null}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting || submitLocked}>
              <Save className="mr-1 h-4 w-4" />
              {mode === "create" ? t("lessonsCreate") : t("lessonsSave")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
