# Stage E — Full Structural Validation Report

- Repository: `chatbotfarm/agu-ocha`
- Branch: `feature/submit-music`
- Validated commit: `4c41134b07ec0dc57749601e1d81299130b6387d`
- Production baseline compared against: `7cc37a85ea9b6f971d793d19a24e69f0677d11d4`
- Date: 2026-07-29
- Companion documents: `SITE-INVENTORY.md`, `SECURITY-REVIEW.md`, `REMEDIATION-PLAN.md`

---

## 1. Executive result

**Recommendation: READY WITH WARNINGS.** The branch is ready for operator visual
review, page-by-page editorial review, and draft pull-request preparation.

**No blocking defects.** No production website file was modified during
validation; the working tree is unchanged and this report is the only new file.

The structural work of Stages A–D validates cleanly against a real browser:

- **20 of 20 HTML routes** serve correctly, each with exactly one `<h1>`,
  a correctly injected shared header and footer, and zero console errors.
- **Zero structural defects across 64 page × viewport combinations** at 320, 375,
  768 and 1440 px: no horizontal overflow, no clipped text, no empty sections, no
  undersized tap targets.
- **All six GoHighLevel identifiers and all eight GHL URLs are byte-identical to
  the production baseline.** No calendar or form was replaced; nothing was
  submitted.
- **All 20 baseline routes preserved.** None added, none removed, none deleted.
- **Resilience holds in all seven JavaScript-failure scenarios.** No blank page,
  no leaked technical text, and Call/Text/Privacy/Terms reachable in every case.
  The booking calendar renders even with JavaScript entirely disabled.

Two **Major** defects were found, and both matter: `tour.aguocha.com` does not
resolve in DNS, and `app.aguocha.com/media-request-form` redirects to a booking
portal home page rather than a media request form. Each is the *primary call to
action* on its page. Critically, **both are pre-existing and byte-identical to the
production baseline** — this branch did not introduce or change either URL, and
both require operator action outside the repository (DNS and GoHighLevel). They
are therefore not branch regressions and not blockers for review, but they are
live defects on the production site today and should be fixed before launch.

Eight Minor defects and a 6-item editorial backlog are recorded. None blocks a
primary journey.

---

## 2. Scope

**In scope:** every public HTML route; shared header and footer; responsive
behaviour at four viewports; all embeds; navigation and keyboard behaviour;
JavaScript-failure degradation; accessibility; metadata and structured data;
external destinations; GHL integrity against baseline; console and network;
content integrity; regression against baseline.

**Out of scope:** copy editing, page rewriting, image selection, GHL
configuration, Tailwind modernization, deployment. No form or booking submitted.

**Authority exercised:** read-only validation plus one new file,
`STAGE-E-VALIDATION.md`. No blocking defect required a correction, so **no
production file was changed** — the preferred Stage E outcome.

---

## 3. Environment and limitations

| Item | Detail |
| --- | --- |
| Browser | Chrome 150.0.7871.187, `--headless=new`, driven over the DevTools Protocol |
| Driver | Zero-dependency CDP client written for this session using only Node 22 built-ins (`fetch`, global `WebSocket`). **Nothing was installed and nothing was committed.** Harness lives in the session scratchpad |
| Local server | `python -m http.server 8971` serving the repository root |
| Node | v22.12.0 |
| Network | **Available.** External destinations were tested live |
| Screenshots | **82** captured — 64 responsive (16 pages × 4 viewports) + 18 failure-mode |
| Accessibility tooling | No axe/pa11y installed; per instruction none was installed. Accessibility checks are targeted DOM/CSS assertions, not a full automated audit |

### Material limitations

1. **Extensionless routing is NOT validated.** `python -m http.server` does not
   serve `/submit` without the `.html` extension, and it returned HTTP 404 as
   expected. GitHub Pages resolves extensionless paths, but that behaviour
   **cannot be confirmed outside the real deployment**. `/submit` is recorded as
   *Not testable* — this report makes no claim that it works.
2. **Colour contrast was not measured numerically.** Focus rings and text colours
   were inspected as computed values; no contrast-ratio calculation was run.
3. **Text-zoom** was tested via page scale factor at 200%, not via browser
   font-size-only zoom.
4. **GHL interiors remain opaque.** Form fields, consent strings, workflows and
   the post-submit redirect were not inspected and were not changed.
5. **Screenshots were captured but not individually eyeballed for aesthetics.**
   They are provided for operator visual review; the automated pass asserted
   structural properties (overflow, clipping, empty sections, tap-target size).

---

## 4. Preconditions

All eleven passed.

| # | Check | Result |
| --- | --- | --- |
| 1 | Branch is `feature/submit-music` | Pass |
| 2 | HEAD is `4c41134b…` | Pass |
| 3 | Working tree clean | Pass |
| 4 | Three governing documents exist | Pass |
| 5 | Stage A–D commits present (8 commits) | Pass — all resolve to `commit` |
| 6 | File tree recorded | 45 tracked files, 0 untracked |
| 7 | Link checker | **20 files, 0 errors, 0 warnings** |
| 8 | Six GHL IDs recorded | Pass — see §14 |
| 9 | All iframe/script sources recorded | 58 recorded |
| 10 | Canonical URLs recorded | 8 present, 6 absent on indexable pages, 2 absent on noindex pages |
| 11 | Header/footer destinations recorded | Pass — see §6 |

---

## 5. Route validation matrix

Rendered in Chrome at 1440×900 after JavaScript settled. "hdr/ftr" = shared
fragment actually injected into the DOM.

