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

export function clickToPdfXFromLeft(clientX: number, canvas: HTMLCanvasElement, pdfPageWidthPt: number): number {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const cx = (clientX - rect.left) * scaleX;
  const clampedX = Math.min(Math.max(0, cx), canvas.width);
  return Math.round((clampedX / canvas.width) * pdfPageWidthPt);
}
