# Site Rebuild Audit — Tour, Media and Booking Consolidation

- Branch: `rebuild/high-conversion-site`
- Base: `e6c3d6d565516e57186de7d14d943cf1efd65db1` (production `main`)
- Date: 2026-07-30
- Prior records: `SITE-INVENTORY.md`, `SECURITY-REVIEW.md`, `REMEDIATION-PLAN.md`, `STAGE-E-VALIDATION.md`

This audit covers only what changed in this rebuild. The four documents above
remain the historical record and were **not** rewritten; a dated implementation
note has been appended to each where a previously reported defect is now closed.

---

## 1. What this rebuild addressed

| # | Problem | Source | Resolution |
| --- | --- | --- | --- |
| 1 | `tour.aguocha.com` does not resolve (DNS NXDOMAIN) — it was the only CTA on `tour.html` | `STAGE-E-VALIDATION.md` E9-01 | Public link removed. `tour.html` rebuilt as an on-site signup page. DNS still an operator action |
| 2 | `app.aguocha.com/media-request-form` 301s to a booking portal home page, not a media form | `STAGE-E-VALIDATION.md` E9-02 | Public link removed. Media requests now handled in-page at `media.html#media-request` |
| 3 | Four booking calendars on four separate pages, each loading its own third-party frame | Consolidation requirement | One `book.html` with `?type=` routing; exactly one calendar loads, and none on the default view |
| 4 | Two GHL form IDs unavailable | Operator | Fallback-ready architecture; documented in `docs/GHL_OPERATOR_ACTIONS.md` |

---

## 2. Missing form IDs — treated as fallback states, not blockers

Neither ID was invented and no unrelated GHL asset was reused.

| Slot | Config key | State | Visitor sees |
| --- | --- | --- | --- |
| Tour Updates | `tourUpdatesFormUrl` | Empty | Static Text / Call panel + Privacy Notice |
| Media Request | `mediaRequestFormUrl` | Empty | Static Text a Media Request / Call panel + Privacy Notice |

The empty state is deliberate and complete: no iframe is created, no technical
error appears, no placeholder text is exposed, and every alternative action
stays live. `assets/forms.js` removes the loading line and leaves the static
panel as the working route.

Populating either value in `assets/site-config.js` renders the form **with no
structural page change**.

---

## 3. GHL asset integrity

All six identifiers preserved exactly, with widget type, embed script host,
iframe id, title, inline style, and `scrolling` copied verbatim from the page
that owned them.

| Purpose | Type | ID | `form_embed.js` host |
| --- | --- | --- | --- |
| Submit Music | form | `hNlynM8h8zLs9jkDlTVW` | `link.msgsndr.com` (untouched) |
| Private or Corporate | calendar | `gVxSS7k0YEJNYBFPQILA` | `link.msgsndr.com` |
| Festival or Public | calendar | `X56pKuTIpw1vu5xdOVpX` | `link.msgsndr.com` |
| Club or Residency | calendar | `6tuaToT0K8aZFMLYJ2VU` | `api.leadconnectorhq.com` |
| Brand Collaboration | calendar | `Fwzuvt3S944xnibxng7O` | `api.leadconnectorhq.com` |
| Collaboration chat | calendar | `4Zwyq5uTC8G7JdZW4ltW` | `link.msgsndr.com` |

Two findings worth recording:

1. **All five booking assets are `/widget/booking/` calendars.**
   `4Zwyq5uTC8G7JdZW4ltW` is sometimes described as a "form or calendar"; it is a
   calendar. Rendering it through a form embedder would break it, so
   `assets/booking.js` and `assets/forms.js` are separate and the form embedder
   explicitly rejects `/widget/booking/` URLs.
2. **The two-host `form_embed.js` split is inherited, not introduced.** It is
   preserved per `SECURITY-REVIEW.md` L-07, still pending GoHighLevel
   confirmation of the canonical host.

