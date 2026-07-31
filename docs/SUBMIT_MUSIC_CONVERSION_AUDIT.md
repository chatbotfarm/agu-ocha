# Submit Music — Conversion Funnel Audit

- Repository: `chatbotfarm/agu-ocha`
- Branch: `conversion/submit-music-optimization`
- Base: `ccdb5e8fc536babd226e96db84b84ea5637941e0` (production `main`)
- Date: 2026-07-31
- Canonical destination: `https://aguocha.com/submit`
- GHL form under review: `hNlynM8h8zLs9jkDlTVW`

Evidence labels used throughout:

| Label | Meaning |
| --- | --- |
| **V** | Verified — read directly from the cited file and line, or observed in a browser |
| **A** | Assumption — requires operator confirmation |
| **GHL** | Controlled in the GoHighLevel dashboard; **not** changeable from this repository |

> **Iframe rendering is not proof of anything behind it.** Everything inside the
> GHL form — fields, labels, consent text, workflows, tags, notifications,
> redirect — is cross-origin and was not inspected programmatically. Field
> observations below marked **GHL / A** come from the operator's external review,
> not from repository inspection, and must be confirmed in the GHL admin.

---

## 1. Current page-section order (**V**)

`submit.html` renders six sections in this order:

| # | Section | Line | Note |
| --- | --- | --- | --- |
| 1 | Hero | 107 | `<h1>Submit Music</h1>` |
| 2 | AI-friendly statement — "You don't have to hide your tools" | 131 | includes the Suno Vibez card and playlist embed |
| 3 | How it works (3 steps) | 166 | |
| 4 | **The form** | 202 | `#submit-form`, mount `#submission-form` |
| 5 | Trust statement | ~240 | 3 items + placement disclaimer |
| 6 | FAQ | 265 | 5 disclosure panels |

**The core conversion problem (V):** the form is the *fourth* section. A visitor
must scroll past a philosophy section, a playlist promotion card and a
three-step process explanation before reaching the only conversion control. The
form heading sits at line 202 of ~340 lines of body markup.

## 2. Hero wording (**V**)

- `<h1>` — `Submit Music`
- Lead — "Send a track for playlist consideration. Every submission gets a real listen from a real person, and an answer either way."
- Trust line — "AI-friendly. Creator-owned. Selected by the music."
- CTA — `Submit Your Track` → `#submit-form`

The lead promises **"an answer either way"** — a universal response promise. See §7.

## 3. Visible CTAs (**V**)

| CTA | Location | Target |
| --- | --- | --- |
| Submit Your Track | hero | `#submit-form` |
| Follow the playlist | Suno Vibez card | populated at runtime from config |
| Text your track link | form fallback card | `sms:+17622486242` |
| Call | form fallback card | `tel:+17622486242` |
| Submission Terms | fallback + trust + FAQ 3 | `submission-terms.html` |
| Privacy Notice | fallback card | `privacy.html` |
| Submit Your Track | after FAQ | `#submit-form` |
| Submit a track — free | sticky mobile bar | `#submit-form` |

## 4. Form-loading behaviour (**V**)

- Mount `#submission-form` is empty in served markup; a static `<p data-form-status>` loading line sits inside it.
- `assets/submit.js:317-337` renders via `IntersectionObserver` with `rootMargin: 400px`, so the iframe is requested only as the mount approaches the viewport.
- `renderForm()` (`:238-311`) validates the URL, applies the `track_link` prefill from `sessionStorage`, builds the iframe with the GHL `data-*` resize contract, then injects `form_embed.js` once.
- `formRendered` guard plus `io.disconnect()` ensure a single injection.
- `mount.replaceChildren(frame)` is what clears the loading line — no separate hide logic, no race.

## 5. Fallback behaviour (**V**) — the defect

A card headed **"Prefer not to use the form?"** is rendered **unconditionally**,
outside the mount, offering `Text your track link` and `Call` as parallel
submission routes. It is visible in the normal, successful state.

