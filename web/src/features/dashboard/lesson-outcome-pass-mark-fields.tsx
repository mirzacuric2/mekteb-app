import type { ReactNode } from "react";
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";

export type LessonOutcomePassMarkFieldValues = {
  passed: boolean;
  markInput: string;
};

type LessonOutcomePassMarkFieldsProps = {
  control: Control<LessonOutcomePassMarkFieldValues>;
  register: UseFormRegister<LessonOutcomePassMarkFieldValues>;
  errors: FieldErrors<LessonOutcomePassMarkFieldValues>;
  disabled?: boolean;
  idsPrefix: string;
  onMarkChange?: () => void;
  compact?: boolean;
  className?: string;
  markRowTrailing?: ReactNode;
  onPassedWillChange?: (next: boolean, previous: boolean) => boolean;
  onPassedPersist?: (next: boolean, previous: boolean) => Promise<void>;
  blockPassedTrueUntilActivityReady?: boolean;
};

export function LessonOutcomePassMarkFields({
  control,
  register,
  errors,
  disabled,
  idsPrefix,
  onMarkChange,
  compact,
  className,
  markRowTrailing,
  onPassedWillChange,
  onPassedPersist,
  blockPassedTrueUntilActivityReady,
}: LessonOutcomePassMarkFieldsProps) {
  const { t } = useTranslation();
  const markRegister = register("markInput");
  const passed = useWatch({ control, name: "passed", defaultValue: true });

  return (
    <div
      className={cn(
        compact ? "flex flex-wrap items-center gap-3" : "flex flex-col gap-3",
        className
      )}
    >
      <div className={compact ? "flex items-center gap-2" : "flex min-w-0 flex-col gap-1"}>
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="passed"
            render={({ field }) => (
              <Switch
                id={`${idsPrefix}-passed`}
                checked={field.value}
                onCheckedChange={(checked) => {
                  const previous = field.value;
                  if (onPassedWillChange && !onPassedWillChange(checked, previous)) return;
                  field.onChange(checked);
                  if (onPassedPersist) {
                    void onPassedPersist(checked, previous).catch(() => {
                      field.onChange(previous);
                    });
                  }
                }}
                disabled={disabled || (blockPassedTrueUntilActivityReady === true && !field.value)}
                aria-label={t("lessonOutcomePassedAria")}
              />
            )}
          />
          <label htmlFor={`${idsPrefix}-passed`} className="cursor-pointer text-sm text-slate-800">
            {t("lessonOutcomePassed")}
          </label>
        </div>
        {!compact ? (
          <p className="text-xs text-slate-500">
            {passed ? t("lessonOutcomeSwitchHintOn") : t("lessonOutcomeSwitchHintOff")}
          </p>
        ) : null}
      </div>
      {compact ? (
        <div className="flex items-center gap-2">
          <label htmlFor={`${idsPrefix}-mark`} className="sr-only">
            {t("lessonOutcomeMarkLabel")}
          </label>
          <Input
            id={`${idsPrefix}-mark`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="1–10"
            className="h-8 w-14"
            disabled={disabled}
            {...markRegister}
            onChange={(e) => {
              onMarkChange?.();
              markRegister.onChange(e);
            }}
          />
          {errors.markInput ? (
            <p className="text-xs text-destructive">{errors.markInput.message}</p>
          ) : null}
        </div>
      ) : markRowTrailing ? (
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 sm:gap-2.5">
            <label
              htmlFor={`${idsPrefix}-mark`}
              className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-700"
            >
              <span className="sm:hidden">{t("lessonOutcomeMarkShort")}</span>
              <span className="hidden sm:inline">{t("lessonOutcomeMarkLabel")}</span>
            </label>
            <Input
              id={`${idsPrefix}-mark`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1–10"
              className="h-9 w-[4.75rem] shrink-0 sm:w-[5.25rem]"
              disabled={disabled}
              {...markRegister}
              onChange={(e) => {
                onMarkChange?.();
                markRegister.onChange(e);
              }}
            />
            <span className="flex shrink-0">{markRowTrailing}</span>
          </div>
          {errors.markInput ? (
            <p className="text-xs text-destructive">{errors.markInput.message}</p>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 space-y-1">
          <label htmlFor={`${idsPrefix}-mark`} className="block text-xs font-medium text-slate-700">
            {t("lessonOutcomeMarkLabel")}
          </label>
          <Input
            id={`${idsPrefix}-mark`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="1–10"
            className="h-9 w-full max-w-[5.5rem]"
            disabled={disabled}
            {...markRegister}
            onChange={(e) => {
              onMarkChange?.();
              markRegister.onChange(e);
            }}
          />
          {errors.markInput ? (
            <p className="text-xs text-destructive">{errors.markInput.message}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
