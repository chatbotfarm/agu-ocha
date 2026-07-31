/**
 * Tailwind configuration for aguocha.com.
 *
 * Tailwind 3.x is used deliberately: the site previously ran on
 * https://cdn.tailwindcss.com (the Play CDN), which serves Tailwind 3 and
 * includes preflight. Matching the major version keeps the compiled output
 * visually identical to what was already deployed, rather than turning a
 * production-warning fix into an unintended redesign.
 *
 * GitHub Pages does not run npm, so ./assets/tailwind.css is COMMITTED and
 * served directly. Rebuild it with `npm run build:css` after changing markup.
 */
module.exports = {
  content: [
    "./*.html",
    "./suno-vibez/*.html",
    "./assets/**/*.js"
  ],

  /*
   * Classes assembled in JavaScript are picked up by scanning ./assets/**\/*.js
   * above, because every one is written as a complete literal string rather
   * than concatenated. These few are safelisted because they are toggled by
   * classList rather than appearing as a full class attribute anywhere:
   * a narrow, explicit list — never a wildcard pattern.
   */
  safelist: [
    "hidden",
    "bk-frame",
    "bk-selected",
    "bk-embed",
    "bk-status"
  ],

  theme: {
    extend: {}
  },

  plugins: []
};
