/*
 * Agu Ocha — /hello/ behaviour.
 *
 * Loaded deferred, after assets/analytics.js, so window.svTrack is defined by
 * the time this runs (deferred scripts execute in document order).
 *
 * This adds NO analytics vendor. It reuses the existing in-memory event layer:
 * every call ends up on window.svEvents and as a "sv:track" CustomEvent on
 * document. Nothing is sent anywhere, no cookie is set, no storage is written —
 * which is what privacy/index.html currently tells visitors, and this page must
 * not quietly make that untrue.
 *
 * The page works completely without this file. The four choices are plain
 * anchors and the FOLLOW group is a native <details>; if this script is blocked,
 * cached stale, or throws, the visitor loses event counting and nothing else.
 */
(function () {
  "use strict";

  var track = window.svTrack || function () {};

  /*
   * QR campaign source: /hello/?src=booth, ?src=card, ?src=event.
   *
   * Deliberately strict. This value is echoed into internal hrefs below, so it
   * is constrained to a short conservative character set rather than sanitised
   * after the fact — anything unexpected is dropped entirely and the page
   * behaves as though no src were supplied.
   */
  var SRC_ALLOWED = /^[A-Za-z0-9_-]{1,32}$/;

  function readSrc() {
    try {
      var raw = new URLSearchParams(window.location.search).get("src");
      return raw && SRC_ALLOWED.test(raw) ? raw : null;
    } catch (err) {
      return null;
    }
  }

  var src = readSrc();

  /* One props shape for every event on this page, so a future destination does
   * not have to guess where the campaign source lives. */
  function props(extra) {
    var out = { src: src };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) out[k] = extra[k];
      }
    }
    return out;
  }

  track("hello_page_view", props());

  /*
   * Carry ?src= onto FIRST-PARTY destinations only, and only when one was
   * supplied, so an ordinary scan still produces clean URLs.
   *
   * Not applied to Spotify or sms: — appending our campaign parameter to a
   * third party's URL tells us nothing we do not already record here, and the
   * only guaranteed effect is an uglier link.
   *
   * The origin check is what makes this safe: a data-hello-internal attribute
   * on an off-site href would be rejected here rather than trusted.
   */
  function propagateSrc() {
    if (!src) return;
    var links = document.querySelectorAll("a[data-hello-internal][href]");
    Array.prototype.forEach.call(links, function (link) {
      var url;
      try {
        url = new URL(link.getAttribute("href"), window.location.origin);
      } catch (err) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      url.searchParams.set("src", src);
      link.setAttribute("href", url.pathname + url.search + url.hash);
    });
  }

  /*
   * Delegated so the handler count does not grow with the link count, and so
   * a link added to the FOLLOW group later is tracked without touching this
   * file. Keyboard activation of an anchor dispatches a click too, so this
   * covers Enter as well as tap.
   */
  function initClickTracking() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var el = target.closest("[data-hello-event]");
      if (!el) return;

      var name = el.getAttribute("data-hello-event");
      if (!name) return;

      var platform = el.getAttribute("data-hello-platform");
      track(name, props(platform ? { platform: platform } : null));
    });
  }

  /*
   * FOLLOW is a <details>, so there is no navigation to hang an event on. The
   * "toggle" event fires for pointer, keyboard and programmatic opens alike.
   * Only the opening edge is counted; collapsing again is not a second intent.
   */
  function initFollowTracking() {
    var panel = document.getElementById("follow-panel");
    if (!panel) return;
    panel.addEventListener("toggle", function () {
      if (panel.open) track("hello_follow_click", props());
    });
  }

  propagateSrc();
  initClickTracking();
  initFollowTracking();
})();