Submit Music was left completely alone: `submit.html`, `assets/submit.js` and
`assets/suno-vibez-config.js` are untouched. A little duplication between
`assets/forms.js` and `assets/submit.js` is accepted deliberately, in preference
to refactoring a validated funnel.

---

## 4. Booking consolidation

`book.html` now routes by query parameter:

```
book.html?type=private-corporate
book.html?type=festival
book.html?type=residency
book.html?type=brand
```

- The type is matched against an **exact key allowlist**. An unknown or
  malformed value resolves to "no selection" and is never echoed into the page.
- **Only the selected calendar is requested.** With no `?type=`, no third-party
  calendar loads at all.
- The chosen category card is marked with `aria-current="true"` as well as
  colour, so selection is not conveyed by colour alone.

### Legacy pages kept as working compatibility entry points

`private-corporate.html`, `festivals-tours.html`, `residencies.html` and
`brand-activations.html` were **not** reduced to redirect stubs. Each keeps its
own static calendar and gains a notice linking to its consolidated state.

The reason is a real trade-off, recorded so it can be revisited: converting them
to stubs would have removed the only path that lets a visitor with JavaScript
disabled reach a booking calendar, because the consolidated calendar is
necessarily JS-injected. Keeping them working preserves inbound links *and*
no-JS booking, at the cost of four pages that still carry a frame.

`collab.html` is deliberately outside the four-category consolidation — it is a
separate collaboration-chat calendar, and its existing function is preserved.

---

## 5. Files changed

**New**

| File | Purpose |
| --- | --- |
| `assets/site-config.js` | Public config; the two empty form URLs live here |
| `assets/forms.js` | Validated GHL **form** embedder for Tour and Media |
| `assets/booking.js` | Booking category router; injects one calendar |
| `docs/GHL_OPERATOR_ACTIONS.md` | Outstanding GHL work |
| `docs/SITE_REBUILD_AUDIT.md` | This file |

**Rebuilt** — `tour.html`, `media.html`, `book.html`

**Minimal edits** — the four booking category pages (compatibility notice only);
`assets/site.css` (one `.bk-selected` rule)

**Deliberately untouched** — `submit.html`, `assets/submit.js`,
`assets/suno-vibez-config.js`, `thank-you.html`, `assets/thank-you.js`,
`submission-terms.html`, `privacy.html`, `collab.html`, `index.html`,
`music.html`, `store.html`, `404.html`, both `suno-vibez` stubs, `header.html`,
`footer.html`, `sitemap.xml`, `robots.txt`, `CNAME`

---

## 6. Route and canonical decisions

The deployed `.html` convention is preserved. `tour.html` and `media.html` keep
`.html` canonicals; only `/submit` remains extensionless, because that route is
intentionally configured and was verified working in production on 2026-07-29.

No sitemap or redirect changes were made — every route already listed in
`sitemap.xml` still resolves, and no route was added or removed.

---

## 7. Fallback behaviour summary

| Failure | Tour | Media | Book |
| --- | --- | --- | --- |
| Form/calendar not configured | Static contact panel | Static contact panel | n/a |
| JavaScript disabled | Full page + contact panel; loading line hidden | Full page + contact panel; loading line hidden | Category links to the four legacy pages, each with a static calendar |
| `forms.js` / `booking.js` blocked | Static panel remains (outside the mount) | Static panel remains | Static "Calendar not loading?" panel remains |
| GHL script blocked | Frame still renders; `min-height` floor prevents collapse | Same | Same |

No technical error text is shown to visitors in any state, and no health-check
request is made in any state.

---

## 8. Still outstanding

1. Tour Updates GHL form ID — operator
2. Media Request GHL form ID — operator
3. `tour.aguocha.com` DNS or GHL redirect — operator (site no longer depends on it)
4. Submit Music post-submit redirect to `thank-you.html` — operator
5. Items carried forward in `docs/GHL_OPERATOR_ACTIONS.md` §5
