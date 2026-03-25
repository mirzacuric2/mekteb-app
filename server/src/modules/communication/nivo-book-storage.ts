import path from "node:path";

const NIVO_BOOKS_SOURCE_DIR = path.resolve(process.cwd(), "prisma", "seed-assets", "nivo-books");

export const NIVO_BOOK_NIVOS = [1, 2, 3, 4, 5] as const;
export type NivoBookNivo = (typeof NIVO_BOOK_NIVOS)[number];

export function getNivoBookFileNameByNivo(nivo: number) {
  if (!NIVO_BOOK_NIVOS.includes(nivo as NivoBookNivo)) return null;
  return `Ilmihal ${nivo}.pdf`;
}

export function getNivoBookAbsolutePathByNivo(nivo: number) {
  const fileName = getNivoBookFileNameByNivo(nivo);
  if (!fileName) return null;
  return path.resolve(NIVO_BOOKS_SOURCE_DIR, fileName);
}
