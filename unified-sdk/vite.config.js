import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import scopeStyles from "./build/scope-styles.mjs";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: { postcss: { plugins: [scopeStyles()] } },
  resolve: {
    dedupe: ["react", "react-dom", "motion", "clsx", "tailwind-merge", "@hugeicons/react", "@hugeicons/core-free-icons"],
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.jsx"),
      name: "UnifiedSDK",
      fileName: (format) => `unified-sdk.${format}.${format === "umd" ? "cjs" : "js"}`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: [/^react(?:\/.*)?$/, /^react-dom(?:\/.*)?$/],
      output: {
        banner: '"use client";',
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "unified-sdk.css";
          return assetInfo.name;
        },
      },
    },
    cssCodeSplit: false,
  },
});
