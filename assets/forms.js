/*
 * Agu Ocha — generic GoHighLevel form embedder.
 *
 * Used by tour.html and media.html. Deliberately NOT used by submit.html: the
 * Submit Music flow is validated and stays on assets/submit.js untouched. A
 * little duplication is cheaper than regression risk in a working funnel.
 *
 * Contract, per mount:
 *   <div data-ghl-form="tourUpdates">                     <- mount
 *     <p data-ghl-form-status>Loading…</p>                <- static, cleared on render
 *   </div>
 *   ...static fallback panel lives OUTSIDE the mount...
 *
 * Behaviour:
 *   - Empty or invalid config URL  -> inject nothing, remove the loading line,
 *     leave the static fallback as the working route. No error is shown.
 *   - Valid URL -> inject exactly one iframe, once, replacing the loading line.
 *
 * Security: the URL must be https, on an allowlisted LeadConnector host, with a
 * /widget/form/ path and a non-empty form id. Exact hostname match, never a
 * substring test. No config value is ever routed through innerHTML.
 *
 * No storage, no cookies, no network probing, no analytics.
 */
(function () {
  "use strict";

  var CFG = window.AGU_SITE_CONFIG || {};

  // Exact-match allowlist. This is a trust boundary, not cosmetic routing.
  var FORM_HOSTS = ["api.leadconnectorhq.com", "link.msgsndr.com"];
  var FORM_EMBED_SCRIPT = "https://link.msgsndr.com/js/form_embed.js";

  /**
   * Returns a URL object only for an https LeadConnector form URL.
   * Rejects: other schemes, other hosts, embedded credentials, non-form paths
   * (a /widget/booking/ URL is a calendar and must not be rendered here), and
   * a missing form id.
   */
  function validFormUrl(raw) {
    if (typeof raw !== "string" || raw.trim() === "") return null;

    var url;
    try {
      url = new URL(raw.trim());
    } catch (err) {
      return null;
    }

    if (url.protocol !== "https:") return null;
    if (FORM_HOSTS.indexOf(url.hostname) === -1) return null;
    if (url.username || url.password) return null;
    if (url.pathname.indexOf("/widget/form/") !== 0) return null;

    var id = url.pathname.split("/").filter(Boolean).pop();
    if (!id || id === "form") return null;

    return url;
  }

  function loadEmbedScript() {
    if (document.querySelector('script[src="' + FORM_EMBED_SCRIPT + '"]')) return;
    var s = document.createElement("script");
    s.src = FORM_EMBED_SCRIPT;
    s.async = true;
    document.body.appendChild(s);
  }

  /**
   * form_embed.js keys its resize handshake off the id and data-* set below and
   * fails silently when they are wrong — the frame simply never resizes. This
   * is the same contract assets/submit.js uses for the Submit Music form.
   */
  function buildFrame(url, title, name, minHeight) {
    var id = url.pathname.split("/").filter(Boolean).pop();
    var domId = "inline-" + id;

    var frame = document.createElement("iframe");
    frame.setAttribute("src", url.href);
    frame.setAttribute("title", title);
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute(
      "style",
      "width:100%;border:none;overflow:hidden;min-height:" + minHeight + "px"
    );
    frame.className = "block bk-frame";
    frame.setAttribute("id", domId);
    frame.setAttribute("data-layout", "{'id':'INLINE'}");
    frame.setAttribute("data-trigger-type", "alwaysShow");
    frame.setAttribute("data-trigger-value", "");
    frame.setAttribute("data-activation-type", "alwaysActivated");
    frame.setAttribute("data-activation-value", "");
    frame.setAttribute("data-deactivation-type", "neverDeactivate");
    frame.setAttribute("data-deactivation-value", "");
    frame.setAttribute("data-form-name", name);
    frame.setAttribute("data-height", String(minHeight));
    frame.setAttribute("data-layout-iframe-id", domId);
    frame.setAttribute("data-form-id", id);
    return frame;
  }

  /* One entry per supported mount. Keys match the data-ghl-form attribute. */
  var SLOTS = {
    tourUpdates: {
      url: CFG.tourUpdatesFormUrl,
      title: CFG.tourUpdatesFormTitle || "Tour updates form",
      name: CFG.tourUpdatesFormName || "Tour Updates",
      minHeight: CFG.tourUpdatesFormMinHeight || 700
    },
    mediaRequest: {
      url: CFG.mediaRequestFormUrl,
      title: CFG.mediaRequestFormTitle || "Media request form",
      name: CFG.mediaRequestFormName || "Media Request",
      minHeight: CFG.mediaRequestFormMinHeight || 900
    }
  };

  function clearStatus(mount) {
    var status = mount.querySelector("[data-ghl-form-status]");
    if (status) status.remove();
  }

  function render(mount) {
    if (mount.getAttribute("data-ghl-form-rendered") === "true") return;

    var slot = SLOTS[mount.getAttribute("data-ghl-form")];
    if (!slot) return;

    mount.setAttribute("data-ghl-form-rendered", "true");

    var url = validFormUrl(slot.url);
    if (!url) {
      // Not configured yet, or configured with something we will not embed.
      // The static fallback beside this mount is already the working route, so
      // just take the loading line away. Nothing technical is surfaced.
      clearStatus(mount);
      return;
    }

    mount.replaceChildren(buildFrame(url, slot.title, slot.name, slot.minHeight));
    loadEmbedScript();
  }

  /**
   * Render when the mount is near the viewport so a third-party frame never
   * competes with LCP. Falls back to immediate render where the observer is
   * unavailable. The rendered flag above guarantees a single injection either
   * way.
   */
  function init() {
    var mounts = document.querySelectorAll("[data-ghl-form]");
    if (!mounts.length) return;

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(mounts, render);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          render(entry.target);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "400px 0px" }
    );

    Array.prototype.forEach.call(mounts, function (m) {
      io.observe(m);
    });
  }

  init();
})();
