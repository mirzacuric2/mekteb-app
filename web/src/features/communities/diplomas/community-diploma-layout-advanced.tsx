import { useTranslation } from "react-i18next";
import { Input } from "../../../components/ui/input";
import type { DiplomaRgb, DiplomaTextLayout } from "../../diplomas/diploma-layout";
import { DIPLOMA_NAME_FONT_STYLE, type DiplomaNameFontStyle } from "../../diplomas/diploma-name-font";

type Props = {
  layout: DiplomaTextLayout;
  onLayoutChange: (next: DiplomaTextLayout) => void;
};

const diplomaAdvancedSelectPairsGridClass =
  "grid w-full grid-cols-1 gap-y-2 gap-x-0 sm:grid-cols-[max-content_18rem] sm:items-center sm:gap-x-3 sm:gap-y-2 sm:justify-start";

const diplomaAdvancedSelectClassName =
  "h-9 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm";

const diplomaAdvancedLabelClassName = "text-xs font-medium leading-snug text-slate-700";

export function CommunityDiplomaLayoutAdvanced({ layout, onLayoutChange }: Props) {
  const { t } = useTranslation();

  return (
    <details className="rounded-md border border-border bg-slate-50/80 p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-800">{t("communityDiplomaAdvancedToggle")}</summary>
      <div className="mt-2 space-y-3">
        <div>
          <div className={diplomaAdvancedSelectPairsGridClass}>
            <label className={diplomaAdvancedLabelClassName} htmlFor="cd-placement">
              {t("communityDiplomaPlacementMode")}
            </label>
            <select
              id="cd-placement"
              className={diplomaAdvancedSelectClassName}
              value={layout.placementMode}
              onChange={(e) =>
                onLayoutChange({ ...layout, placementMode: e.target.value as "stacked" | "absolute" })
              }
            >
              <option value="stacked">{t("communityDiplomaPlacementStacked")}</option>
              <option value="absolute">{t("communityDiplomaPlacementAbsolute")}</option>
            </select>
            <label className={diplomaAdvancedLabelClassName} htmlFor="cd-name-font">
              {t("communityDiplomaNameFontLabel")}
            </label>
            <select
              id="cd-name-font"
              className={diplomaAdvancedSelectClassName}
              value={layout.nameFontStyle}
              onChange={(e) =>
                onLayoutChange({ ...layout, nameFontStyle: e.target.value as DiplomaNameFontStyle })
              }
            >
              <option value={DIPLOMA_NAME_FONT_STYLE.SANS}>{t("communityDiplomaNameFontSans")}</option>
              <option value={DIPLOMA_NAME_FONT_STYLE.SCRIPT}>{t("communityDiplomaNameFontScript")}</option>
            </select>
          </div>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500">{t("communityDiplomaNameFontHint")}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumField
            label={t("communityDiplomaLineHeightFactor")}
            value={layout.lineHeightFactor}
            onChange={(v) => onLayoutChange({ ...layout, lineHeightFactor: v })}
            step={0.05}
          />
          <NumField
            label={t("communityDiplomaGapAfterName")}
            value={layout.gapAfterNamePt}
            onChange={(v) => onLayoutChange({ ...layout, gapAfterNamePt: v })}
          />
          <NumField
            label={t("communityDiplomaGapAfterNivo")}
            value={layout.gapAfterNivoPt}
            onChange={(v) => onLayoutChange({ ...layout, gapAfterNivoPt: v })}
          />
          <NumField
            label={t("communityDiplomaMinMargin")}
            value={layout.minSideMarginPt}
            onChange={(v) => onLayoutChange({ ...layout, minSideMarginPt: v })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumField
            label={t("communityDiplomaFontName")}
            value={layout.nameFontSize}
            onChange={(v) => onLayoutChange({ ...layout, nameFontSize: v })}
          />
          <NumField
            label={t("communityDiplomaFontNivo")}
            value={layout.nivoFontSize}
            onChange={(v) => onLayoutChange({ ...layout, nivoFontSize: v })}
          />
          <NumField
            label={t("communityDiplomaFontDate")}
            value={layout.dateFontSize}
            onChange={(v) => onLayoutChange({ ...layout, dateFontSize: v })}
          />
          <NumField
            label={t("communityDiplomaFontImam")}
            value={layout.imamFontSize}
            onChange={(v) => onLayoutChange({ ...layout, imamFontSize: v })}
          />
        </div>

        <RgbRow
          label={t("communityDiplomaColorName")}
          color={layout.nameColor}
          onChange={(c) => onLayoutChange({ ...layout, nameColor: c })}
        />
        <RgbRow
          label={t("communityDiplomaColorNivo")}
          color={layout.nivoColor}
          onChange={(c) => onLayoutChange({ ...layout, nivoColor: c })}
        />
        <RgbRow
          label={t("communityDiplomaColorDate")}
          color={layout.dateColor}
          onChange={(c) => onLayoutChange({ ...layout, dateColor: c })}
        />
        <RgbRow
          label={t("communityDiplomaColorImam")}
          color={layout.imamColor}
          onChange={(c) => onLayoutChange({ ...layout, imamColor: c })}
        />
      </div>
    </details>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-700">{label}</label>
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </div>
  );
}

function RgbRow({
  label,
  color,
  onChange,
}: {
  label: string;
  color: DiplomaRgb;
  onChange: (c: DiplomaRgb) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {(["r", "g", "b"] as const).map((ch) => (
          <div key={ch} className="flex items-center gap-1">
            <span className="text-[10px] uppercase text-slate-500">{ch}</span>
            <Input
              className="h-9 w-20"
              type="number"
              inputMode="decimal"
              step={0.01}
              min={0}
              max={1}
              value={Number.isFinite(color[ch]) ? String(color[ch]) : ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                onChange({ ...color, [ch]: Math.min(1, Math.max(0, n)) });
              }}
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">{t("communityDiplomaRgbHint")}</p>
    </div>
  );
}
