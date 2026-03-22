export function copyArrayBufferToUint8(src: ArrayBuffer): Uint8Array {
  const out = new Uint8Array(src.byteLength);
  out.set(new Uint8Array(src));
  return out;
}
