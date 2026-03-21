import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function isPdfjsWorkerUrlAsset(names: readonly string[] | undefined): boolean {
  return Boolean(
    names?.some((n) => {
      const s = String(n);
      return s.includes("pdf.worker") && s.endsWith(".mjs");
    })
  );
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        assetFileNames(assetInfo) {
          if (isPdfjsWorkerUrlAsset(assetInfo.names)) {
            return "assets/pdf.worker-[hash].js";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