Two problems:
1. It competes with the form as a submission route on every page view.
2. A phone or SMS submission **bypasses the rights-confirmation checkbox**, which
   is the one control in the flow carrying legal weight
   (`submission-terms.html` §2/§3).

`formUnavailable()` (`assets/submit.js`) handles an invalid or empty URL by
clearing the loading line — but there is **no timeout**, so a form that never
loads leaves a permanent "Loading the submission form…" line with no retry.

## 6. GHL form fields (**GHL / A — not verified from this repository**)

Reported by the external review as visible in the deployed iframe:

| Field | Status |
| --- | --- |
| Track link | keep |
| Official release date | remove |
| First name | remove / derive |
| Last name | remove |
| Email | keep |
| Phone | remove |
| SMS marketing checkbox ×2 | remove |
| Terms and Conditions ×2 (duplicated) | consolidate to one |
| "Option 1" generic label | rewrite |

Approximately **12 visible controls** against an approved target of **6**.

Consent wording reportedly still contains template placeholders
(`[BUSINESS NAME]`, `[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]`) — carried forward
from `README.md:98-108` and `SECURITY-REVIEW.md` M-06. **Unconfirmed since the
operator's last GHL edit.**

Rebuild specification: `docs/GHL_SUBMIT_MUSIC_FORM_REBUILD.md`.

## 7. Response promise — inconsistent across four surfaces (**V**)

| Surface | Current wording | Problem |
| --- | --- | --- |
| `submit.html` hero | "an answer either way" | universal response promise |
| `submit.html` FAQ 2 | "most tracks are not selected" | rejection-forward |
| `assets/suno-vibez-config.js:106` `shareText` | "Every submission gets a real listen and an answer within 7 days." | universal promise + hard SLA |
| `assets/suno-vibez-config.js:96` | `responseSlaDays: 7` | value itself is fine |
| `thank-you.html` | no promise (already corrected) | inconsistent with the above |

No operating workflow is verified to deliver a reply to every submitter, so the
universal promise is unsupported. **A** — only the operator can confirm.

## 8. Selection-value explanation (**V**)

**Absent.** The page never states what being selected actually yields. A visitor
cannot weigh the ask against the reward.

## 9. FAQ and structured data (**V**)

- Visible disclosure panels: **5**
- `FAQPage` JSON-LD questions: **4**

The fifth visible panel, "Eligibility detail: Suno tiers and streaming", has **no
schema entry**. It is also phrased as a documentation label rather than a
question a creator would ask.

## 10. Curator configuration (**V**)

`assets/suno-vibez-config.js:79-84` — `name`, `photo`, `bio` all empty, `links: []`.
`initCurator()` (`assets/submit.js:418-427`) therefore **removes the entire
"Who listens" block at runtime**, so the page ships with no curator identity at
all. Trust signal absent.

## 11. Metrics configuration (**V**)

`metrics.show: false`; all four values `null`. `initMetrics()` removes the block.
Correct for now — displaying zeros would be worse than displaying nothing.

## 12. Open Graph image (**V**)

`submit.html` `og:image` → `https://aguocha.com/img/agu-logo.png`, while
`twitter:card` is `summary_large_image`. The logo is **square**, not 1200×630, so
the large-image card crops or letterboxes it.

`img/` contains 9 files. The only brand asset suitable as an OG source is
`img/agu-logo.png` (218 KB). The four `*-inquiry-1024-transp-web.png` files are
referenced nowhere. **No 1200×630 asset exists.**

## 13. Tailwind loading (**V**)

**17 HTML pages** load `https://cdn.tailwindcss.com` at runtime. This is the
Tailwind Play CDN, which Tailwind documents as *not for production*; it emits a
console warning on every page load and is finding **M-07** in
`SECURITY-REVIEW.md`. No `package.json`, no Tailwind config, no compiled CSS.

## 14. Analytics events (**V**)

Emitted today: `hero_link_paste`, `form_start`, `field_complete`, `form_abandon`,
`playlist_play`, `faq_open`.

