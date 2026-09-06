import { defineConfig, fontProviders } from "astro/config";

// Served from GitHub Pages at the custom domain in public/CNAME; DNS lives at
// Marque and points the apex and www at anucybernetics.github.io.
//
// Astro 7 runs on Vite 8 (Rolldown-powered). We opt into Lightning CSS for both
// transform and minification — faster, and it handles nesting/autoprefixing
// natively so the source CSS can stay modern.
//
// Fonts are fetched at build time and self-hosted; Astro also generates
// metric-matched fallback faces so text set in the system fallback occupies the
// same space as the web font and nothing shifts when it swaps in.
export default defineConfig({
  site: "https://worlduniversityindex.org",
  trailingSlash: "ignore",
  build: { format: "directory" },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Archivo",
      cssVariable: "--font-archivo",
      weights: ["400 700"],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["Helvetica Neue", "Arial", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Archivo Narrow",
      cssVariable: "--font-archivo-narrow",
      weights: ["500 700"],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["Arial Narrow", "Helvetica Neue", "Arial", "sans-serif"],
    },
  ],
  vite: {
    css: { transformer: "lightningcss" },
    build: { cssMinify: "lightningcss" },
  },
});
