/*
 * Playlist submission embed builder.
 *
 * Reads window.SUNO_VIBEZ_CONFIG (assets/suno-vibez-config.js) and renders the
 * GoHighLevel widget into #submission-embed, or an accessible unavailable
 * state when no valid URL is configured.
 *
 * Load order matters and is handled by `defer` on both tags: deferred scripts
 * run after parsing, in document order, so the config is always defined here.
 * This file must never be inlined — an inline script would run during parse,
 * before the deferred config exists, and always fall through to unavailable.
 *
 * Security: the configured URL is validated (https + host allowlist) and the
 * iframe is assembled with createElement/setAttribute. No config value is ever
 * concatenated into innerHTML.
 */
(function () {
  "use strict";

  var ALLOWED_HOSTS = ["api.leadconnectorhq.com", "link.msgsndr.com"];
  var FORM_EMBED_SCRIPT = "https://link.msgsndr.com/js/form_embed.js";
  var PHONE = "+17622486242";
  var PHONE_DISPLAY = "+1 (762) 248-6242";

  /** Returns a normalized https URL from an allowlisted host, or null. */
  function validateEmbedUrl(raw) {
    if (typeof raw !== "string" || raw.trim() === "") return null;

    var url;
    try {
      url = new URL(raw);
    } catch (err) {
      return null;
    }

    if (url.protocol !== "https:") return null;
    if (ALLOWED_HOSTS.indexOf(url.hostname) === -1) return null;
    if (url.username || url.password) return null;

    return url;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /** Accessible fallback shown when submissions are not configured or offline. */
  function renderUnavailable(mount) {
    var panel = el("div", "card rounded-2xl p-6");
    panel.setAttribute("role", "status");

    panel.appendChild(
      el("h3", "font-bold text-xl", "Online submissions are temporarily unavailable")
    );
    panel.appendChild(
      el(
        "p",
        "mt-2 text-white/80",
        "The submission form is not accepting entries right now. You can still send your track directly and it will go into the same review queue."
      )
    );

    var actions = el("div", "mt-5 flex flex-wrap gap-3");

    var text = el("a", "btn-primary rounded-xl px-4 py-2 font-semibold", "Text your track link");
    text.setAttribute("href", "sms:" + PHONE);
    actions.appendChild(text);

    var call = el("a", "btn rounded-xl px-4 py-2 font-semibold", "Call " + PHONE_DISPLAY);
    call.setAttribute("href", "tel:" + PHONE);
    actions.appendChild(call);

    panel.appendChild(actions);

    panel.appendChild(
      el(
        "p",
        "mt-4 text-sm text-white/60",
        "Submission does not guarantee playlist placement."
      )
    );

    mount.appendChild(panel);
  }

  function renderEmbed(mount, url, title) {
    // form_embed.js keys its resize handshake off the "<widgetId>_<timestamp>"
    // id convention used by the existing booking embeds on the booking pages.
    var segments = url.pathname.split("/").filter(Boolean);
    var widgetId = segments.length ? segments[segments.length - 1] : "submission";

    var frame = document.createElement("iframe");
    frame.setAttribute("src", url.href);
    frame.setAttribute("id", widgetId + "_" + Date.now());
    frame.setAttribute("title", title);
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("loading", "lazy");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute(
      "style",
      "width:100%;border:none;overflow:hidden;min-height:850px"
    );
    frame.className = "block rounded-xl";
    mount.appendChild(frame);

    // Appended after the iframe so the widget exists when the script attaches.
    // Hardcoded literal URL — never derived from config.
    if (!document.querySelector('script[src="' + FORM_EMBED_SCRIPT + '"]')) {
      var script = document.createElement("script");
      script.src = FORM_EMBED_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
  }

  function init() {
    var mount = document.getElementById("submission-embed");
    if (!mount) return;

    var config = window.SUNO_VIBEZ_CONFIG || {};
    var url = validateEmbedUrl(config.ghlEmbedUrl);

    if (!url) {
      renderUnavailable(mount);
      return;
    }

    renderEmbed(mount, url, config.embedTitle || "Playlist submission form");
  }

  init();
})();