| Route | HTTP | Title | h1 (count) | Canonical | hdr | ftr | GHL embed | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | Agu Ocha — Official Site | Agu Ocha (1) | `https://aguocha.com/` | ok | ok | — | **Pass** |
| `/index.html` | 200 | Agu Ocha — Official Site | Agu Ocha (1) | `https://aguocha.com/` | ok | ok | — | **Pass** |
| `/music.html` | 200 | Music — Agu Ocha | Music (1) | `…/music.html` | ok | ok | — | **Pass** |
| `/book.html` | 200 | Book Agu Ocha | Book Agu Ocha (1) | **(none)** | ok | ok | none (correct — hub) | **Warning** (E8-01) |
| `/private-corporate.html` | 200 | Private & Corporate — Book Agu Ocha | Private & Corporate Events (1) | **(none)** | ok | ok | `gVxSS7k0YEJNYBFPQILA` | **Warning** (E8-01) |
| `/festivals-tours.html` | 200 | Festivals & Tours — Book Agu Ocha | Festivals & Tours (1) | **(none)** | ok | ok | `X56pKuTIpw1vu5xdOVpX` | **Warning** (E8-01) |
| `/residencies.html` | 200 | Residencies — Book Agu Ocha | Residencies (1) | **(none)** | ok | ok | `6tuaToT0K8aZFMLYJ2VU` | **Warning** (E8-01) |
| `/brand-activations.html` | 200 | Brand Activations — Book Agu Ocha | Brand Activations (1) | **(none)** | ok | ok | `Fwzuvt3S944xnibxng7O` | **Warning** (E8-01) |
| `/collab.html` | 200 | Collaborate with Agu Ocha | Collaboration Opportunities. (1) | **(none)** | ok | ok | `4Zwyq5uTC8G7JdZW4ltW` | **Warning** (E8-01) |
| `/submit.html` | 200 | Submit Music — Agu Ocha \| Current opportunity: Suno Vibez | **Submit Music** (1) | `https://aguocha.com/submit` | ok | ok | form `hNlynM8h8zLs9jkDlTVW` | **Pass** |
| `/submit` | **404 locally** | — | — | — | — | — | — | **Not testable** (§3 limitation 1) |
| `/suno-vibez.html` | 200 → forwards to `/submit.html` | Submit Music — Agu Ocha … | Submit Music (1) | `https://aguocha.com/submit` | ok | ok | form (via destination) | **Pass** |
| `/suno-vibez/` | 200 → forwards to `/submit.html` | Submit Music — Agu Ocha … | Submit Music (1) | `https://aguocha.com/submit` | ok | ok | form (via destination) | **Pass** |
| `/media.html` | 200 | Media — Agu Ocha | Media (1) | `…/media.html` | ok | ok | external GHL page link | **Warning** (E9-02) |
| `/tour.html` | 200 | Tour — Agu Ocha | Tour (1) | `…/tour.html` | ok | ok | — | **Warning** (E9-01) |
| `/store.html` | 200 | Store — Agu Ocha | Store (1) | `…/store.html` | ok | ok | — | **Pass** |
| `/privacy.html` | 200 | Privacy Notice \| Agu Ocha | Privacy Notice (1) | `…/privacy.html` | ok | ok | — | **Pass** |
| `/submission-terms.html` | 200 | Song Submission Terms \| Agu Ocha | Song Submission Terms (1) | `…/submission-terms.html` | ok | ok | — | **Pass** |
| `/thank-you.html` | 200 | Submission received \| Submit Music | Got it. … (1) | (none — `noindex`) | ok | ok | — | **Pass** |
| `/404.html` | 200 | Page Not Found \| Agu Ocha | That page does not exist. (1) | (none — `noindex`) | ok | ok | — | **Pass** |

**Internal links:** the repository link checker validates every internal `href`
and in-page fragment across all 20 files — **0 errors, 0 warnings**. Independently,
no rendered page contained an internal link to a nonexistent file.

**Primary CTAs** (verified present and correctly targeted): `/` → Listen /
Book / Submit Music; `/music.html` → Open on Spotify; `/book.html` → 5 ×
"View availability"; each booking page → its calendar; `/submit.html` → Submit
your track (`#submit-form`); `/media.html` → Media Request Form; `/tour.html` →
Sign Up for Tour Updates; `/store.html` → Go to store.aguocha.com; `/404.html` →
Home; `/privacy.html` and `/submission-terms.html` → Submit Music;
`/thank-you.html` → Follow the playlist + Back to Submit Music.

---

## 6. Navigation validation

Measured on the **rendered, injected** header, not the source fragment.

### 6.1 Destination parity — Pass

| Required | Desktop | Mobile |
| --- | --- | --- |
| Home (logo) | `index.html` | `index.html` |
| Music | `music.html` | `music.html` |
| Book | `book.html` | `book.html` |
| Submit Music | `submit.html` | `submit.html` |
| Media | `media.html` | `media.html` |
| Store | `https://store.aguocha.com` | `https://store.aguocha.com` |
| Call | `tel:+17622486242` | `tel:+17622486242` |
| Text | `sms:+17622486242` | `sms:+17622486242` |

**Destination sets are identical** between desktop (nav + right buttons) and
mobile — verified by set comparison, not by eye.

### 6.2 Book submenu — Pass

All five destinations present on desktop and mobile and in the footer:
`private-corporate.html`, `festivals-tours.html`, `residencies.html`,
`brand-activations.html`, `collab.html`.

### 6.3 Behaviour — actual, measured

| Check | Result |
| --- | --- |
| Logo returns Home | **Pass** — `href="index.html"` |
| Tour absent from primary nav | **Pass** — not present in desktop nav, mobile nav, or right buttons |
| Tour still reachable | **Pass** — linked from `footer.html`, `index.html`, `media.html`, `store.html` |
| Submit Music label consistent | **Pass** — "Submit Music" in desktop nav, mobile nav, footer nav, footer CTA card, 404, privacy, submission-terms. Zero "Submit Song" remain in any HTML or JS |
| Call/Text values unchanged | **Pass** — identical to baseline |
| Store destination unchanged | **Pass** — identical to baseline |
| Mobile toggle updates `aria-expanded` | **Pass** — `false` → `true` on open, `false` on close |
| Escape closes mobile menu | **Pass** — `aria-expanded` returns to `false`, `hidden` class restored |
| Escape restores focus to toggle | **Pass** — `document.activeElement === toggle` after Escape from inside the menu |
| Mobile menu closes after selection | **Pass** — `data-nav-close` handler fires; menu hidden |
| Mobile menu fits viewport | **Pass** at 375 px — no horizontal overflow |
| Book submenu keyboard reachable | **Pass** — focusing the trigger transitions the panel to `pointer-events: auto`, `opacity: 1`, `scale(1)` (measured after the 150 ms transition settles). The next Tab stop is the first submenu item, and `focus-within` holds the panel open |
| Critical nav not hover-only | **Pass** — every Book destination is also in the mobile menu, the footer, and on `book.html` |
| Focus visibility | **Pass** — `outline: 2px solid rgb(247,247,248)`, `outline-offset: 3px` |
| Invalid ARIA in header | **Pass — zero.** `role="menuitem"` and `aria-haspopup` were removed in Stage D; the only `aria-expanded` is the JS-managed mobile toggle |

