import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Checkbox } from "../../../components/ui/checkbox";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import { copyArrayBufferToUint8 } from "../../../lib/array-buffer";
import { formatDate } from "../../../lib/date-time";
import { ROLE } from "../../../types";
import { useSession } from "../../auth/session-context";
import { useChildrenDiplomaCandidatesQuery } from "../../children/use-children-data";
import type { ChildRecord } from "../../children/types";
import { LESSON_NIVO_LABEL, LESSON_NIVO_ORDER, type LessonNivo } from "../../lessons/constants";
import { buildDiplomaPdfMerged } from "../../diplomas/build-diploma-pdf";
import { diplomaFormSchema, type DiplomaFormValues } from "../../diplomas/diploma-schema";
import type { DiplomaTextLayout } from "../../diplomas/diploma-layout";
import { loadDiplomaPdfFonts } from "../../diplomas/load-diploma-font";

const MAX_CUSTOM_PDF_BYTES = 15 * 1024 * 1024;
const MAX_NIVO_LINE_OVERRIDE_CHARS = 200;

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type BaseDiplomaGeneratePanelProps = {
  communityId: string;
  textLayout: DiplomaTextLayout;
  /** Resolved template bytes (custom from API or default asset) */
  templateBytes: ArrayBuffer | null;
  defaultImamLineFromSettings: string;
  templateLoading: boolean;
  /** When false, children list is not fetched (e.g. drawer closed). */
  active: boolean;
  /** Called after a successful PDF download. */
  onGenerateComplete?: () => void;
};

type DialogLayoutProps = BaseDiplomaGeneratePanelProps & {
  dialogLayout: true;
  onCancel: () => void;
};

type InlineLayoutProps = BaseDiplomaGeneratePanelProps & {
  dialogLayout?: false;
  /** Omit title/intro when the parent already shows them. */
  hideIntro?: boolean;
};

type Props = DialogLayoutProps | InlineLayoutProps;

