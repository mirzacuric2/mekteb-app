import { LESSON_NIVO_ORDER, LessonNivo } from "../lessons/constants";
import { cn } from "../../lib/utils";

type NivoProgressProps = {
  nivo: LessonNivo;
  showIndexLabel?: boolean;
  selectable?: boolean;
  onSelect?: (nextNivo: LessonNivo) => void;
  disabled?: boolean;
};

export function NivoProgress({
  nivo,
  showIndexLabel = false,
  selectable = false,
  onSelect,
  disabled = false,
}: NivoProgressProps) {
  const currentIndex = LESSON_NIVO_ORDER.indexOf(nivo);
  const currentLevelNumber = currentIndex + 1;
  const totalLevels = LESSON_NIVO_ORDER.length;

  return (
    <div className="inline-flex items-center gap-2" aria-label={`Nivo progress at ${currentLevelNumber}`}>
      <div className="inline-flex items-center gap-2">
        {LESSON_NIVO_ORDER.map((level, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const levelNumber = index + 1;
          const stateLabel = isCompleted ? "Completed level" : isCurrent ? "Current level" : "Upcoming level";

          const dotClassName = cn("relative h-3.5 w-3.5 rounded-full border", isCompleted ? "border-emerald-500 bg-emerald-500" : undefined, isCurrent ? "border-sky-500 bg-white" : undefined, !isCompleted && !isCurrent ? "border-slate-300 bg-slate-100" : undefined);

          if (selectable) {
            return (
              <button
                key={level}
                type="button"
                disabled={disabled}
                className={cn(
                  "inline-flex items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                )}
                onClick={() => onSelect?.(level)}
                title={`Set Nivo ${levelNumber} - ${stateLabel}`}
                aria-label={`Set Nivo ${levelNumber} - ${stateLabel}`}
              >
                <span className={dotClassName}>{isCurrent ? <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-sky-500" /> : null}</span>
              </button>
            );
          }

          return (
            <span
              key={level}
              className={dotClassName}
              title={`Nivo ${levelNumber} - ${stateLabel}`}
              aria-label={`Nivo ${levelNumber} - ${stateLabel}`}
            >
              {isCurrent ? <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-sky-500" /> : null}
            </span>
          );
        })}
      </div>
      {showIndexLabel ? (
        <span className="text-xs font-medium tabular-nums text-slate-600">
          {currentLevelNumber}/{totalLevels}
        </span>
      ) : null}
    </div>
  );
}
