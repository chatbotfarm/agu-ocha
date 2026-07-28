/*
 * Suno Vibez — playlist submission configuration.
 *
 * Single source of truth for every external URL and toggle the /submit page
 * needs. Nothing here is secret: this file is public, served straight from
 * GitHub Pages. Never put API keys, tokens, or private webhook URLs in it.
 *
 * ---------------------------------------------------------------------------
 * OPERATOR ACTION REQUIRED
 *
 * 1. ghlFormUrl — REQUIRED, currently empty.
 *    Paste the GoHighLevel *form* URL for the five-field submission form
 *    (spec §7.3), e.g. https://api.leadconnectorhq.com/widget/form/<FORM_ID>.
 *    Until this is set, the page renders an accessible fallback panel with
 *    Text/Email routes instead of a broken frame — it never shows an error.
 *
 *    The GHL form must write to these exact field keys (spec §12.1). Renaming
 *    them later means re-keying every downstream workflow and report:
 *        track_link          URL,      required
 *        creator_name        text,     required
 *        email               email,    required
 *        genre               select,   required
 *        submission_notes    textarea, optional, 300 char
 *        rights_confirmed    checkbox, required
 *
 *    Prefill: the hero paste field forwards the pasted link as a query
 *    parameter (see prefillParam) so the creator does not retype it.
 *
 * 2. Post-submit redirect — set inside GHL, not here.
 *    Point it at https://aguocha.com/thank-you.html or the confirmation page
 *    (spec §7.9) is unreachable.
 *
 * 3. curator — REQUIRED before launch (spec §6.5.1).
 *    Real name, real photograph, and at least two public profile links. The
 *    spec is blunt that an anonymous curator is indistinguishable from a
 *    fake-playlist operator. While `name` is empty the whole "Who listens"
 *    block is omitted rather than shown half-filled.
 *
 * 4. lanes.a.playlistUrl — the Suno-hosted playlist for Lane A. Empty for now.
 *
 * 5. metrics — leave `show: false` until the numbers are real (spec §6.5.3:
 *    "never display a metric that would look pitiful — omit rather than
 *    shrink"). Flip to true after the first monthly cycle.
 * ---------------------------------------------------------------------------
 */
window.SUNO_VIBEZ_CONFIG = {
  /* ---- Submission form (spec §7) ---------------------------------------- */
  // GoHighLevel form "playlist submission Form" (id hNlynM8h8zLs9jkDlTVW).
  // Must be a /widget/form/ URL, not /widget/booking/ — a booking widget is a
  // date picker with no track-link field.
  ghlFormUrl: "https://api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW",
  ghlFormTitle: "Suno Vibez track submission form",
  // GHL reports this form's natural height as data-height="1342". It is only a
  // reservation — form_embed.js resizes the frame to fit once it attaches.
  ghlFormMinHeight: 1342,
  ghlFormName: "playlist submission Form",
  // Query parameter used to prefill the pasted link. This must match the
  // field key in the GHL form itself (spec §12.1) or GHL silently ignores it.
  prefillParam: "track_link",

  /* ---- Playlists (spec §6.2) -------------------------------------------- */
  lanes: {
    a: {
      label: "Suno playlist",
      // Lane A accepts any Suno link on any tier, including free.
      playlistUrl: "",
      playlistEmbedUrl: ""
    },
    b: {
      label: "Spotify playlist",
      playlistUrl: "https://open.spotify.com/playlist/5UP8zLioz5jelEk4n5sFi8",
      playlistEmbedUrl:
        "https://open.spotify.com/embed/playlist/5UP8zLioz5jelEk4n5sFi8?utm_source=generator"
    }
  },
  playlistUpdatedLabel: "Updated on the 1st of each month",

  /* ---- Curator (spec §6.5.1) -------------------------------------------- */
  curator: {
    name: "",
    photo: "",
    bio: "",
    links: [] // [{ label: "Suno profile", url: "https://..." }, ...]
  },

  /* ---- Transparency metrics (spec §6.5.3) ------------------------------- */
  metrics: {
    show: false,
    submissions: null,
    added: null,
    acceptanceRate: null,
    medianResponseDays: null
  },

  /* ---- Operational promises stated on the page -------------------------- */
  responseSlaDays: 7,
  submissionsPerCreatorPerMonth: 1,

  /* ---- Confirmation page (spec §7.9) ------------------------------------ */
  // Discord invite or email-list URL. Left empty until one exists — the
  // tertiary CTA is omitted rather than shown pointing nowhere.
  communityUrl: "",
  communityLabel: "Join the Suno Vibez community",
  shareUrl: "https://aguocha.com/submit",
  shareText:
    "Suno Vibez is a free monthly playlist for music made with Suno. Every submission gets a real listen and an answer within 7 days.",

  /* ---- Contact fallbacks ------------------------------------------------ */
  phone: "+17622486242",
  phoneDisplay: "+1 (762) 248-6242"
};
