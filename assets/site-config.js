/*
 * Agu Ocha — public site configuration.
 *
 * Everything here is PUBLIC. This file is served verbatim from GitHub Pages to
 * every visitor. Never put an API key, access token, private webhook URL, or
 * any other secret in it. Only public embed URLs and display values belong here.
 *
 * Separate from assets/suno-vibez-config.js on purpose: that file is the Submit
 * Music campaign configuration and is deliberately left untouched.
 *
 * ---------------------------------------------------------------------------
 * FORM URLS — see docs/GHL_OPERATOR_ACTIONS.md
 *
 * Both GoHighLevel form URLs below are configured. Expected shape (the last
 * path segment is the form ID):
 *     https://api.leadconnectorhq.com/widget/form/<FORM_ID>
 *
 * assets/forms.js validates every value before embedding: https only, an
 * allowlisted LeadConnector host, a /widget/form/ path, and a non-empty form
 * id. A /widget/booking/ URL is a calendar and is rejected on purpose. If a
 * value is ever emptied or fails validation the page silently falls back to its
 * static contact panel — never a broken frame, never an error, never
 * placeholder text.
 *
 * Configuring a URL here is NOT confirmation that the form's fields, consent
 * text, workflows, notifications or redirect are correct inside GoHighLevel.
 * Those remain operator checks.
 * ---------------------------------------------------------------------------
 */
window.AGU_SITE_CONFIG = {
  /* ---- Tour & Appearances updates form (tour.html) --------------------- */
  // GoHighLevel form VH5umJecHaUdTesROA21. Supplied by the operator 2026-07-30.
  tourUpdatesFormUrl:
    "https://api.leadconnectorhq.com/widget/form/VH5umJecHaUdTesROA21",
  tourUpdatesFormTitle: "DJ Agu Ocha tour updates signup form",
  tourUpdatesFormName: "Tour Updates",
  // Height reservation only. form_embed.js resizes the frame once it attaches;
  // this stops a failed resize from collapsing the frame to the 150px default.
  tourUpdatesFormMinHeight: 700,

  /* ---- Media & Press request form (media.html) -------------------------- */
  // GoHighLevel form jqVlv3qxUCz06vUEHVMk. Supplied by the operator 2026-07-30.
  mediaRequestFormUrl:
    "https://api.leadconnectorhq.com/widget/form/jqVlv3qxUCz06vUEHVMk",
  mediaRequestFormTitle: "DJ Agu Ocha media and press request form",
  mediaRequestFormName: "Media Request",
  mediaRequestFormMinHeight: 900,

  /* ---- Shared contact routes ------------------------------------------- */
  // These are the site's only verified contact channels and are the fallback
  // for every unconfigured form above.
  phone: "+17622486242",
  phoneDisplay: "+1 (762) 248-6242"
};