*Measurement note:* an initial reading suggested the submenu stayed at
`opacity: 0` on focus. That was a sampling artifact — `pointer-events` snaps
instantly while `opacity` animates over 150 ms. Re-measured at 400 ms, the panel
is fully open. No defect.

---

## 7. Responsive visual validation

**64 combinations tested** (16 pages × 4 viewports), each with a screenshot.

| Viewport | Pages | Horizontal overflow | Clipped text | Empty sections | CTA < 40 px | Footer legible |
| --- | --- | --- | --- | --- | --- | --- |
| 320 × 568 | 16 | **0** | **0** | **0** | **0** | yes (734+ chars) |
| 375 × 812 | 16 | **0** | **0** | **0** | **0** | yes |
| 768 × 1024 | 16 | **0** | **0** | **0** | **0** | yes |
| 1440 × 900 | 16 | **0** | **0** | **0** | **0** | yes |

**Zero structural defects across all 64 combinations.** Assertions run per
combination: `documentElement.scrollWidth > clientWidth`; any element whose
bounding box extends past the viewport; any leaf element with hidden overflow
whose content exceeds its box; any `<main> section` with no text, image or
iframe; any `.btn`/`.btn-primary`/`.sv-cta` under 40 px tall.

Additional checks: **200% page scale** on `submit.html` and
`private-corporate.html` produced no horizontal overflow. Sticky mobile CTA on
`submit.html` is hidden above 1024 px and hides itself when the form is in view.
Long headings wrap; cards stack via `md:`/`lg:` breakpoints on every page.

Smallest body text measured is **12.75 px** (`text-xs` at the 17 px root),
used for fine print such as the non-affiliation notice — pre-existing design,
recorded as Minor (E3-01).

**Screenshots:** 82 PNGs, named `<page>__<width>x<height>.png` and
`FAIL_<scenario>__<page>.png`, in the session scratchpad at
`…/scratchpad/screenshots/`. Not committed.

---

## 8. Booking-flow validation

Flow validated end to end: `book.html` → category page → GHL calendar → fallback.
**No booking was submitted.**

### 8.1 Hub — Pass

`book.html`: one `<h1>` ("Book Agu Ocha"), **5** category cards all labelled
"View availability" and correctly targeted, **0 calendars on the hub** (correct —
no calendar duplicated), Call + Text present, Privacy Notice linked.

### 8.2 Category pages — all Pass

| Page | Calendar ID | ID matches | h1 | Breadcrumb → Book | `[data-calendar-frame]` | GHL iframes | `form_embed.js` | `min-height` | Call | Text | Privacy | Overflow |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `private-corporate.html` | `gVxSS7k0YEJNYBFPQILA` | yes | 1 | yes | 1 | 1 | 1 | 850px | yes | yes | yes | no |
| `festivals-tours.html` | `X56pKuTIpw1vu5xdOVpX` | yes | 1 | yes | 1 | 1 | 1 | 850px | yes | yes | yes | no |
| `residencies.html` | `6tuaToT0K8aZFMLYJ2VU` | yes | 1 | yes | 1 | 1 | 1 | 850px | yes | yes | yes | no |
| `brand-activations.html` | `Fwzuvt3S944xnibxng7O` | yes | 1 | yes | 1 | 1 | 1 | 850px | yes | yes | yes | no |
| `collab.html` | `4Zwyq5uTC8G7JdZW4ltW` | yes | 1 | yes | 1 | 1 | 1 | 850px | yes | yes | yes | no |

**No duplicate iframe and no duplicate `form_embed.js`** on any page — exactly one
each, confirmed in the rendered DOM.

### 8.3 Loading and fallback — Pass

Sampled on `private-corporate.html`:

- **at 250 ms:** loading line visible, text "Loading the booking calendar…"
- **at 3250 ms:** loading line `hidden`, calendar iframe height **885 px**

So the message appears initially and clears on iframe load, and the 850 px floor
does not fight the GHL resize (which settled higher). The static fallback card
remains present throughout.

**One third-party behaviour worth recording, not a defect:** the static markup on
all five pages is `scrolling="no"`, verified in source. At runtime the attribute
reads `scrolling="yes"` — **GoHighLevel's own `form_embed.js` mutates it.** Our
markup is intact; an earlier inconsistent reading across pages was purely a
question of whether the sample landed before or after the GHL script ran.

---

## 9. Submit Music validation

**No form was submitted.**

| Check | Result |
| --- | --- |
| `h1` is "Submit Music" | **Pass** — exactly one `<h1>`, text `Submit Music` |
| Suno Vibez shown as current opportunity | **Pass** — present in rendered body text, inside the delimited campaign block |
| GHL form ID unchanged | **Pass** — `hNlynM8h8zLs9jkDlTVW`; rendered `src` is `https://api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW` |
| Form injects **once** | **Pass** — exactly 1 iframe in `#submission-form`; exactly 1 GHL form iframe in the document |
| Form frame id follows the GHL forms convention | **Pass** — `inline-hNlynM8h8zLs9jkDlTVW` |
| `form_embed.js` loaded once | **Pass** — exactly one, `https://link.msgsndr.com/js/form_embed.js` |
| Loading state appears | **Pass** — visible before scroll: "Loading the submission form. If it does not appear, use the options below." |
| Loading state clears on load | **Pass** — element removed once the iframe renders (the mount replacement clears it; no extra hide logic, no race) |
| Static fallback visible | **Pass** — "Prefer not to use the form?" panel, outside the mount so it survives replacement |
| No-JS fallback useful | **Pass** — see §10 |
| Privacy Notice link | **Pass** — inside `#submit-form` |
| Submission Terms link | **Pass** — inside `#submit-form` |
| Call / Text structural | **Pass** — both inside `#submit-form` |
| No user-controlled `innerHTML` | **Pass** — the only `innerHTML` in the codebase is `assets/site.js:31`, whose input is a hardcoded first-party path |
| Legacy routes forward | **Pass** — `/suno-vibez.html` and `/suno-vibez/` both land on `/submit.html` with `h1` "Submit Music" |
| No redirect loop | **Pass** — `submit.html` contains no `http-equiv` refresh; both stubs terminate |
| Canonical → permanent route | **Pass** — `https://aguocha.com/submit` on `submit.html` and on both stubs |
| Future-opportunities area | **Pass** — names no inactive campaign, no dates, no availability. Text: "Suno Vibez is the opportunity open right now. When others open, they will be listed here alongside it." |
| Curator / metrics blocks | **Pass** — both removed at runtime (config empty), as designed |
| Playlist link populated | **Pass** — `https://open.spotify.com/playlist/5UP8zLioz5jelEk4n5sFi8` |

