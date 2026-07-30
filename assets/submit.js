/*
 * Suno Vibez — /submit page behavior (spec §5–§7, §13.3).
 *
 * Loaded deferred, after assets/suno-vibez-config.js and assets/analytics.js,
 * so window.SUNO_VIBEZ_CONFIG and window.svTrack are always defined by the
 * time this runs. Deferred scripts execute after parsing in document order.
 *
 * Security: every URL from config is validated (https + exact host allowlist)
 * and every element is built with createElement/setAttribute/textContent. No
 * config value is ever routed through innerHTML.
 */
(function () {
  "use strict";

  var CFG = window.SUNO_VIBEZ_CONFIG || {};
  var track = window.svTrack || function () {};

  var FORM_HOSTS = ["api.leadconnectorhq.com", "link.msgsndr.com"];
  var PLAYLIST_HOSTS = ["open.spotify.com", "suno.com", "www.suno.com"];
  var FORM_EMBED_SCRIPT = "https://link.msgsndr.com/js/form_embed.js";
  var STORAGE_KEY = "sv_track_link";

  /* ---------------------------------------------------------------- utils */

  function validUrl(raw, hosts) {
    if (typeof raw !== "string" || raw.trim() === "") return null;
    var url;
    try {
      url = new URL(raw.trim());
    } catch (err) {
      return null;
    }
    if (url.protocol !== "https:") return null;
    if (hosts.indexOf(url.hostname) === -1) return null;
    if (url.username || url.password) return null;
    return url;
  }

  /**
   * https-only absolute URL, no embedded credentials, no host allowlist.
   *
   * Used for curator profile links, which may legitimately live on any host —
   * so unlike validUrl() this deliberately has no allowlist. What it does
   * enforce is the scheme, which is the part that matters: these values reach
   * an <a href>, where a javascript: URL would execute on click.
   * Relative strings throw here (no base is supplied) and are rejected.
   */
  function validHttpsUrl(raw) {
    if (typeof raw !== "string" || raw.trim() === "") return null;
    var url;
    try {
      url = new URL(raw.trim());
    } catch (err) {
      return null;
    }
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url;
  }

  /**
   * Curator photograph. Restricted to a first-party img/ path on purpose: the
   * photo belongs in this repository, and permitting an arbitrary host would
   * add a third-party request that privacy.html does not disclose.
   */
  function validPhotoPath(raw) {
    if (typeof raw !== "string") return null;
    var value = raw.trim();
    return /^img\/[A-Za-z0-9._\-/]+$/.test(value) ? value : null;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function link(href, className, text) {
    var a = el("a", className, text);
    a.setAttribute("href", href);
    return a;
  }

  /**
   * Lane routing (spec §7.6). Returns "a", "b", or null.
   * Never used to block submission — only to choose helper copy.
   */
  function detectLane(value) {
    if (typeof value !== "string") return null;
    var v = value.toLowerCase();
    if (v.indexOf("suno.com") !== -1 || v.indexOf("suno.ai") !== -1) return "a";
    if (
      v.indexOf("spotify.com") !== -1 ||
      v.indexOf("music.apple.com") !== -1 ||
      v.indexOf("tidal.com") !== -1 ||
      v.indexOf("deezer.com") !== -1 ||
      v.indexOf("music.youtube.com") !== -1
    ) {
      return "b";
    }
    return null;
  }

  var LANE_COPY = {
    a: "Great — we'll review this as a Suno submission for the Suno playlist.",
    b: "This looks like a released track — we'll review it for the Spotify playlist too.",
    // Deliberately not an error. Spec §7.6: warn, guide, never block.
    unknown:
      "We accept Suno and streaming links. Not sure? Send it anyway and we'll take a look."
  };

  /* ----------------------------------------------------- hero paste field */

  function initHeroPaste() {
    var input = document.getElementById("hero-track-link");
    var hint = document.getElementById("hero-lane-hint");
    var cta = document.getElementById("hero-cta");
    if (!input || !cta) return;

    var pasted = false;

    function update() {
      var value = input.value.trim();
      var lane = detectLane(value);
      window.svLane = lane;

      if (hint) {
        hint.textContent = value === "" ? "" : LANE_COPY[lane || "unknown"];
      }

      if (value !== "" && !pasted) {
        pasted = true;
        track("hero_link_paste", { lane: lane });
      }
      if (value !== "") {
        try {
          sessionStorage.setItem(STORAGE_KEY, value);
        } catch (err) {
          /* private mode — the query-param prefill still carries it */
        }
      }
    }

    input.addEventListener("input", update);
    input.addEventListener("paste", function () {
      setTimeout(update, 0);
    });

    // The hero CTA is a real anchor to #submit-form, so it works without JS.
    // JS only adds the carry-down and the focus move.
    cta.addEventListener("click", function () {
      var value = input.value.trim();
      if (value) {
        try {
          sessionStorage.setItem(STORAGE_KEY, value);
        } catch (err) {}
        if (window.svMarkFormStarted) window.svMarkFormStarted("hero");
        if (window.svTrackFieldComplete) window.svTrackFieldComplete("track_link");
      }
      renderForm();
    });
  }

  /* -------------------------------------------------------- playlist embed */

  /**
   * Lazy facade (spec §6.2, §10.2). The iframe is the heaviest thing on the
   * page and blocking on it wrecks LCP, so nothing third-party loads until the
   * visitor actually asks for it.
   */
  function initPlaylist() {
    var mount = document.getElementById("playlist-embed");
    if (!mount) return;

    var lane = mount.getAttribute("data-lane") || "b";
    var laneCfg = (CFG.lanes && CFG.lanes[lane]) || {};
    var embed = validUrl(laneCfg.playlistEmbedUrl, PLAYLIST_HOSTS);

    if (!embed) {
      var pending = el(
        "p",
        "text-sm text-white/60",
        "This month's playlist goes live with the first cycle."
      );
      mount.appendChild(pending);
      return;
    }

    var button = el("button", "sv-facade");
    button.setAttribute("type", "button");
    button.setAttribute(
      "aria-label",
      "Play this month's playlist. Loads an embedded player from Spotify."
    );
    button.appendChild(el("span", "sv-facade-icon", "▶"));
    button.appendChild(el("span", "sv-facade-label", "Play this month's playlist"));
    button.appendChild(
      el(
        "span",
        "sv-facade-note",
        "Loads an embedded player from Spotify."
      )
    );

    button.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.setAttribute("src", embed.href);
      frame.setAttribute("title", "Suno Vibez playlist");
      frame.setAttribute("loading", "lazy");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.setAttribute(
        "allow",
        "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      );
      frame.setAttribute("style", "width:100%;height:380px;border:0;border-radius:12px");
      mount.replaceChildren(frame);
      track("playlist_play", { lane: lane });
      frame.focus();
    });

    mount.appendChild(button);
  }

  /* ------------------------------------------------------------ the form */

  var formRendered = false;

  /**
   * Form unavailable — missing, empty, or non-allowlisted ghlFormUrl.
   *
   * submit.html now ships a static contact panel *below* the mount, carrying
   * Text, Call, Submission Terms and the Privacy Notice. That panel is outside
   * #submission-form, so it survives this replacement and is already the
   * working route. All this needs to do is clear the loading line and say so
   * in one neutral sentence — no technical detail, no error code, and no
   * redirect away from the page.
   */
  function formUnavailable(mount) {
    mount.replaceChildren(
      el(
        "p",
        "bk-status",
        "The submission form isn't available right now. Use the options below."
      )
    );
  }

  function renderForm() {
    if (formRendered) return;
    var mount = document.getElementById("submission-form");
    if (!mount) return;

    var url = validUrl(CFG.ghlFormUrl, FORM_HOSTS);
    if (!url) {
      formRendered = true;
      formUnavailable(mount);
      return;
    }

    // Carry the hero paste down so the creator never retypes it (spec §7.2).
    var stored = "";
    try {
      stored = sessionStorage.getItem(STORAGE_KEY) || "";
    } catch (err) {}
    if (stored && CFG.prefillParam) {
      url.searchParams.set(CFG.prefillParam, stored);
    }

    var segments = url.pathname.split("/").filter(Boolean);
    var widgetId = segments.length ? segments[segments.length - 1] : "submission";
    var isForm = url.pathname.indexOf("/widget/form/") !== -1;
    var height = CFG.ghlFormMinHeight || 900;

    var frame = document.createElement("iframe");
    frame.setAttribute("src", url.href);
    frame.setAttribute("title", CFG.ghlFormTitle || "Track submission form");
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute(
      "style",
      "width:100%;border:none;overflow:hidden;min-height:" + height + "px"
    );
    frame.className = "block rounded-xl";

    /*
     * form_embed.js keys its resize handshake off different conventions for the
     * two widget types, and gets it wrong silently — the frame just never
     * resizes. Forms want id="inline-<formId>" plus the data-* set below;
     * booking widgets want "<calendarId>_<timestamp>".
     */
    if (isForm) {
      var domId = "inline-" + widgetId;
      frame.setAttribute("id", domId);
      frame.setAttribute("data-layout", "{'id':'INLINE'}");
      frame.setAttribute("data-trigger-type", "alwaysShow");
      frame.setAttribute("data-trigger-value", "");
      frame.setAttribute("data-activation-type", "alwaysActivated");
      frame.setAttribute("data-activation-value", "");
      frame.setAttribute("data-deactivation-type", "neverDeactivate");
      frame.setAttribute("data-deactivation-value", "");
      frame.setAttribute("data-form-name", CFG.ghlFormName || "Track submission form");
      frame.setAttribute("data-height", String(height));
      frame.setAttribute("data-layout-iframe-id", domId);
      frame.setAttribute("data-form-id", widgetId);
    } else {
      frame.setAttribute("id", widgetId + "_" + Date.now());
    }

    // The GHL form paints its own white card, so it needs no wrapper here.
    mount.replaceChildren(frame);
    formRendered = true;

    if (!document.querySelector('script[src="' + FORM_EMBED_SCRIPT + '"]')) {
      var script = document.createElement("script");
      script.src = FORM_EMBED_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }

    if (window.svMarkFormStarted) window.svMarkFormStarted("form-section");
  }

  /**
   * Render the form when it is close to the viewport rather than on load, so
   * the third-party frame never competes with LCP.
   */
  function initForm() {
    var mount = document.getElementById("submission-form");
    if (!mount) return;

    if (!("IntersectionObserver" in window)) {
      renderForm();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            renderForm();
            io.disconnect();
          }
        });
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(mount);
  }

  /* -------------------------------------------------------- sticky mobile */

  function initStickyBar() {
    var bar = document.getElementById("sticky-cta");
    var formSection = document.getElementById("submit-form");
    if (!bar) return;

    var dismissed = false;
    var dismiss = bar.querySelector("[data-sticky-dismiss]");
    if (dismiss) {
      dismiss.addEventListener("click", function () {
        dismissed = true;
        bar.hidden = true;
      });
    }

    var formInView = false;
    if (formSection && "IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          formInView = entries[0].isIntersecting;
          apply();
        },
        { threshold: 0 }
      ).observe(formSection);
    }

    function apply() {
      if (dismissed) return;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? window.scrollY / max : 0;
      // Appears after 25% scroll; must never overlap the form (spec §5.2, §10.1).
      bar.hidden = !(pct > 0.25 && !formInView);
    }

    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply, { passive: true });
    apply();
  }

  /* ------------------------------------------------------------ accordion */

  function initFaq() {
    var triggers = document.querySelectorAll("[data-faq-trigger]");
    Array.prototype.forEach.call(triggers, function (trigger, index) {
      var panel = document.getElementById(trigger.getAttribute("aria-controls"));
      if (!panel) return;

      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");

      trigger.addEventListener("click", function () {
        var open = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", open ? "false" : "true");
        panel.hidden = open;
        if (!open) {
          track("faq_open", {
            index: index + 1,
            question: (trigger.textContent || "").trim().slice(0, 80)
          });
        }
      });
    });
  }

  /* ------------------------------------------------- curator and metrics */

  function initCurator() {
    var mount = document.getElementById("curator-block");
    if (!mount) return;
    var c = CFG.curator || {};

    // Spec §6.5.1: a half-filled curator block is worse than none. Omit.
    if (!c.name) {
      mount.remove();
      return;
    }

    var wrap = el("div", "card rounded-2xl p-6 md:flex md:items-start md:gap-6");
    var photo = validPhotoPath(c.photo);
    if (photo) {
      var img = document.createElement("img");
      img.setAttribute("src", photo);
      img.setAttribute("alt", "Photograph of " + c.name);
      img.setAttribute("width", "96");
      img.setAttribute("height", "96");
      img.setAttribute("loading", "lazy");
      img.className = "h-24 w-24 shrink-0 rounded-full border border-white/10 object-cover";
      wrap.appendChild(img);
    }

    var body = el("div", "mt-4 md:mt-0");
    body.appendChild(el("h3", "font-bold text-xl", c.name));
    if (c.bio) body.appendChild(el("p", "mt-2 text-white/85", c.bio));

    if (Array.isArray(c.links) && c.links.length) {
      var list = el("p", "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm");
      c.links.forEach(function (item) {
        if (!item) return;
        // These reach an <a href>, so the scheme is validated before use.
        var href = validHttpsUrl(item.url);
        if (!href) return;
        var a = link(href.href, "underline underline-offset-4", item.label || href.href);
        a.setAttribute("rel", "noopener");
        list.appendChild(a);
      });
      body.appendChild(list);
    }

    wrap.appendChild(body);
    mount.replaceChildren(wrap);
  }

  function initMetrics() {
    var mount = document.getElementById("metrics-block");
    if (!mount) return;
    var m = CFG.metrics || {};

    // Spec §6.5.3: omit rather than shrink. Empty space is neutral.
    if (!m.show) {
      mount.remove();
      return;
    }

    var rows = [
      ["Submissions this month", m.submissions],
      ["Tracks added", m.added],
      ["Acceptance rate", m.acceptanceRate],
      ["Median response", m.medianResponseDays ? m.medianResponseDays + " days" : null]
    ].filter(function (r) {
      return r[1] !== null && r[1] !== undefined && r[1] !== "";
    });

    if (!rows.length) {
      mount.remove();
      return;
    }

    var grid = el("dl", "grid grid-cols-2 gap-4 md:grid-cols-4");
    rows.forEach(function (row) {
      var cell = el("div", "card rounded-2xl p-4");
      cell.appendChild(el("dt", "text-sm text-white/60", row[0]));
      cell.appendChild(el("dd", "mt-1 text-2xl font-extrabold", String(row[1])));
      grid.appendChild(cell);
    });
    mount.replaceChildren(grid);
  }

  /* ------------------------------------------------------------ playlist links */

  function initPlaylistLinks() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-playlist-link]"),
      function (node) {
        var lane = node.getAttribute("data-playlist-link");
        var cfg = (CFG.lanes && CFG.lanes[lane]) || {};
        var url = validUrl(cfg.playlistUrl, PLAYLIST_HOSTS);
        if (!url) {
          node.remove();
          return;
        }
        node.setAttribute("href", url.href);
        node.setAttribute("rel", "noopener");
      }
    );
  }

  /* ----------------------------------------------------------------- init */

  initHeroPaste();
  initPlaylist();
  initPlaylistLinks();
  initForm();
  initStickyBar();
  initFaq();
  initCurator();
  initMetrics();
})();
