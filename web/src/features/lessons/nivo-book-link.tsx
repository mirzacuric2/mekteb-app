import { ExternalLink, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { openNivoBookPreview } from "./open-nivo-book-preview";

type NivoBookLinkProps = {
  nivo: number;
  label: string;
  className?: string;
  stopPropagation?: boolean;
};

export function NivoBookLink({ nivo, label, className, stopPropagation }: NivoBookLinkProps) {
  const { t } = useTranslation();

  const handlePreview = () => {
    void openNivoBookPreview(nivo).catch(() => {
      toast.error(t("lessonsBookPreviewFailed"));
    });
  };

  return (
    <span
      className={cn(
        "inline-flex max-w-[240px] cursor-pointer items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-xs font-medium text-blue-600 underline-offset-2 transition-colors hover:bg-blue-50 hover:text-blue-700 hover:underline",
        className,
      )}
      title={label}
      role="link"
      tabIndex={0}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        handlePreview();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handlePreview();
      }}
    >
      <FileText className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
      <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" aria-hidden />
    </span>
  );
}
