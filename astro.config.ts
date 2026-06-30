import { defineConfig } from "astro/config";

// Served from GitHub Pages under the anucybernetics org. When a custom domain
// is configured, drop `base` and update `site`.
//
// Astro 7 runs on Vite 8 (Rolldown-powered). We opt into Lightning CSS for both
// transform and minification — faster, and it handles nesting/autoprefixing
// natively so the source CSS can stay modern.
export default defineConfig({
  site: "https://anucybernetics.github.io",
  base: "/university-rankings",
  trailingSlash: "ignore",
  build: { format: "directory" },
  vite: {
    css: { transformer: "lightningcss" },
    build: { cssMinify: "lightningcss" },
  },
});
