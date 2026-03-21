import { DIPLOMA_NAME_FONT_STYLE, DIPLOMA_NAME_SCRIPT_FONT_PUBLIC_PATH } from "./diploma-name-font";
import type { DiplomaTextLayout } from "./diploma-layout";

const FONT_PATH = "/fonts/NotoSans-Regular.ttf";

let fontBytesPromise: Promise<Uint8Array> | null = null;
let nameScriptFontBytesPromise: Promise<Uint8Array> | null = null;

/** Single-flight fetch of the diploma PDF font; safe to call from multiple components. */
export function loadDiplomaFontBytes(): Promise<Uint8Array> {
  if (!fontBytesPromise) {
    const p = (async () => {
      const res = await fetch(FONT_PATH);
      if (!res.ok) throw new Error("DIPLOMA_FONT_FETCH_FAILED");
      return new Uint8Array(await res.arrayBuffer());
    })();
    fontBytesPromise = p.catch((err) => {
      fontBytesPromise = null;
      throw err;
    });
  }
  return fontBytesPromise;
}

/** Script/handwriting font used for the child name when `nameFontStyle === SCRIPT`. */
export function loadDiplomaNameScriptFontBytes(): Promise<Uint8Array> {
  if (!nameScriptFontBytesPromise) {
    const p = (async () => {
      const res = await fetch(DIPLOMA_NAME_SCRIPT_FONT_PUBLIC_PATH);
      if (!res.ok) throw new Error("DIPLOMA_NAME_SCRIPT_FONT_FETCH_FAILED");
      return new Uint8Array(await res.arrayBuffer());
    })();
    nameScriptFontBytesPromise = p.catch((err) => {
      nameScriptFontBytesPromise = null;
      throw err;
    });
  }
  return nameScriptFontBytesPromise;
}

/** Body font plus optional script bytes for name line (null if sans or fetch failed). */
export async function loadDiplomaPdfFonts(layout: Pick<DiplomaTextLayout, "nameFontStyle">): Promise<{
  bodyFontBytes: Uint8Array;
  nameScriptFontBytes: Uint8Array | null;
}> {
  const bodyFontBytes = await loadDiplomaFontBytes();
  if (layout.nameFontStyle !== DIPLOMA_NAME_FONT_STYLE.SCRIPT) {
    return { bodyFontBytes, nameScriptFontBytes: null };
  }
  try {
    const nameScriptFontBytes = await loadDiplomaNameScriptFontBytes();
    return { bodyFontBytes, nameScriptFontBytes };
  } catch {
    return { bodyFontBytes, nameScriptFontBytes: null };
  }
}