### 9.1 `?track=` parameter — Pass (tested in the browser, not just in isolation)

| Input | Rendered | Injected nodes |
| --- | --- | --- |
| `Midnight Drive` | `“Midnight Drive”` | 0 |
| `Café Noir — Réprise` | `“Café Noir — Réprise”` | 0 |
| `<script>alert(1)</script>` | `Your track` | 0 |
| `<img src=x onerror=alert(1)>` | `Your track` | 0 |
| `Your payment failed call 555-0100-999` | `Your track` | 0 |
| `Visit https://evil.test now` | `Your track` | 0 |
| `Go to www.evil.test` | `Your track` | 0 |
| `" onmouseover="alert(1)` | `Your track` | 0 |

Legitimate titles including accented characters render; every hostile payload
falls back to the neutral default with zero nodes injected into the `<h1>`.

### 9.2 Lane routing never blocks — Pass

| Pasted link | Hint shown | CTA still enabled |
| --- | --- | --- |
| `https://suno.com/song/abc` | Suno submission copy | yes |
| `https://open.spotify.com/track/x` | released-track copy | yes |
| `https://weird.example/track` | "Send it anyway" nudge | yes |
| `not a url at all` | "Send it anyway" nudge | yes |

The security allowlist (`PLAYLIST_HOSTS`, exact-hostname match) and the cosmetic
lane router (`detectLane`, substring, never blocking) remain logically separate —
confirmed at `assets/submit.js:19`/`:34` and `:87`/`:92`.

---

## 10. JavaScript failure validation

Seven scenarios × three representative pages. Blocking done with CDP
`Network.setBlockedURLs` — **no mocking code was introduced into any production
file**, and JS-disabled used `Emulation.setScriptExecutionDisabled`.

| Scenario | Blank page | Main content | Header/footer | Calendar iframe | Form iframe | Call/Text | Privacy/Terms | Fallback | Leaked tech text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | no | yes | injected | 1 | 1 | yes | yes | yes | none |
| **JavaScript disabled** | no | yes | **not injected** | **1** | 0 | yes | yes | yes | none |
| `assets/site.js` blocked | no | yes | **not injected** | **1** | 1 | yes | yes | yes | none |
| `assets/submit.js` blocked | no | yes | injected | 1 | 0 | yes | yes | yes | none |
| `assets/suno-vibez-config.js` blocked | no | yes | injected | 1 | 0 | yes | yes | yes | none |
| GHL `form_embed.js` blocked | no | yes | injected | 1 | 1 | yes | yes | yes | none |
| GHL widget iframe blocked | no | yes | injected | 1 | 1 | yes | yes | yes | none |

**Key results**

- **No blank page in any scenario.** Minimum rendered body text was 451
  characters (JS fully disabled).
- **No technical detail leaked in any scenario** — no `undefined`, `NaN`,
  `TypeError`, `ReferenceError`, `[object …]` or stack text in visible copy.
- **The booking calendar renders in all seven scenarios, including JavaScript
  fully disabled** — the payoff of keeping the iframe in static markup.
- `submit.html` keeps its `<h1>`, Submission Terms, Privacy Notice and the static
  contact panel in **all seven** scenarios.
- With JS disabled, the loading line is correctly suppressed by the
  `<noscript><style>` rule — it does not sit there stale.
- With `suno-vibez-config.js` blocked, `formUnavailable()` replaces the loading
  line with one neutral sentence and the static panel carries the journey.
- Navigation degrades as documented: with JS disabled or `site.js` blocked the
  header and footer are absent (this is finding **M-03** from
  `SECURITY-REVIEW.md`, known and accepted). Main content, headings and all
  in-page contact and legal links remain reachable.

**One Minor defect found here** — E6-01, §19.

---

## 11. Accessibility validation

| Check | Result |
| --- | --- |
| Exactly one `<h1>` per page | **Pass** — 16/16 pages |
| Logical heading hierarchy | **Pass** — zero skipped levels on any page |
| Iframe titles | **Pass** — 0 of 12 iframes missing a `title` |
| Accessible link names | **Pass** — 0 links without an accessible name on any page |
| Invalid ARIA | **Pass** — 0 orphan `role="menuitem"`, 0 `aria-expanded` on non-interactive elements, sitewide |
| `aria-expanded` updates | **Pass** — mobile toggle `false`↔`true`; FAQ triggers report `true` when opened |
| FAQ keyboard operation | **Pass** — triggers are real `<button>`s, focusable, toggle the panel, and update `aria-expanded` |
| Positive `tabindex` | **Pass** — none anywhere (no tab-order manipulation) |
| Keyboard trap | **Pass** — none observed; Escape exits the mobile menu and restores focus |
| Visible focus indicator | **Pass** — `2px solid rgb(247,247,248)`, offset `3px` |
| Image alt text | **Pass** — every `<img>` has meaningful alt: logo "Agu Ocha logo"; the four booking images carry descriptive alt |
| Decorative content | **Pass** — glyphs (`▾`, step numbers, `+`) carry `aria-hidden="true"` |
| Reduced motion | **Pass** — `submit.html` honours `prefers-reduced-motion` for the FAQ marker and disables smooth scrolling |
| 200% zoom | **Pass** — no horizontal overflow on the two pages tested |
| Colour contrast | **Not measured numerically** (§3). Palette is light text on near-black; the focus ring is near-white on near-black |

**One Minor defect found here** — E7-01 (visible label vs accessible name on the
logo), §19. It is pre-existing and byte-identical to baseline.

---

## 12. Metadata and SEO validation

