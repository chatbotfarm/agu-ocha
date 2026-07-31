/*
 * Agu Ocha — shared site behavior.
 *
 * Loaded on every page as <script src="/assets/site.js" defer></script>.
 * Root-relative: clean routes are directories, so a relative src would break
 * on any nested page such as /booking/residencies/.
 *
 * Why the nav behavior lives here and not inside header.html:
 * header.html is injected with innerHTML, and scripts inserted via innerHTML
 * never execute. So every handler is delegated from `document`, which also
 * means it does not matter whether this file runs before or after the header
 * fragment lands.
 */
(function () {
  "use strict";

  var MOBILE_NAV_ID = "mobile-nav";

  /**
   * Fetch a same-origin HTML fragment and inject it into `id`.
   * innerHTML is safe here: `file` is a hardcoded first-party path, never a
   * URL, query parameter, or config value. Dynamic values must never be
   * assigned this way — see assets/suno-vibez.js for the createElement route.
   */
  async function loadHTML(id, file) {
    try {
      var el = document.getElementById(id);
      if (!el) return;

      var res = await fetch(file, { cache: "no-cache" });
      if (!res.ok) throw new Error("Failed to load " + file + ": " + res.status);

      el.innerHTML = await res.text();
    } catch (err) {
      console.error(err);
    }
  }

  function getMobileNav() {
    return document.getElementById(MOBILE_NAV_ID);
  }

  function getToggle() {
    return document.querySelector("[data-nav-toggle]");
  }

  function isOpen(nav) {
    return !!nav && !nav.classList.contains("hidden");
  }

  function setExpanded(open) {
    var toggle = getToggle();
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeNav() {
    var nav = getMobileNav();
    if (!nav) return;
    nav.classList.add("hidden");
    setExpanded(false);
  }

  // Delegated click: works for the fetch-injected header regardless of timing.
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    var toggle = target.closest("[data-nav-toggle]");
    if (toggle) {
      var nav = getMobileNav();
      if (!nav) return;
      var open = !isOpen(nav);
      nav.classList.toggle("hidden", !open);
      setExpanded(open);
      return;
    }

    if (target.closest("[data-nav-close]")) {
      closeNav();
    }
  });

  // Escape closes the mobile menu. Only acts while the menu is open so it does
  // not swallow Escape from anything else on the page.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    var nav = getMobileNav();
    if (!isOpen(nav)) return;

    // Restore focus to the toggle only if focus is currently inside the menu.
    var focusWasInside = nav.contains(document.activeElement);
    closeNav();

    if (focusWasInside) {
      var toggle = getToggle();
      if (toggle) toggle.focus();
    }
  });

  /**
   * The footer ships a hardcoded year as a no-JS fallback. Must run after the
   * footer fragment is injected — DOMContentLoaded fires long before the fetch
   * resolves, so this is chained off loadHTML instead.
   */
  function setCurrentYear() {
    var el = document.getElementById("current-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /**
   * Booking calendars ship a static "loading" line, so it is on screen before
   * any script runs. Clear it once the frame reports load.
   *
   * If the document is already complete, every iframe has finished loading, so
   * clear immediately — that closes the race where a cached frame fires load
   * before this deferred script gets to attach a listener.
   *
   * Pages with JavaScript disabled hide the line with their own <noscript>
   * rule instead, since nothing here would ever run to clear it. The fallback
   * block beside the calendar is static and stays visible either way.
   */
  function initCalendarStatus() {
    var frames = document.querySelectorAll("[data-calendar-frame]");

    Array.prototype.forEach.call(frames, function (frame) {
      var scope = frame.closest("[data-calendar-embed]") || document;
      var status = scope.querySelector("[data-calendar-status]");
      if (!status) return;

      function clear() {
        status.hidden = true;
      }

      if (document.readyState === "complete") {
        clear();
        return;
      }
      frame.addEventListener("load", clear);
    });
  }

  /* Root-relative on purpose. Clean routes are physical directories, so from
   * /booking/residencies/ a relative "header.html" would resolve to
   * /booking/residencies/header.html and 404. These two paths are the reason
   * every nested page still gets a header and footer. */
  loadHTML("site-header", "/header.html");
  loadHTML("site-footer", "/footer.html").then(setCurrentYear);
  initCalendarStatus();
})();
