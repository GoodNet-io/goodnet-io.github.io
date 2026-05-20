import { defineConfig } from "vite";

// Org-level GitHub Pages serves the repo `<org>.github.io` at the root,
// so `base: "/"` is correct.
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
    cssMinify: true,
    minify: "esbuild",
  },
});
