import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/diplomas/default.pdf");

const A4_W = 595.28;
const A4_H = 841.89;

const doc = await PDFDocument.create();
const page = doc.addPage([A4_W, A4_H]);
const titleFont = await doc.embedFont(StandardFonts.TimesRomanBold);
const bodyFont = await doc.embedFont(StandardFonts.TimesRoman);

const margin = 48;
page.drawRectangle({
  x: margin,
  y: margin,
  width: A4_W - margin * 2,
  height: A4_H - margin * 2,
  borderColor: rgb(0.72, 0.55, 0.2),
  borderWidth: 2.5,
});

const title = "Mekteb — diploma";
const titleSize = 22;
const tw = titleFont.widthOfTextAtSize(title, titleSize);
page.drawText(title, {
  x: (A4_W - tw) / 2,
  y: A4_H - margin - 72,
  size: titleSize,
  font: titleFont,
  color: rgb(0.15, 0.12, 0.08),
});

const subtitle = "Ime i prezime, nivo i datum dodjeljuju se automatski.";
const subSize = 11;
const sw = bodyFont.widthOfTextAtSize(subtitle, subSize);
page.drawText(subtitle, {
  x: (A4_W - sw) / 2,
  y: A4_H - margin - 98,
  size: subSize,
  font: bodyFont,
  color: rgb(0.35, 0.33, 0.3),
});

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, await doc.save());
console.log("Wrote", outPath);
