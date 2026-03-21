import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../components/ui/input";

type Props = {
  id: string;
  disabled?: boolean;
  onPick: (file: File) => void;
  /**
   * Describes which PDF is currently used for preview/generation. Native file inputs cannot show
   * a “selected” default asset; this line makes the active source explicit.
   */
  activeSourceHint?: string;
  /** Rendered on the same row as the file input (wraps below on narrow viewports). */
  actions?: ReactNode;
};

export function DiplomaTemplateFileInput({ id, disabled, onPick, activeSourceHint, actions }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-800" htmlFor={id}>
        {t("diplomaPreviewTemplateFile")}
      </label>
      {activeSourceHint ? (
        <p className="max-w-xl rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs leading-snug text-slate-500">
          {activeSourceHint}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="min-w-0 w-full md:min-w-[12rem] md:max-w-xl md:flex-1">
          <Input
            id={id}
            type="file"
            accept="application/pdf"
            disabled={disabled}
            className="w-full cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
            }}
          />
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
