// Stylelint runs as a semantic CSS linter here; oxfmt owns formatting.
//
// Limitation: the bulk of component styling lives in scoped <style> blocks in
// .astro files, which plain stylelint can't see without a customSyntax parser.
// This config lints plain CSS under src/ (global tokens and base styles); the
// scoped-style gap is accepted rather than wiring up postcss-html.
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // Too many false positives with modern CSS.
    "no-descending-specificity": null,
    // oxfmt-owned formatting concerns.
    "comment-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "value-keyword-case": null,
    "import-notation": null,
    // oklch hues written unitless in the token file.
    "hue-degree-notation": null,
    // -webkit-text-size-adjust is genuinely needed to stop mobile reflow.
    "property-no-vendor-prefix": null,
  },
};
