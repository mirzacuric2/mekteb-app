import { useId } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { LESSON_PROGRAM_I18N_KEY, LESSON_PROGRAM_ORDER, type LessonProgram } from "./constants";

export type ProgramScopeFilterValue = LessonProgram | "ALL";

export type ProgramScopeRadiogroupProps = {
  value: ProgramScopeFilterValue;
  onChange: (value: ProgramScopeFilterValue) => void;
  /** i18n key for the visible label above the chips */
  labelKey?: string;
  /** i18n key for the “all programs” option when `includeAll` is true */
  allProgramsLabelKey?: string;
  includeAll?: boolean;
  programs?: readonly LessonProgram[];
  /** Hide the visible label; radiogroup still has an accessible name via `aria-label` */
  showLabel?: boolean;
  /** Used when `showLabel` is false */
  ariaLabelKey?: string;
  className?: string;
};

export function ProgramScopeRadiogroup({
  value,
  onChange,
  labelKey = "communityOverviewProgressProgramFilterLabel",
  allProgramsLabelKey = "communityOverviewProgressProgramAll",
  includeAll = true,
  programs = LESSON_PROGRAM_ORDER,
  showLabel = true,
  ariaLabelKey,
  className,
}: ProgramScopeRadiogroupProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const options: ProgramScopeFilterValue[] = includeAll ? ["ALL", ...programs] : [...programs];
  const groupName = t(ariaLabelKey ?? labelKey);

  return (
    <div className={cn(className)}>
      {showLabel ? (
        <p id={labelId} className="mb-1 block text-xs font-medium text-slate-600">
          {t(labelKey)}
        </p>
      ) : null}
      <div
        role="radiogroup"
        aria-labelledby={showLabel ? labelId : undefined}
        aria-label={showLabel ? undefined : groupName}
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {options.map((option) => {
          const isSelected = value === option;
          const label =
            option === "ALL" ? t(allProgramsLabelKey) : t(LESSON_PROGRAM_I18N_KEY[option]);
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={cn(
                "w-full rounded-md border px-3 py-1.5 text-sm transition-colors sm:w-auto",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-white text-slate-700 hover:bg-slate-50"
              )}
              onClick={() => onChange(option)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