| Check | Result |
| --- | --- |
| Unique page titles | **Pass** — 16 titles, 16 unique, zero duplicates |
| Duplicate canonical conflicts | **Pass** — no page declares more than one canonical |
| Canonicals present | **8 of 14 indexable pages.** Missing on `book.html` and the 5 booking pages → **E8-01 (Minor)**. Correctly absent on the two `noindex` pages |
| Open Graph title / description | **Pass** — present on all 15 indexable pages |
| `og:image` resolves locally | **Pass** — every reference is `img/agu-logo.png`, present at 223,542 bytes. `404.html` has none, which is correct for a `noindex` page |
| `agu-mask-portrait.jpg` references | **Pass — zero remain** in any HTML, JS or XML |
| Sitemap coverage | **Pass** — 14 entries, all resolve to real files |
| Redirect stubs excluded from sitemap | **Pass** — `suno-vibez.html`, `suno-vibez/index.html` absent |
| `thank-you.html` / `404.html` noindex | **Pass** — both declare `noindex`, both excluded from the sitemap |
| `robots.txt` does not block intended pages | **Pass** — `User-agent: *` / `Allow: /` + sitemap declaration. Crawling is permitted, so the `noindex` directives are actually seen |
| One `h1` per page | **Pass** — 16/16 |
| JSON-LD parses | **Pass** — `submit.html` `FAQPage` with 15 items parses without error; no other page carries structured data |
| Structured-data accuracy | **Pass** — the two previously false FAQ cross-references ("acceptance rate at the top of this page", curator "section above") were corrected in Stage C in both the visible accordion and the JSON-LD |

Provisional metadata is marked in-file and treated as **editorial**, not a
structural defect, per instruction.

---

## 13. External destination validation

Tested live over the network.

| Destination | Source page(s) | HTTP | Redirect | HTTPS | Changed on this branch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `https://store.aguocha.com` | header, footer, `store.html` | **200** | none | yes | no | **Pass** |
| `https://tour.aguocha.com` | `tour.html:74` | **DNS failure** | — | n/a | **no — identical to baseline** | **FAIL → E9-01 (Major)** |
| `https://app.aguocha.com/media-request-form` | `media.html:119` | **301 → `/home`** (final 200, title "Agu Ocha — Booking Portal") | yes | yes | **no — identical to baseline** | **FAIL → E9-02 (Major)** |
| `https://chatbotfarm.ai` | `footer.html` | **200** | none | yes | no | **Pass** |
| `https://open.spotify.com/artist/5ymz8gAPHU5sgDUhdhVqzh` | `music.html` | **200** | none | yes | **yes — added in Stage D** | **Pass** (derived from the verified embed ID; confirmed live) |
| `https://open.spotify.com/embed/artist/5ymz8gAPHU5sgDUhdhVqzh` | `music.html` | **200** | none | yes | no | **Pass** |
| `https://open.spotify.com/embed/playlist/5UP8zLioz5jelEk4n5sFi8` | `collab.html`, `submit.html`, `thank-you.html` | **200** | none | yes | no | **Pass** |
| `https://www.youtube.com/embed/rCBM8kuzI3U` | `index.html`, `music.html` | **200** | none | yes | no | **Pass** |
| `https://www.youtube.com/embed/1JGjYV1WcHE` | `music.html` | **200** | none | yes | no | **Pass** |
| `https://www.youtube.com/embed/C_ynqwU8_74` | `book.html` | **200** | none | yes | no | **Pass** |
| `https://www.youtube.com/embed/qIGUNEUQSFY` | `collab.html` | **200** | none | yes | no | **Pass** |
| `https://api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW` | `submit.html` (injected) | **200** | none | yes | no | **Pass** |
| `tel:+17622486242` | sitewide | n/a | — | n/a | no | **Pass** (structural) |
| `sms:+17622486242` | sitewide | n/a | — | n/a | no | **Pass** (structural) |

**All destinations use HTTPS. No external destination was modified during Stage E.**

### 13.1 DNS observations (recorded, not acted on)

| Host | A records | CNAME |
| --- | --- | --- |
| `aguocha.com` | `185.199.109.153`, `185.199.110.153` | — (GitHub Pages addresses — consistent with Pages hosting) |
| `app.aguocha.com` | `104.18.35.90`, `172.64.152.166` | **`sites.ludicrous.cloud`** |
| `store.aguocha.com` | `104.18.35.90`, `172.64.152.166` | **`sites.ludicrous.cloud`** |
| `tour.aguocha.com` | **no record — NXDOMAIN** | — |

`SECURITY-REVIEW.md` §3.3 recorded zero `sites.ludicrous.cloud` references *in the
repository* and left the subdomain platforms Unknown (§17 item 4). Both are now
resolved: `app.` and `store.` are white-label HighLevel hosts via
`sites.ludicrous.cloud`, and `tour.` is **not configured at all**.

---

## 14. GHL integrity verification

Compared against production baseline `7cc37a85ea9b6f971d793d19a24e69f0677d11d4`.

| # | Identifier | Baseline | Now | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `gVxSS7k0YEJNYBFPQILA` | present | present | **unchanged** |
| 2 | `X56pKuTIpw1vu5xdOVpX` | present | present | **unchanged** |
| 3 | `6tuaToT0K8aZFMLYJ2VU` | present | present | **unchanged** |
| 4 | `Fwzuvt3S944xnibxng7O` | present | present | **unchanged** |
| 5 | `4Zwyq5uTC8G7JdZW4ltW` | present | present | **unchanged** |
| 6 | `hNlynM8h8zLs9jkDlTVW` | present | present | **unchanged** |

Every GHL URL extracted from all HTML and JS in both trees — **8 unique, byte-for-byte identical**:

```
https://api.leadconnectorhq.com/js/form_embed.js
https://api.leadconnectorhq.com/widget/booking/4Zwyq5uTC8G7JdZW4ltW
https://api.leadconnectorhq.com/widget/booking/6tuaToT0K8aZFMLYJ2VU
https://api.leadconnectorhq.com/widget/booking/Fwzuvt3S944xnibxng7O
https://api.leadconnectorhq.com/widget/booking/gVxSS7k0YEJNYBFPQILA
https://api.leadconnectorhq.com/widget/booking/X56pKuTIpw1vu5xdOVpX
https://api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW
https://link.msgsndr.com/js/form_embed.js
```

