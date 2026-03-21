import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import type { LessonNivo } from "../lessons/constants";
import { LESSON_NIVO_LABEL } from "../lessons/constants";
import {
  DIPLOMA_TEXT_LAYOUT,
  type DiplomaTextLayout,
  computeDiplomaTextPositions,
  resolveDiplomaTextX,
} from "./diploma-layout";
import { DIPLOMA_NAME_FONT_STYLE } from "./diploma-name-font";

export type DiplomaPdfChild = {
  firstName: string;
  lastName: string;
  nivo: number;
};

function nivoDisplayLabel(nivo: number): string {
  return LESSON_NIVO_LABEL[nivo as LessonNivo] ?? `Nivo ${nivo}`;
}

function resolveNivoLineText(childNivo: number, override: string | null | undefined): string {
  const trimmed = override?.trim();
  if (trimmed) return trimmed;
  return nivoDisplayLabel(childNivo);
}

export async function buildDiplomaPdfMerged(params: {
  templateBytes: Uint8Array;
  fontBytes: Uint8Array;
  nameScriptFontBytes?: Uint8Array | null;
  children: DiplomaPdfChild[];
  ceremonyDateText: string;
  imamLine?: string | null;
  nivoLineOverride?: string | null;
  textLayout?: DiplomaTextLayout;
}): Promise<Uint8Array> {
  const {
    templateBytes,
    fontBytes,
    nameScriptFontBytes,
    children,
    ceremonyDateText,
    imamLine,
    nivoLineOverride,
    textLayout = DIPLOMA_TEXT_LAYOUT,
  } = params;
  if (children.length === 0) {
    throw new Error("No children selected");
  }

  const templateDoc = await PDFDocument.load(templateBytes);
  if (templateDoc.getPageCount() < 1) {
    throw new Error("Template PDF has no pages");
  }

  const out = await PDFDocument.create();
  out.registerFontkit(fontkit);
  const bodyFont = await out.embedFont(fontBytes);
  let nameFont = bodyFont;
  if (
    textLayout.nameFontStyle === DIPLOMA_NAME_FONT_STYLE.SCRIPT &&
    nameScriptFontBytes &&
    nameScriptFontBytes.byteLength > 0
  ) {
    try {
      nameFont = await out.embedFont(nameScriptFontBytes);
    } catch {
      nameFont = bodyFont;
    }
  }

  const templatePageIndex = 0;

  for (const child of children) {
    const [embedded] = await out.copyPages(templateDoc, [templatePageIndex]);
    out.addPage(embedded);
    const page = out.getPage(out.getPageCount() - 1);
    const { width } = page.getSize();

    const fullName = `${child.firstName} ${child.lastName}`.trim();
    const nivoText = resolveNivoLineText(child.nivo, nivoLineOverride);

    const { nameY, nivoY, dateY, imamY, nameSize, nivoSize, dateSize, imamSize } =
      computeDiplomaTextPositions(textLayout);

    const nameWidth = nameFont.widthOfTextAtSize(fullName, nameSize);
    page.drawText(fullName, {
      x: resolveDiplomaTextX(textLayout, "name", width, nameWidth),
      y: nameY,
      size: nameSize,
      font: nameFont,
      color: rgb(textLayout.nameColor.r, textLayout.nameColor.g, textLayout.nameColor.b),
    });

    const nivoWidth = bodyFont.widthOfTextAtSize(nivoText, nivoSize);
    page.drawText(nivoText, {
      x: resolveDiplomaTextX(textLayout, "nivo", width, nivoWidth),
      y: nivoY,
      size: nivoSize,
      font: bodyFont,
      color: rgb(textLayout.nivoColor.r, textLayout.nivoColor.g, textLayout.nivoColor.b),
    });

    const dateWidth = bodyFont.widthOfTextAtSize(ceremonyDateText, dateSize);
    page.drawText(ceremonyDateText, {
      x: resolveDiplomaTextX(textLayout, "date", width, dateWidth),
      y: dateY,
      size: dateSize,
      font: bodyFont,
      color: rgb(textLayout.dateColor.r, textLayout.dateColor.g, textLayout.dateColor.b),
    });

    const imamText = imamLine?.trim();
    if (imamText) {
      const imamWidth = bodyFont.widthOfTextAtSize(imamText, imamSize);
      page.drawText(imamText, {
        x: resolveDiplomaTextX(textLayout, "imam", width, imamWidth),
        y: imamY,
        size: imamSize,
        font: bodyFont,
        color: rgb(textLayout.imamColor.r, textLayout.imamColor.g, textLayout.imamColor.b),
      });
    }
  }

  return out.save();
}
