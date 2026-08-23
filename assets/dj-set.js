/*
 * Agu Ocha — /dj-set/ behaviour.
 *
 * Loaded deferred, after assets/analytics.js and assets/forms.js, so
 * window.svTrack and window.AGU_SITE_CONFIG are already defined when this runs
 * (deferred scripts execute in document order).
 *
 * This adds NO analytics vendor. It reuses the existing in-memory event layer:
 * every call ends up on window.svEvents and as a "sv:track" CustomEvent on
 * document. Nothing is sent anywhere, no cookie is set, no storage is written —
 * which is what /privacy/ currently tells visitors, and this page must not
 * quietly make that untrue.
 *
 * The page works completely without this file. The CTA is an in-page anchor,
 * the contact routes are sms: and tel: links, and the hero is a plain <img>.
 * If this script is blocked, cached stale, or throws, the visitor loses event
 * counting and an optional video upgrade, and nothing else.
 */
(function () {
  "use strict";

  var track = window.svTrack || function () {};
  var CFG = window.AGU_SITE_CONFIG || {};

  /*
   * QR campaign source: /dj-set/?src=card, ?src=coffee, ?src=lounge.
   *
   * Deliberately strict, and identical to the rule /hello/ uses. This value is
   * echoed into internal hrefs below, so it is constrained to a short
   * conservative character set rather than sanitised after the fact — anything
   * unexpected is dropped entirely and the page behaves as though no src were
   * supplied.
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

  track("dj_set_page_view", props());

  /* ------------------------------------------------------------ campaign src */

  /*
   * Carry ?src= onto FIRST-PARTY destinations only, and only when one was
   * supplied, so an ordinary scan still produces clean URLs. The origin check
   * is what makes this safe: a data-djset-internal attribute on an off-site
   * href is rejected here rather than trusted.
   */
  function propagateSrc() {
    if (!src) return;
    var links = document.querySelectorAll("a[data-djset-internal][href]");
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

  /* ---------------------------------------------------------------- tracking */

  /*
   * Delegated, so the handler count does not grow with the link count and a
   * route added later is tracked without touching this file. Keyboard
   * activation of an anchor dispatches a click too, so this covers Enter as
   * well as tap.
   */
  function initClickTracking() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var el = target.closest("[data-djset-cta]");
      if (!el) return;

      track("dj_set_cta_click", props({ location: el.getAttribute("data-djset-cta") }));
    });
  }

  /* ------------------------------------------------------------- hero video */

  /*
   * Two accepted shapes, both validated before anything is inserted:
   *
   *   1. A first-party path ("/media/session.mp4") -> <video>. Rejected if it
   *      contains "..", so a config value can never walk out of the site root.
   *   2. An https YouTube URL -> privacy-enhanced nocookie iframe. The video id
   *      is re-extracted and re-encoded rather than passing the supplied URL
   *      through, so only an id we recognised can reach the embed.
   *
   * Anything else returns null and the poster simply stays put. That is the
   * same posture assets/forms.js takes with an unconfigured form: never a
   * broken frame, never placeholder text, never a dead control.
   */
  var YT_HOSTS = ["www.youtube.com", "youtube.com", "youtu.be", "www.youtube-nocookie.com"];
  var YT_ID = /^[A-Za-z0-9_-]{6,20}$/;

  function classifyVideo(raw) {
    if (typeof raw !== "string" || raw.trim() === "") return null;
    var value = raw.trim();

    if (value.charAt(0) === "/") {
      if (value.indexOf("..") !== -1) return null;
      if (!/\.(mp4|webm)$/i.test(value)) return null;
      return { kind: "file", src: value };
    }

    var url;
    try {
      url = new URL(value);
    } catch (err) {
      return null;
    }
    if (url.protocol !== "https:") return null;
    if (YT_HOSTS.indexOf(url.hostname) === -1) return null;

    var id = url.hostname === "youtu.be"
      ? url.pathname.slice(1)
      : (url.searchParams.get("v") || url.pathname.replace(/^\/(embed|shorts)\//, ""));
    if (!YT_ID.test(id)) return null;

    return {
      kind: "youtube",
      id: id,
      src: "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) +
           "?autoplay=1&rel=0&playsinline=1"
    };
  }

  /*
   * Click-to-play, never autoplay-on-arrival. A QR visitor is often standing in
   * their own business with the phone unmuted; starting audio unasked is the
   * fastest way to make them close the tab. The poster carries the meaning
   * until they choose to play.
   */
  function initHeroVideo() {
    var mount = document.querySelector("[data-djset-hero]");
    if (!mount) return;

    var video = classifyVideo(CFG.djSetHeroVideoUrl);
    if (!video) return; // no session video configured yet — poster stays

    var button = document.createElement("button");
    button.type = "button";
    button.className = "media-play";
    button.setAttribute("aria-label", "Play the Agu Ocha session video");

    var playMark = document.createElement("span");
    playMark.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
      '<path d="M8 5.2v13.6L19 12z"></path></svg>';
    button.appendChild(playMark);

    button.addEventListener("click", function () {
      var el;
      if (video.kind === "file") {
        el = document.createElement("video");
        el.setAttribute("src", video.src);
        el.setAttribute("poster", "/img/private-corporate.png");
        el.setAttribute("controls", "");
        el.setAttribute("playsinline", "");
        /* Muted so a browser will honour the play() below without a gesture
           prompt; the visitor has controls and can unmute immediately. */
        el.muted = true;
        el.setAttribute("preload", "metadata");
      } else {
        el = document.createElement("iframe");
        el.setAttribute("src", video.src);
        el.setAttribute("title", "Agu Ocha session video");
        el.setAttribute("loading", "lazy");
        el.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        el.setAttribute("allow", "accelerometer; encrypted-media; picture-in-picture; fullscreen");
        el.setAttribute("allowfullscreen", "");
      }

      mount.replaceChildren(el);
      if (el.play) {
        var p = el.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
      }
      track("dj_set_hero_play", props({ kind: video.kind }));
    });

    var note = mount.querySelector("[data-djset-hero-note]");
    if (note) note.remove();
    mount.appendChild(button);
  }

  /* ----------------------------------------------------------- sessions grid */

  /*
   * Poster for a session tile. First-party /img/ paths only, and no "..", which
   * is the same restriction the curator photo validator applies elsewhere in
   * this repository: a config value must not be able to point the page at a
   * third-party host or walk out of the site root.
   */
  function validPoster(raw) {
    if (typeof raw !== "string") return null;
    var value = raw.trim();
    if (value.indexOf("..") !== -1) return null;
    return /^\/img\/[A-Za-z0-9._\-/]+\.(png|jpg|jpeg|webp)$/i.test(value) ? value : null;
  }

  /*
   * Renders AGU_SITE_CONFIG.djSetSessions when it holds complete entries, so
   * more sessions can be added without editing this page's markup. Each entry
   * is { url, title, poster } and every field is validated: a tile is only
   * built when all three survive, because a tile with no poster is an empty
   * box and reads as broken.
   *
   * With nothing configured the static markup already in the page stays exactly
   * as authored — real performance stills, honestly captioned, plus the line
   * saying sessions are being filmed. Nothing is fabricated to fill space.
   */
  function initSessions() {
    var list = document.querySelector("[data-djset-sessions]");
    if (!list) return;

    var items = Array.isArray(CFG.djSetSessions) ? CFG.djSetSessions : [];
    var valid = items
      .map(function (item) {
        if (!item || typeof item.title !== "string" || !item.title.trim()) return null;
        var video = classifyVideo(item.url);
        var poster = validPoster(item.poster);
        return video && poster
          ? { video: video, poster: poster, title: item.title.trim() }
          : null;
      })
      .filter(Boolean);

    if (!valid.length) return;

    var frag = document.createDocumentFragment();
    valid.forEach(function (entry) {
      var li = document.createElement("li");

      var link = document.createElement("a");
      link.setAttribute("href", entry.video.kind === "youtube"
        ? "https://www.youtube.com/watch?v=" + entry.video.id
        : entry.video.src);
      link.setAttribute("data-djset-cta", "session");
      if (entry.video.kind === "youtube") {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }

      var img = document.createElement("img");
      img.setAttribute("src", entry.poster);
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      /* The caption already names the session, so the poster is decorative and
         an alt repeating it would be read out twice. */
      img.setAttribute("alt", "");

      var cap = document.createElement("span");
      cap.className = "cap";
      /* textContent, never innerHTML: the title is operator-supplied config and
         must never be parsed as markup. */
      cap.textContent = entry.title;

      link.appendChild(img);
      link.appendChild(cap);
      li.appendChild(link);
      frag.appendChild(li);
    });

    list.replaceChildren(frag);

    var note = document.querySelector("[data-djset-sessions-note]");
    if (note) note.remove();
  }

  propagateSrc();
  initClickTracking();
  initHeroVideo();
  initSessions();
})();