| Confirmation | Result |
| --- | --- |
| IDs unchanged | **Confirmed** |
| iframe `src` values unchanged | **Confirmed** |
| Form URL unchanged | **Confirmed** |
| `form_embed.js` sources unchanged (including the two-host split) | **Confirmed** — `link.msgsndr.com` on 3 pages + `submit.js`; `api.leadconnectorhq.com` on 2 pages, exactly as baseline. L-07 remains deferred pending GHL confirmation |
| No local form fields added | **Confirmed** — no `<form>` element and no submission input exists in any page except the hero link field, which posts nowhere |
| No calendar replaced | **Confirmed** |
| No GHL credential introduced | **Confirmed** — no key, token or private webhook in any added line |
| No form or calendar submitted during testing | **Confirmed** — every interaction stopped at the rendered UI |

---

## 15. Console and network review

13 pages instrumented for console output, exceptions, failed requests, mixed
content and duplicate scripts.

| Page | Console errors | Warnings | Network failures | Mixed content | Duplicate scripts |
| --- | --- | --- | --- | --- | --- |
| all 13 tested | **0** | 1 each | 0 (one exception below) | **0** | **0** |

- **Zero console errors and zero uncaught exceptions across every page.**
- **Exactly one warning per page**, identical everywhere:
  `cdn.tailwindcss.com should not be used in production…` — a **third-party
  warning**, and precisely finding **M-07**, deferred to the Tailwind
  modernization phase. Not a local defect.
- **Zero mixed content** — every subresource is HTTPS.
- **Zero duplicate script loads** on any page.
- **Zero CORS errors.** GHL, YouTube and Spotify frames are cross-origin by
  design; no parent-page error results, which is the **expected cross-origin
  limitation**, not a defect.
- One `net::ERR_ABORTED` on `tour.html` in a single run, with no URL attached and
  **not reproducible** on other pages or runs. Most likely the zero-byte
  `favicon.ico` (E8-02) or a benign navigation abort. Classified **not
  reproducible**; recorded for completeness.

---

## 16. Content-integrity backlog

No content was edited during validation.

| Finding | Detail | Class |
| --- | --- | --- |
| Exposed placeholder text | **None.** Zero `lorem`, `ipsum`, `VIDEO_ID`, `PLAYLIST_ID`, `TRACK_ID`, `TBD`, `Coming soon`, `[BUSINESS NAME]`, `<FORM_ID>` in any user-visible HTML. The one `myplaylist` hit is inside an HTML comment documenting its removal | Pass |
| "Submit Song" remnants | **None in HTML or JS.** Remaining hits are in the three governing documents (historical record) and `README.md:52` | Editorial |
| Broken cross-references | **None user-visible.** The two positional-claim hits are inside explanatory comments | Pass |
| References to nonexistent sections | **None.** The two false FAQ cross-references were corrected in Stage C in both visible copy and JSON-LD |Pass |
| Unsupported factual claims | None introduced. Tour states no dates; Music states no release counts or chart claims; Media offers no press pack (the `press/` directory is empty) | Pass |
| Inconsistent page labels | **None** — "Submit Music" is uniform across header, mobile nav, footer nav, footer CTA, 404, privacy, submission-terms |Pass |
| Editorial markers | **39 `EDITORIAL REVIEW REQUIRED` comments across 12 pages** (submit 10, index 6, book 4, media 4, music 4, tour 3, collab 2, store 2, and 1 on each of the 4 booking pages) plus 1 `OPERATOR TODO` | Editorial |
| Duplicate / competing CTAs | `index.html` and `book.html` each carry 6 `btn-primary` elements in `<main>`, so neither has a single dominant action | **Minor → E12-01** |
| `README.md` staleness | 6 stale references: `assets/suno-vibez.js` (file does not exist), `press/` and `rider/` (both empty), "Submit Song" (label changed), `<!-- GHL_*_FORM_LINK -->` (no such comments), `agu-mask-portrait` (references now removed) | Editorial |

---

## 17. Regression comparison

Against baseline `7cc37a85ea9b6f971d793d19a24e69f0677d11d4`.

| Aspect | Result |
| --- | --- |
| **Routes preserved** | **20 of 20.** Confirmed via `git ls-tree` on both trees |
| **Routes added** | **0** |
| **Routes removed** | **0** — no production route was deleted |
| **Files added** | 5: `.gitignore`, `assets/site.css`, and the 3 governing documents |
| **Files deleted** | **0** |
| **Embed IDs changed** | **0** — all 6 identical (§14) |
| **External destinations changed** | **0 changed, 0 removed.** One added: the Spotify artist URL on `music.html`, derived from the verified embed ID and confirmed HTTP 200. Five self-referential canonicals added |
| **Shared navigation changes** | Tour removed from primary nav (page retained, reachable from 4 pages); Collaborations moved under Book; "Submit Song" → "Submit Music"; invalid ARIA removed; Privacy Notice and Submission Terms added to the footer |
| **Page-purpose changes** | `submit.html` identity became permanent "Submit Music" with Suno Vibez as the featured campaign. `book.html` became a true hub. All other purposes unchanged |
| **JavaScript behaviour changes** | `site.js` gained `initCalendarStatus()`; `submit.js` replaced `fallbackPanel()` with `formUnavailable()` and added two URL validators (closing L-02); `thank-you.js` added `safeTrackName()` (closing L-01). All duplicate-load guards preserved. Still exactly one `innerHTML` in the codebase |
| **Risk areas** | (1) the static-first calendar's dependence on GHL's `form_embed.js` resize contract — validated working, height settles at 885 px; (2) the two pre-existing broken external destinations (§13); (3) extensionless `/submit` unverified outside deployment |
| **Rollback points** | `1c9f7e0` (A), `6fe3063`+`7762ccf` (B), `a425ab8`+`731715e` (C), `bdb93df`+`df04032`+`4c41134` (D). Each stage is independently revertible; full rollback to production is `git reset` to `7cc37a8` |

---

## 18. Blocking defects

**None.**

No defect prevents a primary user journey, breaks a route, breaks navigation,
hides a form or calendar without a fallback, exposes a secret, or makes the site
materially unusable. Consequently **no production file was modified during
Stage E** — the preferred outcome.

---

## 19. Non-blocking defects

