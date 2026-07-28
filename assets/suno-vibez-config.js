/*
 * Playlist submission embed configuration.
 *
 * The SUNO_VIBEZ_CONFIG / suno-vibez-config.js names are internal identifiers
 * kept for URL and integration stability. They are never shown to visitors —
 * all user-facing wording is "Submit Song to a Playlist".
 *
 * ---------------------------------------------------------------------------
 * OPERATOR ACTION REQUIRED (1 of 2) — replace ghlEmbedUrl
 *
 * ghlEmbedUrl below currently points at the SAME GoHighLevel *booking
 * calendar* that collab.html uses. That widget is a date/time slot picker: it
 * has no track-link field and no file upload, and because it is shared with
 * the collab page, playlist submissions and collaboration inquiries land in
 * the CRM indistinguishable from one another.
 *
 * Replace it with a dedicated GoHighLevel form or survey that includes a
 * required "track link" field — for example:
 *     https://api.leadconnectorhq.com/widget/form/<YOUR_FORM_ID>
 * or at minimum a separate calendar so submissions are separable.
 * Changing this one line is the entire swap; suno-vibez.html needs no edit.
 *
 * OPERATOR ACTION REQUIRED (2 of 2) — post-submit redirect
 *
 * thank-you.html is unreachable until the redirect is configured on the GHL
 * side. In the calendar/form settings, set the post-submit redirect to:
 *     https://aguocha.com/thank-you.html
 * ---------------------------------------------------------------------------
 *
 * Set ghlEmbedUrl to "" to take submissions offline. The page then renders an
 * accessible "temporarily unavailable" panel with Call/Text fallbacks instead
 * of a broken frame.
 *
 * Only https:// URLs on api.leadconnectorhq.com or link.msgsndr.com are
 * accepted; anything else is rejected by assets/suno-vibez.js and falls back
 * to the unavailable panel. No API keys, tokens, or private webhooks belong in
 * this file — it is public, served straight from GitHub Pages.
 */
window.SUNO_VIBEZ_CONFIG = {
  ghlEmbedUrl: "https://api.leadconnectorhq.com/widget/booking/4Zwyq5uTC8G7JdZW4ltW",
  embedTitle: "Playlist submission scheduler"
};
