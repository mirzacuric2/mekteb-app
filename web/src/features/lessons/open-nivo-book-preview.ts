import { api } from "../../api";

const PREVIEW_URL_REVOKE_DELAY_MS = 60_000;

export async function openNivoBookPreview(nivo: number) {
  const response = await api.get(`/nivo-books/${nivo}/preview`, {
    responseType: "blob",
  });
  const contentType = typeof response.headers?.["content-type"] === "string"
    ? response.headers["content-type"]
    : "application/pdf";
  const blob = new Blob([response.data], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const previewWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!previewWindow) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Unable to open preview window");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), PREVIEW_URL_REVOKE_DELAY_MS);
}