### Major (2) — both pre-existing, both require operator action outside the repository

**E9-01 — `tour.aguocha.com` does not resolve (DNS NXDOMAIN)**
- Affected: `tour.html:74`, the page's **primary CTA** ("Sign Up for Tour Updates")
- Evidence: `Resolve-DnsName tour.aguocha.com` → no record; `GET` → "No such host is known"
- Impact: the Tour journey's only primary action is a dead link. Also referenced from `index.html` and `media.html` as "Open Tour", so visitors are routed toward it.
- **Provenance: byte-identical to baseline** `7cc37a8` — not introduced or changed by this branch
- Action: operator must configure DNS for `tour.` or supply a working destination. **I did not change it** — E9 prohibits modifying external destinations
- Mitigation already present: `tour.html` carries Call/Text fallback and a Book CTA

**E9-02 — Media request form redirects to a booking portal home page**
- Affected: `media.html:119`, the page's **primary CTA** ("Media Request Form")
- Evidence: `HEAD` → `301` → `https://app.aguocha.com/home`; `GET` follows to HTTP 200 with title **"Agu Ocha — Booking Portal"** (137 KB). It contains form markup, but it is the portal home, not a media request form
- Impact: press enquiries land on a generic portal page rather than a media form
- **Provenance: URL byte-identical to baseline** (only a button padding class changed in Stage D)
- Action: operator must confirm the correct GHL URL, or restore the `/media-request-form` funnel. GHL configuration is out of scope here
- Mitigation already present: `media.html` carries Call/Text fallback

### Minor (6)

**E8-01 — Six indexable pages lack a canonical URL.** `book.html`,
`private-corporate.html`, `festivals-tours.html`, `residencies.html`,
`brand-activations.html`, `collab.html`. All six are in `sitemap.xml` and
indexable; the other 8 indexable pages have canonicals. Those six files were
outside Stage D's permitted file set, which is why the inconsistency exists.
Low SEO impact; one line each to fix.

**E7-01 — Logo accessible name does not contain its visible label.**
`header.html:21` has `aria-label="Home"` while the link's visible text is
"Agu Ocha". WCAG 2.1 SC 2.5.3 (Label in Name, Level A) expects the accessible
name to contain the visible text, so a voice-control user saying "click Agu Ocha"
would not match. **Pre-existing — byte-identical to baseline.** Affects every page
via the shared header.

**E6-01 — Stale booking loading line when `site.js` is blocked but JS is enabled.**
`initCalendarStatus()` lives in `site.js`, so if only that file fails the
"Loading the booking calendar…" line never clears, while the calendar itself
loads normally (static markup). `<noscript>` does not fire because JS is on. The
visitor sees a working calendar with a stale line above it — cosmetic, and the
wording is not misleading. `submit.html` is unaffected because its equivalent line
is worded to stay accurate if it lingers.

**E8-02 — `favicon.ico` is 0 bytes.** Referenced by all 18 full pages. Browsers
fall back to a default glyph. Awaiting the operator-supplied asset (Stage D
deferred it deliberately); deleting the file was prohibited and removing the
`<link>` would not stop the implicit `/favicon.ico` request.

**E3-01 — Smallest body text is 12.75 px.** Used for fine print such as the
non-affiliation notice. Pre-existing design decision, not introduced here.
Flagged for editorial/design consideration only.

**E12-01 — No single dominant CTA on `index.html` and `book.html`.** Each has 6
`btn-primary` elements in `<main>`. On `book.html` this is arguably correct
(five parallel category choices); on `index.html` the three action cards plus
campaign and contact CTAs compete. D11 asked for one clear primary action per
page. Editorial/design judgement rather than a structural fault.

### Informational (2)

**E11-01 — Tailwind CDN production warning on every page.** One console warning
per page: `cdn.tailwindcss.com should not be used in production`. This is exactly
finding **M-07** and is deferred to the Tailwind modernization phase. Third-party
warning, not a local defect.

**M-03 residual — no navigation without JavaScript.** With JS disabled or
`site.js` blocked, the injected header and footer are absent on every page. Known,
documented in `SECURITY-REVIEW.md`, and accepted; main content, headings, and all
in-page contact and legal links remain reachable. On `index.html` specifically
this means no Privacy Notice link is reachable in the no-JS state, since that page
relies on the footer for it.

---

## 20. Editorial backlog

For the page-by-page review, not structural failures.

1. **39 `EDITORIAL REVIEW REQUIRED` markers across 12 pages** — provisional
   metadata, leads, campaign pitch, eligibility, process steps, FAQ wording,
   holding copy. Highest density: `submit.html` (10), `index.html` (6).
2. **1 `OPERATOR TODO`** — a purpose-built 1200×630 Open Graph image for
   `submit.html`; the square logo is currently used with `summary_large_image`.
3. **`README.md` has 6 stale references** (§16) — documentation drift only.
4. **Spotify artist URL needs operator confirmation** — `music.html` links
   `open.spotify.com/artist/5ymz8gAPHU5sgDUhdhVqzh`, derived from the verified
   embed ID and confirmed HTTP 200, but not confirmed as the intended profile.
5. **Curator and metrics configuration is empty** — the "Who listens" and metrics
   blocks self-remove at runtime. Populating them, or accepting their absence, is
   an operator decision (also `REMEDIATION-PLAN.md` decisions 10 and 11).
6. **`thank-you.html` remains unreachable from any repository-controlled flow** —
   its only inbound path is a GoHighLevel post-submit redirect that was not
   verified and not changed. Structurally validated and ready; reachability is
   operator configuration.

---

## 21. Manual operator checks required

1. **Visual review of the 82 screenshots** (or the live preview) for aesthetics
   and brand judgement — the automated pass asserted structure, not taste.
2. **Fix or replace `tour.aguocha.com`** (E9-01) — DNS or a new destination.
3. **Confirm the correct media request URL** (E9-02) in GoHighLevel.
4. **Confirm extensionless routing** on the real deployment: `/submit`,
   `/thank-you`, `/suno-vibez`. Not testable locally.
5. **Confirm the GHL post-submit redirect** points at `thank-you.html`.
6. **Confirm the live GHL form's fields and consent strings** — the operator has
   updated the form; the repository cannot see inside it. `README.md:98-108`
   records the previously observed defects, which may now be resolved.
