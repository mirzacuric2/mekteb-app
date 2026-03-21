import "../../lib/polyfills/map-get-or-insert-computed";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { DiplomaTemplateFileInput } from "./diploma-template-file-input";
import { copyArrayBufferToUint8 } from "../../lib/array-buffer";
import { clickToPdfBaselineFromBottom, clickToPdfXFromLeft } from "./canvas-pdf-y";
import type { DiplomaTextLayout } from "./diploma-layout";
import { diplomaLayoutToTsSnippet } from "./diploma-layout-snippet";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const RENDER_SCALE = 1.35;

type FieldKey = "name" | "nivo" | "date" | "imam";

export type DiplomaTemplatePreviewProps = {
  layout: DiplomaTextLayout;
  onLayoutChange: (next: DiplomaTextLayout) => void;
  pdfBytes: ArrayBuffer | null;
  onPickLocalPdf?: (file: File) => void;
  showCopySnippet?: boolean;
};

export function DiplomaTemplatePreview({
  layout,
  onLayoutChange,
  pdfBytes,
  onPickLocalPdf,
  showCopySnippet = false,
}: DiplomaTemplatePreviewProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeField, setActiveField] = useState<FieldKey>("name");
  const [pdfSizePt, setPdfSizePt] = useState<{ w: number; h: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const renderPdfBytes = useCallback(
    async (data: ArrayBuffer) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setLoadingPdf(true);
      setLoadError(null);
      try {
        // pdf.js may detach the buffer it receives; never pass the shared query/cache buffer.
        const pdf = await getDocument({ data: copyArrayBufferToUint8(data) }).promise;
        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        setPdfSizePt({ w: baseViewport.width, h: baseViewport.height });

        const viewport = page.getViewport({ scale: RENDER_SCALE });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setLoadError(t("diplomaPreviewNoCanvas"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (e) {
        console.error(e);
        setLoadError(t("diplomaPreviewRenderFailed"));
      } finally {
        setLoadingPdf(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (!pdfBytes) return;
    void renderPdfBytes(pdfBytes);
  }, [pdfBytes, renderPdfBytes]);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfSizePt) return;
    const xLeft = clickToPdfXFromLeft(e.clientX, canvas, pdfSizePt.w);
    const yBottom = clickToPdfBaselineFromBottom(e.clientX, e.clientY, canvas, pdfSizePt.h);
    const next = { ...layout };
    if (activeField === "name") {
      next.nameBaselineFromBottomPt = yBottom;
      next.nameXFromLeftPt = xLeft;
    }
    if (activeField === "nivo") {
      next.nivoBaselineFromBottomPt = yBottom;
      next.nivoXFromLeftPt = xLeft;
    }
    if (activeField === "date") {
      next.dateBaselineFromBottomPt = yBottom;
      next.dateXFromLeftPt = xLeft;
    }
    if (activeField === "imam") {
      next.imamBaselineFromBottomPt = yBottom;
      next.imamXFromLeftPt = xLeft;
    }
    onLayoutChange(next);
  };

  const copySnippet = async () => {
    const text = diplomaLayoutToTsSnippet(layout);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("diplomaPreviewCopied"));
    } catch {
      toast.error(t("diplomaPreviewCopyFailed"));
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      {onPickLocalPdf ? (
        <div className="space-y-2">
          <DiplomaTemplateFileInput id="diploma-preview-pdf-local" onPick={onPickLocalPdf} />
          {loadingPdf ? <p className="text-sm text-slate-500">{t("diplomaPreviewLoadingPdf")}</p> : null}
          {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
        </div>
      ) : (
        <>
          {loadingPdf ? <span className="text-sm text-slate-500">{t("diplomaPreviewLoadingPdf")}</span> : null}
          {loadError ? <span className="text-sm text-red-600">{loadError}</span> : null}
        </>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">{t("diplomaPreviewPickField")}</p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["name", t("diplomaPreviewFieldName")],
              ["nivo", t("diplomaPreviewFieldNivo")],
              ["date", t("diplomaPreviewFieldDate")],
              ["imam", t("diplomaPreviewFieldImam")],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant={activeField === key ? "default" : "outline"}
              className="text-sm"
              onClick={() => setActiveField(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-slate-500">{t("diplomaPreviewClickHint")}</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-slate-100 p-2">
        <canvas
          ref={canvasRef}
          className="mx-auto max-h-[min(60vh,720px)] w-auto cursor-crosshair bg-white shadow"
          onClick={onCanvasClick}
        />
      </div>

      {pdfSizePt ? (
        <p className="text-xs text-slate-500">
          {t("diplomaPreviewPageSize", { w: Math.round(pdfSizePt.w), h: Math.round(pdfSizePt.h) })}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FieldCoordCard title={t("diplomaPreviewFieldName")}>
          <XFromLeftInput
            label={t("diplomaPreviewXLeft")}
            unitHint={t("diplomaPreviewPtFromLeft")}
            placeholder={t("diplomaPreviewXCenteredPlaceholder")}
            value={layout.nameXFromLeftPt}
            onChange={(v) => onLayoutChange({ ...layout, nameXFromLeftPt: v })}
          />
          <BaselineInput
            label={t("diplomaPreviewYBaseline")}
            unitHint={t("diplomaPreviewPtFromBottom")}
            value={layout.nameBaselineFromBottomPt}
            onChange={(v) => onLayoutChange({ ...layout, nameBaselineFromBottomPt: v })}
          />
        </FieldCoordCard>
        <FieldCoordCard title={t("diplomaPreviewFieldNivo")}>
          <XFromLeftInput
            label={t("diplomaPreviewXLeft")}
            unitHint={t("diplomaPreviewPtFromLeft")}
            placeholder={t("diplomaPreviewXCenteredPlaceholder")}
            value={layout.nivoXFromLeftPt}
            onChange={(v) => onLayoutChange({ ...layout, nivoXFromLeftPt: v })}
          />
          <BaselineInput
            label={t("diplomaPreviewYBaseline")}
            unitHint={t("diplomaPreviewPtFromBottom")}
            value={layout.nivoBaselineFromBottomPt}
            onChange={(v) => onLayoutChange({ ...layout, nivoBaselineFromBottomPt: v })}
          />
        </FieldCoordCard>
        <FieldCoordCard title={t("diplomaPreviewFieldDate")}>
          <XFromLeftInput
            label={t("diplomaPreviewXLeft")}
            unitHint={t("diplomaPreviewPtFromLeft")}
            placeholder={t("diplomaPreviewXCenteredPlaceholder")}
            value={layout.dateXFromLeftPt}
            onChange={(v) => onLayoutChange({ ...layout, dateXFromLeftPt: v })}
          />
          <BaselineInput
            label={t("diplomaPreviewYBaseline")}
            unitHint={t("diplomaPreviewPtFromBottom")}
            value={layout.dateBaselineFromBottomPt}
            onChange={(v) => onLayoutChange({ ...layout, dateBaselineFromBottomPt: v })}
          />
        </FieldCoordCard>
        <FieldCoordCard title={t("diplomaPreviewFieldImam")}>
          <XFromLeftInput
            label={t("diplomaPreviewXLeft")}
            unitHint={t("diplomaPreviewPtFromLeft")}
            placeholder={t("diplomaPreviewXCenteredPlaceholder")}
            value={layout.imamXFromLeftPt}
            onChange={(v) => onLayoutChange({ ...layout, imamXFromLeftPt: v })}
          />
          <BaselineInput
            label={t("diplomaPreviewYBaseline")}
            unitHint={t("diplomaPreviewPtFromBottom")}
            value={layout.imamBaselineFromBottomPt}
            onChange={(v) => onLayoutChange({ ...layout, imamBaselineFromBottomPt: v })}
          />
        </FieldCoordCard>
      </div>

      {showCopySnippet ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copySnippet}>
            {t("diplomaPreviewCopySnippet")}
          </Button>
          <p className="text-xs text-slate-500 sm:max-w-md">{t("diplomaPreviewSnippetHint")}</p>
        </div>
      ) : null}
    </div>
  );
}

function FieldCoordCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/60 p-2.5">
      <p className="text-xs font-semibold text-slate-800">{title}</p>
      <div className="grid grid-cols-1 gap-2">{children}</div>
    </div>
  );
}

function XFromLeftInput({
  label,
  unitHint,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  unitHint: string;
  placeholder: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-700">{label}</label>
      <Input
        type="number"
        inputMode="numeric"
        placeholder={placeholder}
        value={value != null && Number.isFinite(value) ? String(Math.round(value)) : ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") onChange(null);
          else {
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(Math.round(n));
          }
        }}
      />
      <p className="text-[11px] text-slate-400">{unitHint}</p>
    </div>
  );
}

function BaselineInput({
  label,
  unitHint,
  value,
  onChange,
}: {
  label: string;
  unitHint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-700">{label}</label>
      <Input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.round(n));
        }}
      />
      <p className="text-[11px] text-slate-400">{unitHint}</p>
    </div>
  );
}
