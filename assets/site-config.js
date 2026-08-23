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

  /* ---- DJ Set sessions (/dj-set/) --------------------------------------
   * QR destination on the printed card handed to venue owners.
   *
   * djSetFormUrl is EMPTY on purpose. None of the forms already configured on
   * this site is the right destination for these leads: Tour Updates is a
   * mailing-list signup and Media Request is a press enquiry, so routing a
   * venue collaboration into either would file it into the wrong GoHighLevel
   * workflow and it would quietly go unanswered. No form id was invented to
   * fill the gap.
   *
   * While it is empty, assets/forms.js removes the loading line and the static
   * Text/Call panel on the page is the working route — the same behaviour every
   * other unconfigured form on this site has. Set this to a real
   *     https://api.leadconnectorhq.com/widget/form/<FORM_ID>
   * once a "record a set at my place" form exists, and the page picks it up
   * with no markup change. Suggested fields: name, business, city, phone or
   * Instagram, optional message.
   */
  djSetFormUrl: "",
  djSetFormTitle: "DJ Agu Ocha session request form",
  djSetFormName: "DJ Set Session",
  djSetFormMinHeight: 700,

  /* Hero session video for /dj-set/. Empty until a session has been filmed.
   * Accepts either a first-party path ("/media/session-01.mp4") or an https
   * YouTube URL; assets/dj-set.js validates it and only then draws a play
   * control. While empty the hero stays a still image and no dead play button
   * is rendered. */
  djSetHeroVideoUrl: "",

  /* Past sessions for the /dj-set/ grid. Each entry needs all three fields:
   *   { url: "<video url>", title: "Sunset rooftop set", poster: "/img/<file>.png" }
   * poster must be a first-party /img/ path. Entries missing any field are
   * skipped. While this is empty the page keeps its authored stills and the
   * "first location sessions are being filmed now" line. Do not add an entry
   * for a session that has not actually been recorded. */
  djSetSessions: [],

  /* ---- Shared contact routes ------------------------------------------- */
  // These are the site's only verified contact channels and are the fallback
  // for every unconfigured form above.
  phone: "+17622486242",
  phoneDisplay: "+1 (762) 248-6242"
};
