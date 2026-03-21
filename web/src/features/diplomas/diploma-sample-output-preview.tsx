import "../../lib/polyfills/map-get-or-insert-computed";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../lib/date-time";
import { LESSON_NIVO } from "../lessons/constants";
import { buildDiplomaPdfMerged } from "./build-diploma-pdf";
import type { DiplomaTextLayout } from "./diploma-layout";
import { loadDiplomaPdfFonts } from "./load-diploma-font";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const RENDER_SCALE = 1.35;
/** Fixed calendar date so ceremony line is stable and locale-formatted via formatDate */
const SAMPLE_CEREMONY_DATE = new Date(2025, 5, 15);
const DEBOUNCE_MS = 500;

type Props = {
  pdfBytes: ArrayBuffer | null;
  layout: DiplomaTextLayout;
};

export function DiplomaSampleOutputPreview({ pdfBytes, layout }: Props) {
  const { t, i18n } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const layoutKey = JSON.stringify(layout);

  useEffect(() => {
    if (!pdfBytes) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        const canvas = canvasRef.current;
        if (!canvas) {
          setLoading(false);
          return;
        }
        try {
          let bodyFontBytes: Uint8Array;
          let nameScriptFontBytes: Uint8Array | null;
          try {
            const fonts = await loadDiplomaPdfFonts(layout);
            bodyFontBytes = fonts.bodyFontBytes;
            nameScriptFontBytes = fonts.nameScriptFontBytes;
          } catch {
            setError(t("diplomaFontMissing"));
            return;
          }
          const templateBytes = new Uint8Array(pdfBytes.byteLength);
          templateBytes.set(new Uint8Array(pdfBytes));

          const merged = await buildDiplomaPdfMerged({
            templateBytes,
            fontBytes: bodyFontBytes,
            nameScriptFontBytes,
            children: [
              {
                firstName: t("diplomaPreviewSampleFirstName"),
                lastName: t("diplomaPreviewSampleLastName"),
                nivo: LESSON_NIVO.Second,
              },
            ],
            ceremonyDateText: formatDate(SAMPLE_CEREMONY_DATE),
            imamLine: t("diplomaPreviewSampleImam"),
            textLayout: layout,
          });

          if (cancelled) return;

          const pdf = await getDocument({ data: merged.slice() }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setError(t("diplomaPreviewNoCanvas"));
            return;
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        } catch (e) {
          console.error(e);
          if (!cancelled) setError(t("diplomaPreviewSampleError"));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pdfBytes, layoutKey, t, i18n.language]);

  if (!pdfBytes) return null;

  return (
    <div className="min-w-0 space-y-2 border-t border-border pt-5">
      <p className="text-sm font-medium text-slate-800">{t("diplomaPreviewSampleTitle")}</p>
      <p className="text-xs text-slate-500">{t("diplomaPreviewSampleHint")}</p>
      {loading ? <p className="text-sm text-slate-500">{t("diplomaPreviewSampleLoading")}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="overflow-x-auto rounded-md border border-border bg-slate-100 p-2">
        <canvas
          ref={canvasRef}
          className="mx-auto max-h-[min(50vh,560px)] w-auto cursor-default bg-white shadow"
          aria-label={t("diplomaPreviewSampleTitle")}
        />
      </div>
    </div>
  );
}
