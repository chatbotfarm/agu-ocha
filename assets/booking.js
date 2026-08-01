/*
 * Agu Ocha — booking category router for book.html.
 *
 * Reads ?type= from the URL and injects EXACTLY ONE GoHighLevel calendar. The
 * other three are never requested. Without a recognised type the page shows the
 * category chooser and no calendar loads at all.
 *
 * Every value in CALENDARS below is copied verbatim from the legacy category
 * page that owns it — src, iframe id, title, inline style, scrolling, and the
 * form_embed.js host. Two calendars are served from api.leadconnectorhq.com and
 * three from link.msgsndr.com; that split is inherited, not a mistake, and is
 * preserved per SECURITY-REVIEW.md L-07 pending GoHighLevel confirmation.
 *
 * These are booking widgets (/widget/booking/), not forms. form_embed.js keys
 * its resize handshake off the "<calendarId>_<timestamp>" id convention for
 * this widget type; the exact original ids are reused so the handshake behaves
 * identically to the legacy pages.
 *
 * No storage, no cookies, no analytics, no network probing.
 */
(function () {
  "use strict";

  var CALENDARS = {
    "private-corporate": {
      label: "Private or Corporate Event",
      blurb: "Private celebrations, company events and hospitality experiences.",
      legacy: "private-corporate.html",
      src: "https://api.leadconnectorhq.com/widget/booking/gVxSS7k0YEJNYBFPQILA",
      iframeId: "gVxSS7k0YEJNYBFPQILA_1762813037092",
      title: "Private and corporate event booking calendar",
      style: "width: 100%;border:none;overflow: hidden;",
      script: "https://link.msgsndr.com/js/form_embed.js"
    },
    festival: {
      label: "Festival or Public Event",
      blurb: "Public events, showcases and festival performances.",
      legacy: "festivals-tours.html",
      src: "https://api.leadconnectorhq.com/widget/booking/X56pKuTIpw1vu5xdOVpX",
      iframeId: "X56pKuTIpw1vu5xdOVpX_1762812281356",
      title: "Festival and tour booking calendar",
      style: "width: 100%;border:none;overflow: hidden;",
      script: "https://link.msgsndr.com/js/form_embed.js"
    },
    residency: {
      label: "Club or Residency",
      blurb: "Recurring sets shaped around the venue, time slot and audience.",
      legacy: "residencies.html",
      src: "https://api.leadconnectorhq.com/widget/booking/6tuaToT0K8aZFMLYJ2VU",
      iframeId: "6tuaToT0K8aZFMLYJ2VU_1762813167563",
      title: "Residency booking calendar",
      style: "width: 100%;border:none;overflow: hidden;",
      script: "https://api.leadconnectorhq.com/js/form_embed.js"
    },
    brand: {
      label: "Brand Collaboration",
      blurb: "Music, appearances and event-based brand collaborations.",
      legacy: "brand-activations.html",
      src: "https://api.leadconnectorhq.com/widget/booking/Fwzuvt3S944xnibxng7O",
      iframeId: "Fwzuvt3S944xnibxng7O_1762813595022",
      title: "Brand activation booking calendar",
      style: "width: 100%;border:none;overflow: hidden;",
      script: "https://api.leadconnectorhq.com/js/form_embed.js"
    }
  };

  var rendered = false;

  /** Exact key match only. An unknown or malformed type resolves to null and is
   *  never echoed back into the page. */
  function requestedType() {
    var raw = "";
    try {
      raw = new URLSearchParams(window.location.search).get("type") || "";
    } catch (err) {
      return null;
    }
    return Object.prototype.hasOwnProperty.call(CALENDARS, raw) ? raw : null;
  }

  function loadScript(src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }

  function renderCalendar(key) {
    if (rendered) return;
    var cal = CALENDARS[key];
    var mount = document.getElementById("booking-calendar");
    if (!cal || !mount) return;
    rendered = true;

    var heading = document.getElementById("booking-selected-label");
    if (heading) heading.textContent = cal.label;

    var frame = document.createElement("iframe");
    frame.setAttribute("src", cal.src);
    frame.setAttribute("title", cal.title);
    frame.setAttribute("style", cal.style);
    frame.setAttribute("scrolling", "no");
    /* Same value the legacy category pages and both other embedders use. GHL
     * needs no path or query from the referrer — the widget id is already in
     * the src — so this only stops /booking/?type=... from being disclosed to
     * a third party on browsers that still default to sending the full URL. */
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute("id", cal.iframeId);
    frame.className = "bk-frame";
    frame.setAttribute("data-calendar-frame", "");

    // Replacing the mount's children is what clears the static loading line.
    mount.replaceChildren(frame);
    loadScript(cal.script);
  }

  /** Mark the chosen category card so the current selection is obvious. */
  function markSelected(key) {
    var cards = document.querySelectorAll("[data-booking-type]");
    Array.prototype.forEach.call(cards, function (card) {
      var isSel = card.getAttribute("data-booking-type") === key;
      card.setAttribute("aria-current", isSel ? "true" : "false");
      card.classList.toggle("bk-selected", isSel);
    });
  }

  function init() {
    var mount = document.getElementById("booking-calendar");
    if (!mount) return;

    var key = requestedType();

    var chooser = document.getElementById("booking-chooser-note");
    var panel = document.getElementById("booking-panel");

    if (!key) {
      // No category chosen: show the chooser only. No calendar is requested,
      // so nothing third-party loads on the default view.
      if (panel) panel.hidden = true;
      if (chooser) chooser.hidden = false;
      return;
    }

    if (panel) panel.hidden = false;
    if (chooser) chooser.hidden = true;
    markSelected(key);
    renderCalendar(key);
  }

  init();
})();
