/** Copy bytes so consumers (e.g. pdf.js) can detach their buffer without neutering the original. */
export function copyArrayBufferToUint8(src: ArrayBuffer): Uint8Array {
  const out = new Uint8Array(src.byteLength);
  out.set(new Uint8Array(src));
  return out;
}
