import { defineConfig } from "astro/config";

// Served from GitHub Pages at the custom domain in public/CNAME; DNS lives at
// Marque and points the apex and www at anucybernetics.github.io.
//
// Astro 7 runs on Vite 8 (Rolldown-powered). We opt into Lightning CSS for both
// transform and minification — faster, and it handles nesting/autoprefixing
// natively so the source CSS can stay modern.
export default defineConfig({
  site: "https://worlduniversityindex.org",
  trailingSlash: "ignore",
  build: { format: "directory" },
  vite: {
    css: { transformer: "lightningcss" },
    build: { cssMinify: "lightningcss" },
  },
});
