/*
 * Suno Vibez — confirmation page behavior (spec §7.9).
 *
 * The moment after submission is peak engagement, so this page does real work
 * rather than saying "thanks": it offers follow > community > share, in that
 * order of value.
 *
 * Deferred, after assets/suno-vibez-config.js. No inline JS.
 */
(function () {
  "use strict";

  var CFG = window.SUNO_VIBEZ_CONFIG || {};
  var PLAYLIST_HOSTS = ["open.spotify.com", "suno.com", "www.suno.com"];

  function validUrl(raw, hosts) {
    if (typeof raw !== "string" || raw.trim() === "") return null;
    var url;
    try {
      url = new URL(raw.trim());
    } catch (err) {
      return null;
    }
    if (url.protocol !== "https:") return null;
    if (hosts && hosts.indexOf(url.hostname) === -1) return null;
    if (url.username || url.password) return null;
    return url;
  }

  /*
   * Contact-by date for SELECTED tracks. Dormant by design: the confirmation
   * page states the policy in words rather than as a dated promise, so
   * #reply-by does not exist and this returns early. Kept so the behaviour is
   * available if the operator later wants a concrete date shown to selected
   * creators. This is NOT a universal response SLA.
   */
  function setReplyDate() {
    var node = document.getElementById("reply-by");
    if (!node) return;
    var days = Number(CFG.selectedContactDays) || 7;
    var due = new Date();
    due.setDate(due.getDate() + days);
    node.textContent = due.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }

  /*
   * A plain track title, and nothing else.
   *
   * textContent already rules out XSS, but length alone is not enough: without
   * a character constraint, a crafted ?track= link could render an arbitrary
   * sentence inside this page's own <h1> — a social-engineering lure sitting on
   * a legitimate aguocha.com URL. The allowed set excludes ":" and "/", so a
   * URL cannot be formed; a phone-length run of digits and "www." are rejected
   * outright. Anything that fails falls back to the neutral default.
   */
  var TRACK_NAME_ALLOWED =
    /^[A-Za-z0-9 '&,.()!?À-ɏ‘’–—-]+$/;

  function safeTrackName(raw) {
    var value = (raw || "").trim().slice(0, 120);
    if (!value) return "";
    if (!TRACK_NAME_ALLOWED.test(value)) return "";
    if (/www\./i.test(value)) return "";
    if (value.replace(/\D/g, "").length >= 7) return "";
    return value;
  }

  /*
   * If GHL is configured to append the track title on redirect, name it back.
   * textContent only — this value comes from the query string.
   */
  function setTrackName() {
    var node = document.getElementById("track-name");
    if (!node) return;
    var raw = "";
    try {
      raw = new URLSearchParams(window.location.search).get("track") || "";
    } catch (err) {}
    var value = safeTrackName(raw);
    node.textContent = value ? "“" + value + "”" : "Your track";
  }

  function setPlaylistLink() {
    var node = document.getElementById("follow-playlist");
    if (!node) return;
    var lanes = CFG.lanes || {};
    var url =
      validUrl((lanes.b || {}).playlistUrl, PLAYLIST_HOSTS) ||
      validUrl((lanes.a || {}).playlistUrl, PLAYLIST_HOSTS);
    if (!url) {
      node.remove();
      return;
    }
    node.setAttribute("href", url.href);
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }

  function setCommunityLink() {
    var node = document.getElementById("join-community");
    if (!node) return;
    var url = validUrl(CFG.communityUrl, null);
    if (!url) {
      node.remove();
      return;
    }
    node.setAttribute("href", url.href);
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
    node.textContent = CFG.communityLabel || "Join the community";
  }

  /* Peer referral is the cheapest acquisition channel in a community niche. */
  function setShare() {
    var mount = document.getElementById("share-actions");
    if (!mount) return;

    var shareUrl = CFG.shareUrl || window.location.origin + "/submit";
    var shareText = CFG.shareText || "";
    var full = shareText + " " + shareUrl;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn rounded-xl px-4 py-2 font-semibold";
    button.textContent = navigator.share ? "Share this" : "Copy the link";

    var status = document.createElement("span");
    status.className = "ml-3 text-sm text-white/70";
    status.setAttribute("role", "status");

    button.addEventListener("click", function () {
      if (navigator.share) {
        navigator
          .share({ title: "Suno Vibez", text: shareText, url: shareUrl })
          .catch(function () {});
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(full).then(
          function () {
            status.textContent = "Copied.";
          },
          function () {
            status.textContent = "Couldn't copy — the link is " + shareUrl;
          }
        );
      } else {
        status.textContent = shareUrl;
      }
    });

    mount.appendChild(button);
    mount.appendChild(status);
  }

  setReplyDate();
  setTrackName();
  setPlaylistLink();
  setCommunityLink();
  setShare();
})();
