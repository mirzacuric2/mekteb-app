/**
 * pdfjs-dist 5.x calls `Map.prototype.getOrInsertComputed` (TC39 proposal); Safari and
 * older runtimes may not implement it yet. Safe to no-op when native exists.
 */
type MapWithPolyfill = Map<unknown, unknown> & {
  getOrInsertComputed?: (key: unknown, callback: () => unknown) => unknown;
};

export function ensureMapGetOrInsertComputed() {
  const proto = Map.prototype as unknown as MapWithPolyfill;
  if (typeof proto.getOrInsertComputed === "function") return;

  proto.getOrInsertComputed = function (this: Map<unknown, unknown>, key: unknown, callback: () => unknown) {
    if (this.has(key)) return this.get(key);
    const value = callback();
    this.set(key, value);
    return value;
  };
}

ensureMapGetOrInsertComputed();
