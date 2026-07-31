/*
 * Homepage behaviour. One job: swap the Suno Vibez facade for the real Spotify
 * embed after a deliberate click.
 *
 * Why a facade at all — the embed is a third-party iframe that would otherwise
 * load for every visitor on arrival, competing with the hero image for
 * bandwidth and running Spotify's scripts whether or not anyone wants to play
 * anything. Loading it on request keeps the page fast and keeps a blocked or
 * slow Spotify from leaving a dead black rectangle on the homepage.
 *
 * Degradation, in order of severity:
 *   JavaScript off   -> a <noscript> rule hides the button, so no dead control
 *                       is presented. The Follow Playlist link still works.
 *   Spotify blocked  -> the button is still there; the iframe simply fails to
 *                       paint. The section's copy and both links are unaffected.
 *   This file fails  -> the facade stays put and the direct link still works.
 *
 * The facade and the iframe share a 352px min-height, so the swap cannot shift
 * the page.
 */
(function () {
  "use strict";

  /* Only Spotify's own embed host may be framed here. The URL comes from a
   * data-src attribute in first-party markup rather than any user input, but
   * validating it costs nothing and stops a future edit from turning this into
   * an open frame injector. */
  function validEmbedUrl(raw) {
    if (typeof raw !== "string" || raw.trim() === "") return null;
    var url;
    try {
      url = new URL(raw.trim());
    } catch (err) {
      return null;
    }
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "open.spotify.com") return null;
    if (url.pathname.indexOf("/embed/") !== 0) return null;
    return url.href;
  }

  function initSpotifyFacade() {
    var button = document.querySelector("[data-spotify-facade]");
    if (!button) return;

    var mount = button.closest("[data-spotify-mount]");
    if (!mount) return;

    button.addEventListener("click", function () {
      var src = validEmbedUrl(button.getAttribute("data-src"));
      if (!src) return; // leave the facade in place; the direct link still works

      var frame = document.createElement("iframe");
      frame.className = "hp-embed";
      frame.setAttribute("src", src);
      frame.setAttribute("title", "Suno Vibez playlist on Spotify");
      frame.setAttribute("loading", "lazy");
      frame.setAttribute("allow", "clipboard-write; encrypted-media; fullscreen; picture-in-picture");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

      mount.replaceChildren(frame);

      /* Move focus into the player. Someone who activated this from the
       * keyboard has just had the control they were on removed from the DOM,
       * and without this their focus would fall back to <body>. */
      frame.setAttribute("tabindex", "-1");
      frame.focus({ preventScroll: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSpotifyFacade);
  } else {
    initSpotifyFacade();
  }
})();
