/*
 * Suno Vibez — event instrumentation layer (spec §13.3).
 *
 * WHAT THIS IS NOT: it is not an analytics vendor, a tracker, or a cookie. It
 * makes no network requests, sets no storage, and loads no third-party script.
 * The site currently ships zero trackers and privacy.html says so; attaching a
 * destination is a deliberate, separate decision.
 *
 * WHAT IT IS: a stable event surface wired up as each CTA and field is built,
 * so the field-level drop-off data exists from day one. Retrofitting analytics
 * always loses exactly this data, which is why §13.3 asks for it now.
 *
 * Events are (a) pushed onto window.svEvents and (b) dispatched on document as
 * a CustomEvent named "sv:track" with { name, props } in detail. To start
 * collecting, attach one listener in ONE place - and update privacy.html in
 * the same change:
 *
 *     document.addEventListener("sv:track", (e) => {
 *       // forward e.detail.name / e.detail.props to your destination
 *     });
 *
 * Events emitted (spec §13.3):
 *     hero_link_paste   { lane }
 *     form_start        { lane, source }
 *     field_complete    { field }              one per field, first completion
 *     form_abandon      { lastField, completed }
 *     playlist_play     { lane }
 *     faq_open          { question, index }
 */
(function () {
  "use strict";

  window.svEvents = window.svEvents || [];

  var seenFields = Object.create(null);
  var lastField = null;
  var formStarted = false;
  var formSubmitted = false;

  function track(name, props) {
    if (!name) return;
    var event = { name: name, props: props || {}, t: Math.round(performance.now()) };
    window.svEvents.push(event);
    document.dispatchEvent(new CustomEvent("sv:track", { detail: event }));
  }

  /** First completion of a given field only - repeats are noise. */
  function trackFieldComplete(field) {
    if (!field) return;
    lastField = field;
    if (seenFields[field]) return;
    seenFields[field] = true;
    track("field_complete", { field: field });
  }

  function markFormStarted(source) {
    if (formStarted) return;
    formStarted = true;
    track("form_start", { source: source || "unknown", lane: window.svLane || null });
  }

  function markFormSubmitted() {
    formSubmitted = true;
  }

  /*
   * Abandonment: someone touched the form, never submitted, and is leaving.
   * pagehide is used rather than beforeunload because beforeunload is
   * unreliable on mobile Safari, which is where most of this traffic lands.
   */
  window.addEventListener("pagehide", function () {
    if (!formStarted || formSubmitted) return;
    track("form_abandon", {
      lastField: lastField,
      completed: Object.keys(seenFields).length
    });
  });

  window.svTrack = track;
  window.svTrackFieldComplete = trackFieldComplete;
  window.svMarkFormStarted = markFormStarted;
  window.svMarkFormSubmitted = markFormSubmitted;
})();
