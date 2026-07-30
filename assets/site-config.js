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
 * OPERATOR ACTION REQUIRED — see docs/GHL_OPERATOR_ACTIONS.md
 *
 * Two GoHighLevel form URLs are not yet available. Both are intentionally left
 * empty rather than guessed. While a value is empty the page renders a working
 * fallback panel with real contact routes — never a broken frame, never an
 * error, never placeholder text. Paste a valid URL and the form appears with no
 * other change to the page.
 *
 * Expected shape (the last path segment is the form ID):
 *     https://api.leadconnectorhq.com/widget/form/<FORM_ID>
 *
 * Anything that is not an https URL on an allowlisted LeadConnector host with a
 * /widget/form/ path is rejected by assets/forms.js and the fallback stays up.
 * ---------------------------------------------------------------------------
 */
window.AGU_SITE_CONFIG = {
  /* ---- Tour & Appearances updates form (tour.html) --------------------- */
  // OPERATOR: paste the Tour Updates GHL form URL here.
  tourUpdatesFormUrl: "",
  tourUpdatesFormTitle: "Tour updates signup form",
  tourUpdatesFormName: "Tour Updates",
  // Height reservation only. form_embed.js resizes the frame once it attaches;
  // this stops a failed resize from collapsing the frame to the 150px default.
  tourUpdatesFormMinHeight: 700,

  /* ---- Media & Press request form (media.html) -------------------------- */
  // OPERATOR: paste the Media Request GHL form URL here.
  mediaRequestFormUrl: "",
  mediaRequestFormTitle: "Media and press request form",
  mediaRequestFormName: "Media Request",
  mediaRequestFormMinHeight: 900,

  /* ---- Shared contact routes ------------------------------------------- */
  // These are the site's only verified contact channels and are the fallback
  // for every unconfigured form above.
  phone: "+17622486242",
  phoneDisplay: "+1 (762) 248-6242"
};
