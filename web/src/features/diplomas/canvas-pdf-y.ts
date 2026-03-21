/**
 * Map a click on a canvas that displays a PDF page to a baseline Y in PDF space
 * (distance from bottom of page, points). pdf-lib uses the same convention.
 */
export function clickToPdfBaselineFromBottom(
  _clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  pdfPageHeightPt: number
): number {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  const cy = (clientY - rect.top) * scaleY;
  const clampedY = Math.min(Math.max(0, cy), canvas.height);
  const yFromTopPt = (clampedY / canvas.height) * pdfPageHeightPt;
  return Math.round(pdfPageHeightPt - yFromTopPt);
}

/** Map click X to PDF points from the left edge of the page (same convention as pdf-lib drawText x). */
export function clickToPdfXFromLeft(clientX: number, canvas: HTMLCanvasElement, pdfPageWidthPt: number): number {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const cx = (clientX - rect.left) * scaleX;
  const clampedX = Math.min(Math.max(0, cx), canvas.width);
  return Math.round((clampedX / canvas.width) * pdfPageWidthPt);
}