7. **Supply a real `favicon.ico`** and the 1200×630 OG image.
8. **Confirm the Spotify artist profile URL.**
9. **Measure live HTTP response headers** (`curl -sI https://aguocha.com/`) —
   `SECURITY-REVIEW.md` §14 explains that no repository file can set them.
10. **Perform one real end-to-end submission and one real booking** — deliberately
    not done here; both are operator actions.

---

## 22. Recommendation

**READY WITH WARNINGS.**

Ready for:
1. **Operator visual review** — 82 screenshots at four viewports are available.
2. **Page-by-page editorial review** — 39 provisional areas are explicitly marked.
3. **Draft pull-request preparation** — 20/20 routes preserved, all GHL integrity
   confirmed against baseline, no blocking defects.

**Warnings the operator should read before launch:** the two Major external
destination defects (E9-01, E9-02) are live on production today. They are not
regressions from this branch — both URLs are byte-identical to the baseline — but
each is the primary call to action on its page, and both need action outside this
repository. Extensionless `/submit` also remains unverified until deployed.

---

## 23. Files inspected

**All 20 HTML routes** rendered and probed in a real browser: `index.html`,
`music.html`, `book.html`, `private-corporate.html`, `festivals-tours.html`,
`residencies.html`, `brand-activations.html`, `collab.html`, `submit.html`,
`suno-vibez.html`, `suno-vibez/index.html`, `media.html`, `tour.html`,
`store.html`, `privacy.html`, `submission-terms.html`, `thank-you.html`,
`404.html`, plus the shared fragments `header.html` and `footer.html`.

**JavaScript and CSS:** `assets/site.js`, `assets/site.css`, `assets/submit.js`,
`assets/suno-vibez-config.js`, `assets/thank-you.js`, `assets/analytics.js`.

**Configuration:** `sitemap.xml`, `robots.txt`, `CNAME`, `.nojekyll`,
`.gitignore`, `README.md`, `scripts/check-links.mjs`.

**Baseline tree** `7cc37a8` extracted and compared in full.

**Assets checked for resolution:** `img/agu-logo.png` (223,542 B), `favicon.ico`
(0 B), and the four booking images.

---

## 24. Commands and tools used

No production file was modified. No form or booking was submitted.

| Purpose | Tool / command |
| --- | --- |
| Preconditions | `git rev-parse`, `git status --porcelain`, `git cat-file -t` on all 8 stage commits, `git ls-files` |
| Internal links | `node scripts/check-links.mjs` → 20 files, 0 errors, 0 warnings |
| Local server | `python -m http.server 8971` (detached), repository root |
| Browser | Chrome 150 `--headless=new --remote-debugging-port=9222 --hide-scrollbars` |
| Driver | Custom zero-dependency CDP client (Node 22 `fetch` + global `WebSocket`), in the session scratchpad. Nothing installed, nothing committed |
| Route inventory | `Page.navigate` + `Runtime.evaluate` per route; title, h1 count, canonical, robots, header/footer injection, iframes, externals, overflow |
| Responsive | `Emulation.setDeviceMetricsOverride` at 320×568, 375×812, 768×1024, 1440×900; `Page.captureScreenshot` × 82 |
| Zoom | `Emulation.setPageScaleFactor: 2` |
| JS-failure | `Emulation.setScriptExecutionDisabled` and `Network.setBlockedURLs` — no mocking code added to any production file |
| Console / network | `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Log.entryAdded`, `Network.loadingFailed`, `Network.responseReceived` |
| External destinations | `Invoke-WebRequest` HEAD then GET with redirect following |
| DNS | `Resolve-DnsName` for `aguocha.com`, `app.`, `store.`, `tour.` |
| GHL integrity | `git ls-tree` + `git show` over both trees, extracting every `leadconnectorhq`/`msgsndr` URL and set-comparing |
| Regression | `git ls-tree -r --name-only` route comparison; `git diff --name-status` for added/deleted files |
| Content integrity | `Select-String` for placeholder tokens, "Submit Song", editorial markers, positional cross-references |

---

## 25. Limitations

1. **Extensionless routing untested** — `/submit`, `/thank-you`, `/suno-vibez`
   depend on GitHub Pages behaviour that the local server does not reproduce. No
   claim is made that they work.
2. **No automated accessibility audit** — no axe/pa11y was installed, per
   instruction. Accessibility results are targeted assertions, not a full audit;
   colour contrast was not computed numerically.
3. **Screenshots not individually assessed for design quality** — provided for
   operator judgement.
4. **GHL interiors invisible** — fields, consent text, workflows, notifications,
   retention and the post-submit redirect were neither inspected nor changed.
5. **No live production testing** — everything ran against a local server. Real
   HTTP response headers, HSTS, and Pages configuration remain unverified
   (`SECURITY-REVIEW.md` §14, §17).
6. **`form_embed.js` is third-party and opaque** — its resize handshake was
   observed working (885 px) but its internals were not audited. It also mutates
   the `scrolling` attribute at runtime, which is recorded as third-party
   behaviour.
7. **One `net::ERR_ABORTED` was not reproducible** and is reported as such rather
   than attributed to a specific cause.
8. **Reduced-motion and 200% zoom were spot-checked**, not exhaustively tested
   across all pages.
9. **No copy, legal, or design judgement** is offered. Provisional wording is
   reported as editorial work, not as defects.

---

*End of Stage E validation. No production website file was modified. No form or
booking was submitted. No deployment occurred. Awaiting page-by-page editorial
review.*

---

## Implementation note — 2026-07-30

Added on branch `rebuild/high-conversion-site`. This note is **additive**: no
finding above has been altered. The findings remain accurate as of the date they
were written.

Two externally broken destinations recorded above have since been **retired from
the public site**:

- `https://tour.aguocha.com` — removed from `tour.html`. The page was rebuilt as
  an on-site Tour & Appearances signup. The subdomain itself still does not
  resolve; DNS remains an operator action.
- `https://app.aguocha.com/media-request-form` — removed from `media.html`.
  Media requests are now handled in-page at `media.html#media-request`.

Both destinations are intentionally still described above as they were found, so
the audit trail stays intact. Current status is tracked in
`docs/GHL_OPERATOR_ACTIONS.md` and `docs/SITE_REBUILD_AUDIT.md`.