export function CommunityDiplomaGeneratePanel(props: Props) {
  const {
    communityId,
    textLayout,
    templateBytes,
    defaultImamLineFromSettings,
    templateLoading,
    active,
    onGenerateComplete,
  } = props;
  const dialogLayout = props.dialogLayout === true;
  const onCancel = dialogLayout ? props.onCancel : undefined;
  const hideIntro = !dialogLayout && (props.hideIntro ?? false);
  const { t } = useTranslation();
  const { session } = useSession();
  const [nivoFilter, setNivoFilter] = useState<number | undefined>(undefined);
  const [nivoLineOverride, setNivoLineOverride] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [imamLine, setImamLine] = useState("");
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const candidates = useChildrenDiplomaCandidatesQuery(active, nivoFilter);

  const form = useForm<DiplomaFormValues>({
    defaultValues: { ceremonyDate: isoDateLocal(new Date()) },
  });
  const { reset: resetForm, clearErrors, register, handleSubmit, formState, setError, getValues } = form;
  const ceremonyDateRegister = register("ceremonyDate");

  const items = useMemo(() => {
    const raw = candidates.data?.items ?? [];
    if (session?.user.role === ROLE.SUPER_ADMIN) {
      return raw.filter((c) => c.communityId === communityId);
    }
    return raw;
  }, [candidates.data?.items, communityId, session?.user.role]);

  const totalFromApi = candidates.data?.total ?? 0;

  useEffect(() => {
    if (!active) return;
    resetForm({ ceremonyDate: isoDateLocal(new Date()) });
    setNivoFilter(undefined);
    setNivoLineOverride("");
    setSelectedIds(new Set());
    setImamLine(defaultImamLineFromSettings);
    setSelectionError(null);
  }, [active, communityId, defaultImamLineFromSettings, resetForm]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectionError(null);
    setNivoLineOverride("");
  }, [nivoFilter]);

  const allVisibleSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((c) => selectedIds.has(c.id));
  }, [items, selectedIds]);

  const toggleAllVisible = () => {
    if (items.length === 0) return;
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(items.map((c) => c.id)));
    setSelectionError(null);
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectionError(null);
  };

  const onSubmit = handleSubmit(async () => {
    setSelectionError(null);
    const parsed = diplomaFormSchema.safeParse(getValues());
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.ceremonyDate?.[0];
      if (msg) setError("ceremonyDate", { type: "manual", message: msg });
      return;
    }
    const values = parsed.data;
    const selectedChildren = items.filter((c) => selectedIds.has(c.id));
    if (selectedChildren.length === 0) {
      setSelectionError(t("diplomaSelectChildrenError"));
      return;
    }

    try {
      if (!templateBytes || templateLoading) {
        toast.error(t("communityDiplomaTemplateNotReady"));
        return;
      }
      const tpl = copyArrayBufferToUint8(templateBytes);
      if (tpl.byteLength > MAX_CUSTOM_PDF_BYTES) {
        toast.error(t("diplomaTemplateTooLarge"));
        return;
      }

      let bodyFontBytes: Uint8Array;
      let nameScriptFontBytes: Uint8Array | null;
      try {
        const fonts = await loadDiplomaPdfFonts(textLayout);
        bodyFontBytes = fonts.bodyFontBytes;
        nameScriptFontBytes = fonts.nameScriptFontBytes;
      } catch {
        toast.error(t("diplomaFontMissing"));
        return;
      }

      const [yy, mm, dd] = values.ceremonyDate.split("-").map(Number);
      const ceremonyDateText = formatDate(new Date(yy, mm - 1, dd));

      setGenerating(true);
      const pdfBytes = await buildDiplomaPdfMerged({
        templateBytes: tpl,
        fontBytes: bodyFontBytes,
        nameScriptFontBytes,
        children: selectedChildren.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          nivo: c.nivo,
        })),
        ceremonyDateText,
        imamLine: imamLine.trim() || null,
        nivoLineOverride:
          nivoFilter !== undefined && nivoLineOverride.trim() ? nivoLineOverride.trim() : null,
        textLayout,
      });

      downloadPdf(pdfBytes, `mekteb-diplomas-${values.ceremonyDate}.pdf`);
      toast.success(t("diplomaDownloadReady"));
      onGenerateComplete?.();
    } catch (e) {
      console.error(e);
      toast.error(t("diplomaGenerateFailed"));
    } finally {
      setGenerating(false);
    }
  });

  const submitDisabled =
    generating || candidates.isLoading || !!candidates.isError || templateLoading || !templateBytes;

  const formFields = (
    <>
        <div className="space-y-1.5">
          <label htmlFor="community-diploma-nivo" className="text-sm font-medium text-slate-800">
            {t("diplomaNivoFilterLabel")}
          </label>
          <select
            id="community-diploma-nivo"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={nivoFilter === undefined ? "" : String(nivoFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setNivoFilter(v === "" ? undefined : Number(v));
            }}
          >
            <option value="">{t("diplomaNivoFilterAll")}</option>
            {LESSON_NIVO_ORDER.map((nivo) => (
              <option key={nivo} value={String(nivo)}>
                {LESSON_NIVO_LABEL[nivo]}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{t("diplomaNivoFilterHint")}</p>
        </div>

        {nivoFilter !== undefined ? (
          <div className="space-y-1.5">
            <label htmlFor="community-diploma-nivo-line" className="text-sm font-medium text-slate-800">
              {t("diplomaNivoLineOverrideLabel")}
            </label>
            <Input
              id="community-diploma-nivo-line"
              type="text"
              value={nivoLineOverride}
              onChange={(e) => setNivoLineOverride(e.target.value.slice(0, MAX_NIVO_LINE_OVERRIDE_CHARS))}
              placeholder={t("diplomaNivoLineOverridePlaceholder")}
              disabled={generating}
              className="w-full"
              maxLength={MAX_NIVO_LINE_OVERRIDE_CHARS}
            />
            <p className="text-xs text-slate-500">{t("diplomaNivoLineOverrideHint")}</p>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="community-diploma-date" className="text-sm font-medium text-slate-800">
            {t("diplomaCeremonyDateLabel")}
          </label>
          <input
            id="community-diploma-date"
            type="date"
            disabled={generating}
            className={cn("w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-ring")}
            {...ceremonyDateRegister}
            onChange={(e) => {
              clearErrors("ceremonyDate");
              ceremonyDateRegister.onChange(e);
            }}
          />
          {formState.errors.ceremonyDate ? (
            <p className="text-xs text-red-600">{formState.errors.ceremonyDate.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="community-diploma-imam" className="text-sm font-medium text-slate-800">
            {t("diplomaImamLineLabel")}
          </label>
          <Input
            id="community-diploma-imam"
            type="text"
            value={imamLine}
            onChange={(e) => setImamLine(e.target.value)}
            placeholder={t("diplomaImamLinePlaceholder")}
            disabled={generating}
            className="w-full"
          />
          <p className="text-xs text-slate-500">{t("communityDiplomaImamLineHint")}</p>
        </div>

        {candidates.isLoading ? (
          <p className="text-sm text-slate-600">{t("diplomaLoadingChildren")}</p>
        ) : candidates.isError ? (
          <p className="text-sm text-red-600">{t("diplomaLoadChildrenFailed")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">
                {t("diplomaPickChildren", { count: items.length, total: totalFromApi })}
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 text-xs"
                onClick={toggleAllVisible}
                disabled={items.length === 0}
              >
                {allVisibleSelected ? t("diplomaDeselectAll") : t("diplomaSelectAllVisible")}
              </Button>
            </div>
            {session?.user.role === ROLE.SUPER_ADMIN && totalFromApi > items.length ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {t("communityDiplomaSuperAdminScopeHint")}
              </p>
            ) : null}
            {totalFromApi > 100 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {t("diplomaListTruncatedHint")}
              </p>
            ) : null}
            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border p-3">
              {items.map((child) => (
                <DiplomaChildRow
                  key={child.id}
                  child={child}
                  checked={selectedIds.has(child.id)}
                  onToggle={() => toggleOne(child.id)}
                  nivoLinePreview={
                    nivoFilter !== undefined && nivoLineOverride.trim() ? nivoLineOverride.trim() : null
                  }
                />
              ))}
              {items.length === 0 ? <li className="text-sm text-slate-500">{t("diplomaNoActiveChildren")}</li> : null}
            </ul>
            {selectionError ? <p className="text-xs text-red-600">{selectionError}</p> : null}
          </>
        )}
    </>
  );

  if (dialogLayout) {
    return (
      <form onSubmit={onSubmit}>
        <DialogHeader>
          <DialogTitle>{t("communityDiplomaGeneratorDialogTitle")}</DialogTitle>
          <p className="mt-1 text-sm text-slate-600">{t("communityDiplomaGeneratorDialogIntro")}</p>
        </DialogHeader>
        <DialogBody className="space-y-4">{formFields}</DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={submitDisabled}>
            {generating ? t("diplomaGenerating") : t("diplomaGenerateDownload")}
          </Button>
        </DialogFooter>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {hideIntro ? null : (
        <>
          <h3 className="text-base font-semibold text-slate-900">{t("communityDiplomaGenerateTitle")}</h3>
          <p className="text-sm text-slate-600">{t("communityDiplomaGenerateIntro")}</p>
        </>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        {formFields}
        <Button type="submit" disabled={submitDisabled}>
          {generating ? t("diplomaGenerating") : t("diplomaGenerateDownload")}
        </Button>
      </form>
    </div>
  );
}

function DiplomaChildRow({
  child,
  checked,
  onToggle,
  nivoLinePreview,
}: {
  child: ChildRecord;
  checked: boolean;
  onToggle: () => void;
  /** When set, shown instead of the default nivo label (matches PDF when override is used). */
  nivoLinePreview?: string | null;
}) {
  const label = `${child.firstName} ${child.lastName}`.trim();
  const nivoLabel =
    nivoLinePreview ??
    LESSON_NIVO_LABEL[child.nivo as LessonNivo] ??
    `Nivo ${child.nivo}`;
  return (
    <li className="flex items-start gap-3">
      <Checkbox id={`cd-diploma-child-${child.id}`} checked={checked} onCheckedChange={() => onToggle()} className="mt-0.5" />
      <label htmlFor={`cd-diploma-child-${child.id}`} className="min-w-0 flex-1 cursor-pointer text-sm leading-snug text-slate-800">
        <span className="font-medium">{label}</span>
        <span className="text-slate-500"> — {nivoLabel}</span>
      </label>
    </li>
  );
}
