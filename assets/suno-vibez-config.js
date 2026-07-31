/*
 * Suno Vibez — playlist submission configuration.
 *
 * Single source of truth for every external URL and toggle the /submit-music/ page
 * needs. Nothing here is secret: this file is public, served straight from
 * GitHub Pages. Never put API keys, tokens, or private webhook URLs in it.
 *
 * ---------------------------------------------------------------------------
 * OPERATOR ACTION — status as of 2026-07-31
 *
 * DONE, do not undo:
 *   ghlFormUrl   set to the live "playlist submission Form".
 *   curator      populated (spec §6.5.1). See the note above that block for
 *                what is still missing and why nothing was invented.
 *   redirect     post-submit destination is https://aguocha.com/thank-you/
 *                (item 2 below, operator confirmed).
 *
 * STILL OPEN:
 *
 * 1. Rebuild the GoHighLevel form itself. The URL below points at a working
 *    form, but the form asks for far more than the six approved fields, and
 *    that is now the largest remaining conversion cost in the funnel. No change
 *    to this repository can fix it — the form lives in GoHighLevel.
 *    Full specification: docs/GHL_SUBMIT_MUSIC_FORM_REBUILD.md
 *
 *    The approved field keys (spec §12.1). Renaming any of them re-keys every
 *    downstream workflow and report, and silently breaks the prefill below:
 *        track_link          URL,      required
 *        creator_name        text,     required
 *        email               email,    required
 *        genre               select,   required
 *        submission_notes    textarea, optional, 300 char
 *        rights_confirmed    checkbox, required
 *
 *    Prefill: the hero paste field forwards the pasted link as a query
 *    parameter (see prefillParam) so the creator does not retype it. GHL
 *    ignores a parameter that does not match a field key, without warning.
 *
 * 2. Post-submit redirect — DONE, operator confirmed 2026-07-31.
 *    It points at https://aguocha.com/thank-you/ — the canonical clean route.
 *    Set inside GHL, not here; no repository or GHL API change was made from
 *    this side and the production form was not submitted to verify it.
 *    thank-you.html survives only as a legacy compatibility redirect.
 *
 * 3. ghlFormSimplified — flip to true only AFTER item 1 is done and verified.
 *    See the comment at that key. It controls a factual claim about how long
 *    the form takes, so it must follow the form, not lead it.
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
      /* Current Suno Vibez playlist, 5u17B3EXagZ5F2bm0mgCTq (updated
       * 2026-07-31). It replaces an unrelated Afrobeat playlist that was
       * configured here previously — see git history for the retired ID. If the
       * embed ever renders a playlist name other than "Suno Vibez", either this
       * value is stale or the deployed copy is behind the repository; check
       * which commit is live before editing anything here.
       *
       * This is the single source of truth: /submit-music/ renders BOTH the embed and
       * the "Follow the playlist" link from here, and /thank-you/ reads the
       * same value, so the surfaces move together and cannot drift apart. Do
       * not hardcode a playlist URL into either page.
       *
       * The link carries ?si=... (Spotify's share token) because that is what
       * was supplied for sharing. The embed deliberately carries no query
       * string: the iframe needs only the playlist ID, and ?si= is a share
       * token rather than an embed parameter.
       *
       * NOTE: collab.html still hardcodes the previous playlist ID. It does not
       * read this config, so it is deliberately untouched here and is recorded
       * as a separate follow-up. */
      playlistUrl: "https://open.spotify.com/playlist/5u17B3EXagZ5F2bm0mgCTq?si=2840471ba6ed40a3",
      playlistEmbedUrl:
        "https://open.spotify.com/embed/playlist/5u17B3EXagZ5F2bm0mgCTq"
    }
  },
  playlistUpdatedLabel: "Updated on the 1st of each month",

  /* ---- Curator (spec §6.5.1) --------------------------------------------
   * Populated 2026-07-31. `photo` is restricted by assets/submit.js to a
   * first-party /img/ path, so only assets committed to this repository can be
   * shown. No real curator photograph exists yet, so the approved logo is used
   * rather than a placeholder silhouette.
   *
   * OPERATOR: a portrait at 512x512 or larger, square, committed to img/,
   * would replace the logo here with no other change.
   *
   * `links` contains only profiles whose exact URL is verified in this
   * repository. The Spotify artist URL is the canonical form of the embed ID
   * already used on music.html and tour.html. No Suno or Instagram profile URL
   * exists anywhere in this repository or its history, so none is invented —
   * assets/submit.js omits missing links gracefully.
   */
  curator: {
    name: "DJ Agu Ocha",
    // Root-relative. Clean routes are directories, so a bare "img/..." here
    // would resolve to /submit-music/img/... and 404.
    photo: "/img/agu-logo.png",
    bio: "Afrohouse DJ and producer, based in New England and performing worldwide. Every submission is reviewed personally for fit with an upcoming monthly set.",
    links: [
      { label: "Spotify", url: "https://open.spotify.com/artist/5ymz8gAPHU5sgDUhdhVqzh" }
      // OPERATOR: add { label: "Suno", url: "https://..." } and
      // { label: "Instagram", url: "https://..." } once the exact URLs are supplied.
    ]
  },

  /* ---- Transparency metrics (spec §6.5.3) ------------------------------- */
  metrics: {
    show: false,
    submissions: null,
    added: null,
    acceptanceRate: null,
    medianResponseDays: null
  },

  /* ---- Operational promises stated on the page --------------------------
   * selectedContactDays is the window for contacting creators whose track is
   * SELECTED. It is deliberately NOT a universal response SLA: no workflow is
   * verified to reply to every submitter, so no page may promise one.
   * Public wording: "If your track is selected, we'll contact you within
   * seven days."
   */
  selectedContactDays: 7,
  submissionsPerCreatorPerMonth: 1,

  /* ---- GHL form state ----------------------------------------------------
   * OPERATOR TOGGLE. Leave false until the GoHighLevel form has actually been
   * reduced to the six approved fields (see docs/GHL_SUBMIT_MUSIC_FORM_REBUILD.md)
   * AND that change has been verified in the live form.
   *
   * false -> the page shows "You keep ownership. No submission fee."
   * true  -> the page shows "Takes about 60 seconds. You keep ownership."
   *
   * The 60-second claim is false against the current ~12-control form, so it
   * must not be enabled on the promise of a future edit.
   */
  ghlFormSimplified: false,

  /* ---- Confirmation page (spec §7.9) ------------------------------------ */
  // Discord invite or email-list URL. Left empty until one exists — the
  // tertiary CTA is omitted rather than shown pointing nowhere.
  communityUrl: "",
  communityLabel: "Join the Suno Vibez community",
  shareUrl: "https://aguocha.com/submit",
  shareText:
    "Suno Vibez is a free monthly playlist for music made with Suno. Submit one track — AI-assisted music is welcome, and submission is free.",

  /* ---- Contact fallbacks ------------------------------------------------ */
  phone: "+17622486242",
  phoneDisplay: "+1 (762) 248-6242"
};