`assets/analytics.js` makes **no network request** — it pushes to
`window.svEvents` and dispatches a `sv:track` CustomEvent. Nothing is
transmitted, no cookie, no storage. `privacy.html:44-46` states this and is
accurate.

## 15. No-JavaScript behaviour (**V**)

`<noscript>` opens all FAQ panels and hides the loading line. The form is
JS-injected, so **no form renders without JavaScript** — which is unavoidable,
since the GHL form is itself a JavaScript application. Static content, headings,
Call/Text and the legal links remain reachable.

Header and footer are JS-injected (`assets/site.js`), so navigation disappears
without JavaScript — finding **M-03**, known and accepted.

## 16. Form-abandon behaviour (**V**)

`assets/analytics.js:71-77` fires `form_abandon` on `pagehide` when the form was
started but not submitted, reporting `lastField` and a completed-field count. No
personal data is included. Sound as designed.

## 17. Privacy claims (**V**)

`privacy.html` currently states: name, email, phone and track link are collected;
GoHighLevel/LeadConnector, YouTube and Spotify are named as processors; no
analytics, trackers, pixels or first-party cookies.

**Accuracy gap:** the collected-field list is narrower than the reported live GHL
form (which adds release date and split first/last name). And the list cannot be
corrected to "phone is not collected" until the GHL form actually stops
collecting it — doing so earlier would publish a false statement. See Phase 11.

---

## 18. Findings by control boundary

### Repository-controlled — fixed on this branch

| # | Finding | Phase |
| --- | --- | --- |
| R1 | Form is 4th of 6 sections | 2 |
| R2 | Hero promises "an answer either way" | 3, 6 |
| R3 | No compact trust points | 4 |
| R4 | Curator block removed at runtime (config empty) | 5 |
| R5 | Response policy inconsistent across 4 surfaces | 6 |
| R6 | No selection-value explanation | 7 |
| R7 | "most tracks are not selected" | 8 |
| R8 | FAQ heading is a doc label, not a question | 8, 12 |
| R9 | Always-visible Call/Text card competes with the form and bypasses rights confirmation | 9 |
| R10 | No load-failure timeout or retry | 9 |
| R11 | 5 visible FAQ vs 4 schema entries | 12 |
| R12 | `og:image` is a square logo under `summary_large_image` | 13 |
| R13 | Tailwind Play CDN in production ×17 pages | 14 |
| R14 | `shareText` carries a universal response promise | 6 |

### GHL-admin-controlled — cannot be fixed here

| # | Finding | Status |
| --- | --- | --- |
| G1 | ~12 visible controls vs approved 6 | **Requires GHL change** |
| G2 | Phone collected and reportedly required | **Requires GHL change** |
| G3 | Split first/last name duplicates creator name | **Requires GHL change** |
| G4 | Official release date collected | **Requires GHL change** |
| G5 | Two SMS-marketing checkboxes | **Requires GHL change** + legal review |
| G6 | Duplicate Terms and Conditions fields | **Requires GHL change** |
| G7 | "Option 1" generic rights label | **Requires GHL change** + legal review |
| G8 | Template placeholders in consent text | **Requires GHL change** + legal review |
| G9 | Post-submit redirect to `thank-you.html` | **Requires operator decision** |
| G10 | Field→contact mapping, tags, notifications, dedupe, spam | **Requires GHL change** |

### Assumptions requiring operator confirmation

1. **A** — The reported 12-control field set reflects the *current* live form.
2. **A** — No workflow currently replies to every submitter (drives §7 wording).
3. **A** — Seven days is the intended contact window for **selected** creators.
4. **A** — Only the Spotify artist profile is a verified public profile; no Suno or Instagram URL exists anywhere in this repository or its history.
5. **A** — No real curator photograph exists in `img/`; the approved logo is the only usable brand asset.

---

## 19. What this audit did not do

- Did not open, inspect or submit the GHL form.
- Did not read inside the cross-origin iframe.
- Did not verify any GHL workflow, tag, notification or redirect.
- Did not enter personal data anywhere.
- Did not assess legal sufficiency of any wording.
