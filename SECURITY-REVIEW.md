# Security, Reliability and Submission-Architecture Review — aguocha.com

Stage 2. Read-only review. No production file was modified.

- Repository: `chatbotfarm/agu-ocha`
- Branch: `feature/submit-music`
- Production baseline: `7cc37a85ea9b6f971d793d19a24e69f0677d11d4`
- Inventory commit (factual starting record): `a45dab57ade4238d587775cfd61e8cd2fe2ff574`
- Date: 2026-07-29
- Companion document: `SITE-INVENTORY.md` (treated as authoritative; every inventory
  claim relied on here was independently re-verified, and one was corrected — see §4.3)

---

## 1. Executive summary

**There are no Critical findings and no High findings.** No secret, credential,
token, private webhook, private endpoint, or administrative URL exists in the
working tree or in any of the 27 commits in history. No arbitrary-code-execution
path exists in first-party code. No evidence of compromise was found.

The site is a static, dependency-free set of pages whose first-party JavaScript is
written defensively and, in the areas that matter most, correctly. Specifically
verified as sound: every external URL that reaches an iframe `src` passes an
`https:` + exact-hostname allowlist check; the user's pasted track link reaches the
GoHighLevel form through `URLSearchParams.set()`, which encodes it and cannot
change the frame's origin; there is exactly one `innerHTML` assignment in the
entire codebase and its input is a hardcoded same-origin path; and there is no
`eval`, `Function()`, `document.write`, `insertAdjacentHTML`, `outerHTML`,
`srcdoc`, cookie, `localStorage`, or inline event handler anywhere. Those are the
places a review of a page like this would expect to find a real vulnerability, and
they are clean.

The genuine problems are **reliability and disclosure**, not exploitation:

1. **The submission funnel has a single point of total failure.** `submit.html:344`
   ships an empty `<div id="submission-form">`. The GoHighLevel form exists only if
   `assets/submit.js` loads and runs. The page's only `<noscript>` block
   (`submit.html:104`) fixes the FAQ accordion, not the form. If that one script is
   blocked, cached stale, or throws, a visitor sees a heading, the words "Takes a
   minute or two," and empty space — with no form and no contact route. The four
   booking pages, by contrast, carry their iframes in markup and degrade better.

2. **Four of the five booking calendars can render clipped and unscrollable.** They
   combine `scrolling="no"` with `overflow:hidden` and **no** `min-height`, and rely
   entirely on `form_embed.js` completing a `postMessage` resize handshake. If that
   handshake does not complete, the iframe holds the HTML default height with
   scrolling suppressed. Because those pages' `<main>` contains only the iframe and
   no heading or fallback text, the failure mode is a blank or truncated page.
   `collab.html:104` sets `min-height:850px` and is the only one partly protected.

3. **`thank-you.html` is currently unreachable.** The page that names a concrete
   reply-by date and carries the follow-playlist call to action depends on a
   post-submit redirect that must be set inside GoHighLevel. The repository records
   that as not done (`assets/suno-vibez-config.js:29-31`, `README.md:109`).

4. **The privacy notice and submission terms are not in the global footer.** The four
   booking pages collect a name, email and phone number through an embedded
   third-party processor while offering no link to the privacy notice and no
   on-page statement that GoHighLevel receives the data.

5. **Marketing consent is bundled with the transactional submission.**
   `submit.html:280` and FAQ 13 (`submit.html:426`) describe a recurring monthly
   playlist email as a consequence of submitting, with no separate opt-in visible
   anywhere on the site. The repository additionally records that the live form's
   SMS consent text still contains unfilled placeholders — `[BUSINESS NAME]` and
   `[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]` — shown to real submitters, and that the
   rights-confirmation checkbox is labelled "Option 1" rather than stating the
   representation being made (`README.md:98-108`). This is the finding most
   deserving of counsel's attention.

6. **`https://cdn.tailwindcss.com` is a production runtime dependency on all 18
   pages**, unversioned and without Subresource Integrity. This is rated Medium on
   impact × likelihood, not because a best practice is absent: the impact of a
   compromise would be total for the origin, but there is no present defect and no
   exploitation path under anyone's control. Its more immediate effect is that a
   slow, blocked, or failed CDN renders every page unstyled. It also means a
   meaningful Content-Security-Policy is not achievable while it remains.

To be explicit about a common over-call: `assets/thank-you.js:48-57` reflects the
`?track=` query parameter onto the page. **This is not cross-site scripting** — the
value is assigned with `textContent` and truncated to 120 characters. It is a
text-injection vector usable for social engineering on a legitimate `aguocha.com`
URL, which is a real but Low-severity issue.

Finding counts: **0 Critical, 0 High, 7 Medium, 10 Low, 12 Informational.**

---

## 2. Scope

### In scope

- All 20 HTML files, 5 `assets/*.js` files, and `scripts/check-links.mjs`.
- `CNAME`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `README.md`.
- All 27 commits and every text blob reachable from any ref, including deleted files.
- The six GoHighLevel assets (5 calendars, 1 form) and the one external GHL-hosted page.
- All external dependencies, routing, canonicalisation, and asset integrity.
- Privacy and submission disclosure text as published.

### Out of scope

- UX, conversion, or visual design assessment.
- Any implementation, fix, or file modification.
- Live testing of any kind: no form submission, no calendar interaction, no HTTP
  request to any production host, no DNS query.
- The GoHighLevel account interior: form field configuration, workflows, redirect
  settings, calendar availability, notification routing.
- GitHub repository settings: visibility, branch protection, Pages configuration.
- Legal sufficiency of the privacy notice or submission terms. Language is flagged
  for counsel where warranted; it is not assessed or rewritten.

### Authority exercised

Read-only inspection plus one new file, `SECURITY-REVIEW.md`. No existing file was
created, edited, renamed, or deleted.

---

## 3. Method

1. Verified the four required git preconditions before any other work (§21).
2. Re-read every HTML and JavaScript file in full rather than relying on the
   Stage 1 inventory.
3. Enumerated every blob in every commit reachable from all refs and scanned the
   text blobs twice: once with a broad keyword net (`api_key`, `secret`, `passw`,
   `bearer`, `token`, `webhook`, `.env`, `SMTP`, `CLOUDFLARE`, `TWILIO`, and
   others) and once with high-confidence provider formats (`ghp_`, `github_pat_`,
   `sk-`, `xox[baprs]-`, `AKIA…`, `AIza…`, JWT shape, `-----BEGIN`, Slack and
   Discord webhook paths, `pk_live_`/`sk_live_`, `SG.…`). Every broad-net hit was
   read and dispositioned.
4. Recovered and reviewed the two files deleted from history —
   `agu_ocha_index_v2.html` and `assets/suno-vibez.js`.
5. Enumerated every `<iframe>` in the tree and recorded, per frame, the presence of
   `title`, `referrerpolicy`, `loading`, `sandbox`, `min-height`, and
   `scrolling="no"`.
6. Grepped for every dangerous JavaScript sink and for `integrity=`, `crossorigin=`,
   `http-equiv`, `name="referrer"`, `noscript`, `mailto:`, and `<h1>`.
7. Traced the submission path by reading call sites rather than inferring from
   filenames, following each config key from `assets/suno-vibez-config.js` to its
   consumer.
8. Ran the repository's own `node scripts/check-links.mjs` — the only command
   executed against site code — and then established what it does *not* check.
9. Classified every dynamic DOM insertion by the trust level of its data source.

No network request was made. No production endpoint was contacted.

---

## 4. Repository and deployment assumptions

### 4.1 Established from the repository (verified)

- Static site, no build step, no dependency manifest, no server-side code.
- `CNAME` contains `aguocha.com`; `.nojekyll` (0 bytes) disables Jekyll.
- No `.github/` directory, so no CI validates anything before deployment.
- All 27 commits before this branch are on `main`; history shows no merge commits,
  i.e. work has been committed directly to the deployment branch.
- No `.gitignore` exists in the repository.

### 4.2 Assumed, not verifiable from the working tree (operator confirmation)

- GitHub Pages serves the repository root of `main` (asserted at `README.md:130`).
- The custom domain and "Enforce HTTPS" are configured in Pages settings.
- No reverse proxy (Cloudflare or otherwise) currently fronts the domain. If one
  does, several §16 recommendations become immediately actionable rather than
  requiring new infrastructure.
- Repository visibility. Repository visibility is treated here as **not** a
  vulnerability in itself; it only determines whether §15's "never commit" list is
  urgent or merely prudent.

### 4.3 Correction to the Stage 1 inventory

`SITE-INVENTORY.md` §1.7 lists `.claude/settings.local.json` as a present
configuration file. It exists on disk but is **not tracked by git and has never
appeared in any commit**. It is excluded by a *machine-local global* gitignore at
`C:\Users\mintl/.config/git/ignore`, not by anything in this repository.

The practical consequence is the finding, not the file: the only thing keeping
local agent configuration out of the published repository is a setting on one
developer's machine. See I-01.

---

## 5. Severity definitions

As supplied in the review brief, applied literally.

| Severity | Definition |
| --- | --- |
| **Critical** | Immediate unauthorized access, secret exposure, arbitrary code execution, active compromise, or direct loss of privileged control. |
| **High** | A practical vulnerability with serious impact and a credible exploitation path. |
| **Medium** | A meaningful security, privacy, integrity, or reliability issue that should be corrected but does not provide immediate privileged compromise. |
| **Low** | Limited-impact weakness, defense-in-depth gap, spam exposure, minor privacy issue, or technical condition with low exploitation value. |
| **Informational** | Technical debt, maintainability concern, missing documentation, optimization opportunity, or condition requiring operator awareness. |

Two deliberate calibration decisions, stated so they can be challenged:

- **Nothing is rated High.** A High rating requires a credible exploitation path.
  The most impactful item in this report (M-07, the Tailwind CDN) has high impact
  but its exploitation path runs through compromising a third party, which is not a
  vulnerability in this repository. The most disruptive items (M-01, M-02) are
  failure modes, not attacks.
- **The absence of a modern header or best practice is not, by itself, a finding.**
  Missing CSP, HSTS, COOP, CORP, and `X-Frame-Options` are consolidated into §14
  with an honest account of what is achievable, rather than being listed as five
  separate findings against a platform that cannot set them.

---

## 6. Findings summary table

| ID | Title | Severity | Status | File : line |
| --- | --- | --- | --- | --- |
| M-01 | Submission form is entirely JS-dependent with no non-JS fallback | Medium | Verified | `submit.html:344`, `:104`; `assets/submit.js:317-337` |
| M-02 | Four booking calendars can render clipped and unscrollable, on pages with no fallback content | Medium | Verified | `private-corporate.html:41`; `festivals-tours.html:42`; `residencies.html:41`; `brand-activations.html:41` |
| M-03 | Sitewide navigation and footer are JS-injected and fail silently | Medium | Verified | `assets/site.js:23-35`, `:109-110` |
| M-04 | `thank-you.html` is unreachable — post-submit redirect not configured | Medium | Operator confirmation | `assets/suno-vibez-config.js:29-31`; `thank-you.html` (whole file) |
| M-05 | Privacy notice and submission terms absent from global footer; booking pages collect PII with no disclosure | Medium | Verified | `footer.html:16-35`; `private-corporate.html:37-45` and 3 siblings |
| M-06 | Marketing email/SMS consent bundled with transactional submission; consent and rights text defective in the live form | Medium | Operator confirmation | `submit.html:280`, `:426`; `README.md:98-108` |
| M-07 | `cdn.tailwindcss.com` is an unpinned production runtime script on all 18 pages | Medium | Verified | 18 files, `<head>` (§11.1) |
| L-01 | `?track=` URL parameter reflected into the H1 (text injection, not XSS) | Low | Verified | `assets/thank-you.js:48-57`; `thank-you.html:44` |
| L-02 | Curator `photo` and `links[].url` bypass the file's own URL validation | Low | Verified | `assets/submit.js:419-441` |
| L-03 | Seven iframes have no `title` attribute, including all five GHL calendars | Low | Verified | §9.2 table |
| L-04 | No `referrerpolicy` on any in-markup iframe | Low | Verified | §9.2 table |
| L-05 | `img/agu-mask-portrait.jpg` missing — broken `og:image` on 11 pages | Low | Verified | 11 files, line 14 |
| L-06 | `favicon.ico` is 0 bytes but explicitly referenced by all 18 pages | Low | Verified | `favicon.ico`; all pages `<head>` |
| L-07 | Two different GHL hosts serve the same `form_embed.js` | Low | Verified | `residencies.html:42`, `brand-activations.html:42` vs 3 others |
| L-08 | No email contact anywhere; privacy rights requests are SMS/phone only | Low | Verified | `privacy.html:107-113`; whole-tree grep |
| L-09 | Published claims reference page sections that are removed at runtime | Low | Verified | `submit.html:381`, `:436`, `:481` |
| L-10 | Data retention period not stated | Low | Verified | `privacy.html:83-95` |
| I-01 | No repository `.gitignore`; secret hygiene depends on one machine's global ignore | Informational | Verified | repository root; §4.3 |
| I-02 | No CI; `check-links.mjs` is never run automatically and deployment is direct from `main` | Informational | Verified | `scripts/check-links.mjs`; absence of `.github/` |
| I-03 | `check-links.mjs` blind spots cause a false "0 errors" signal | Informational | Verified | `scripts/check-links.mjs:18`, `:54` |
| I-04 | Internal links target `submit.html` while canonical and sitemap use `/submit` | Informational | Verified | `header.html:71`, `:109`; `footer.html:33`, `:53`; `404.html:61` |
| I-05 | "Suno Vibez" is hard-coded page identity; the lane model is not extensible to more playlists | Informational | Verified | `submit.html:116-121`; `assets/suno-vibez-config.js:46`, `:62-75`; `assets/submit.js:56-78` |
| I-06 | Five pages have no `<h1>` | Informational | Verified | `book.html`, 4 booking pages |
| I-07 | `store.html` is in the sitemap but reachable from no navigation | Informational | Verified | `sitemap.xml:15`; `header.html:66` |
| I-08 | FAQ copy duplicated between visible HTML and JSON-LD | Informational | Verified | `submit.html:364-437` vs `:473-495` |
| I-09 | `assets/analytics.js` filename invites ad-blocker blocking | Informational | Verified | `submit.html:499`; `assets/submit.js:16` |
| I-10 | Sitewide public phone number is scrapeable — spam exposure, not a leak | Informational | Verified | `header.html:75-76`; `assets/suno-vibez-config.js:109` |
| I-11 | Redirect stubs are client-side only, and their inline scripts constrain future CSP | Informational | Verified | `suno-vibez.html:10`, `:34`; `suno-vibez/index.html:10`, `:34` |
| I-12 | Deleted files in git history reviewed; no secrets, but history retains removed third-party links | Informational | Verified | `agu_ocha_index_v2.html`, `assets/suno-vibez.js` (deleted) |

---

## 7. Detailed findings

### M-01 — Submission form is entirely JS-dependent with no non-JS fallback

- **Severity:** Medium
- **Status:** Verified
- **Affected file:** `submit.html`; `assets/submit.js`
- **Lines:** `submit.html:344`, `submit.html:104`, `submit.html:497-501`;
  `assets/submit.js:317-337`, `:238-311`

**Evidence.** `submit.html:344` is `<div id="submission-form" class="mt-6"></div>` —
empty in the served markup. The GoHighLevel iframe is constructed only inside
`renderForm()` (`assets/submit.js:238-311`), which is invoked either by an
`IntersectionObserver` when the mount comes within 400px of the viewport
(`:317-337`) or by the hero CTA click handler (`:119-129`). The page's sole
`<noscript>` block is `submit.html:104`, and it contains only
`[data-faq-panel]{display:block !important}` — it addresses the FAQ accordion and
says nothing about the form. `assets/submit.js` is loaded `defer` at
`submit.html:501`, last of four scripts.

**Risk.** Complete loss of the submission funnel with no visible error and no
alternative route. The page still renders its heading, the copy "Takes a minute or
two" (`:340`), and the trailing reassurances at `:346-354`, so a visitor sees a
page that appears to be working and simply has nothing to fill in.

**Failure conditions.** JavaScript disabled; `assets/submit.js` blocked by an
extension or network filter; a stale cached copy throwing on load; a syntax or
runtime error introduced by a future edit; `IntersectionObserver` present but the
observer never firing. Note the fallback panel at `assets/submit.js:196-236` does
*not* cover this — it only renders when `submit.js` **is** running and
`CFG.ghlFormUrl` fails validation. There is no fallback for `submit.js` itself not
running.

**Recommended correction.** Place the GHL form iframe in static markup as the
baseline, and let JavaScript enhance it (apply the `track_link` prefill, defer
loading) rather than being responsible for its existence. Alternatively, add a
`<noscript>` block inside `#submission-form` carrying the same Text/Call routes
that `fallbackPanel()` already builds, so the no-JS path matches the
already-designed degraded path. Either approach is a change to `submit.html` and is
out of scope for this stage.

**Compatibility impact.** Static-first embedding forfeits the lazy-load benefit at
`assets/submit.js:317-337` unless `loading="lazy"` is used on the static frame.
Prefill would need to be applied by rewriting `src` on the existing frame rather
than creating it, which `form_embed.js` tolerates only before it attaches — this
needs care, and is the reason the current design chose full construction in JS.

- **Operator approval required:** Yes — it changes a production page.
- **Belongs in this project:** Yes. This is the core of the Submit Music work.
- **GHL configuration involved:** No.

---

### M-02 — Four booking calendars can render clipped and unscrollable, on pages with no fallback content

- **Severity:** Medium
- **Status:** Verified
- **Affected files:** `private-corporate.html`, `festivals-tours.html`,
  `residencies.html`, `brand-activations.html`
- **Lines:** `private-corporate.html:37-45` (iframe at `:41`);
  `festivals-tours.html:38-46` (`:42`); `residencies.html:37-45` (`:41`);
  `brand-activations.html:37-45` (`:41`)

**Evidence.** Each of the four iframes is declared
`style="width: 100%;border:none;overflow: hidden;" scrolling="no"` with **no**
`min-height` and no `height`. Verified by attribute enumeration across every iframe
in the tree: of the five GHL calendars, only `collab.html:102-107` sets
`min-height:850px`. Sizing therefore depends entirely on `form_embed.js` completing
its `postMessage` resize handshake. Additionally, each of these four pages has
`<main>` containing only the iframe — no `<h1>` (verified: all four are among the
five pages with no heading element at any level in `<main>`), no descriptive text,
and no fallback content.

**Risk.** If the resize handshake does not complete, the frame retains the HTML
default height (300×150 per the HTML specification) while `scrolling="no"` and
`overflow:hidden` suppress the user's ability to scroll to the rest of the
calendar. The result is an unusable booking page. Because there is no heading and
no fallback copy, a failure to load the frame at all produces a page that is
visually empty apart from the injected header and footer — and if `assets/site.js`
has also failed (M-03), entirely blank.

**Failure conditions.** `form_embed.js` blocked or slow while the iframe itself
loads; a GHL change to the resize protocol; the host mismatch in L-07 causing one
of the two script hosts to behave differently; a Content-Security-Policy added
later that permits the frame but not the script.

**Recommended correction.** Give each of the four frames a conservative
`min-height` in the same way `collab.html:104` already does, so a failed handshake
degrades to "tall enough" rather than "clipped." Separately, give each page a real
`<h1>` and one line of context, so a frame that fails to load leaves a page that
still identifies itself. Do not remove `scrolling="no"` — that attribute exists to
prevent a double scrollbar once the handshake succeeds.

**Compatibility impact.** Low. A `min-height` floor does not prevent
`form_embed.js` from resizing upward; `collab.html` demonstrates the two coexisting
in production. Excess whitespace below a short calendar is the only cost.

- **Operator approval required:** Yes.
- **Belongs in this project:** Partly. These are booking pages, not Submit Music.
  Recommend treating as a small, separate, low-risk correction rather than folding
  it into the submission work.
- **GHL configuration involved:** No — the embed IDs and GHL settings are untouched.

---

### M-03 — Sitewide navigation and footer are JS-injected and fail silently

- **Severity:** Medium
- **Status:** Verified
- **Affected file:** `assets/site.js`
- **Lines:** `:23-35`, `:109-110`; consumed by all 18 full pages except the two
  redirect stubs

**Evidence.** `loadHTML()` (`:23-35`) fetches `header.html` and `footer.html` and
assigns the response to `el.innerHTML`. Its `catch` block (`:32-34`) calls
`console.error(err)` and nothing else. `header.html` and `footer.html` are the sole
source of primary navigation, the Store link, the Call and Text actions, the
non-affiliation notice (`footer.html:66-70`), and the "Submission does not
guarantee placement" disclaimer (`footer.html:55`).

**Risk.** A single failed fetch removes all navigation and all footer disclosures
from every page simultaneously, with no user-visible indication that anything is
missing — the reserved `#site-header{min-height:84px}` space simply stays empty.
This is the amplifier that turns M-02 from "clipped calendar" into "blank page."

**Failure conditions.** `assets/site.js` blocked or erroring; either fragment
returning non-2xx; a network fault during either fetch;
`fetch(file, {cache:"no-cache"})` failing on a flaky connection — note the
`no-cache` directive at `:28` forces revalidation on every page view, so a cached
copy is not a reliable safety net. Also, and documented at `README.md:157`, the
`file://` protocol blocks `fetch` entirely, so the site cannot be previewed by
opening a file directly.

**Recommended correction.** Two independent improvements, both out of scope now:
(a) render a minimal static fallback nav inside `#site-header` in markup that the
fetch replaces on success, so failure degrades to a reduced nav rather than none;
(b) keep the footer's legal notices in static markup on the pages that need them
most rather than solely in the injected fragment. A build-time include would solve
this properly but requires the pipeline deferred in §18.5.

**Compatibility impact.** A static fallback nav duplicates markup across 18 pages,
which is the maintenance problem the fragment system was built to solve — this is a
genuine trade-off, not a clear win, and deserves an explicit decision.

- **Operator approval required:** Yes.
- **Belongs in this project:** Partly. The disclosure half (footer legal notices)
  interacts with M-05 and should be decided together.
- **GHL configuration involved:** No.

---

### M-04 — `thank-you.html` is unreachable because the post-submit redirect is not configured

- **Severity:** Medium
- **Status:** Operator confirmation required
- **Affected files:** `assets/suno-vibez-config.js`; `thank-you.html`;
  `assets/thank-you.js`
- **Lines:** `assets/suno-vibez-config.js:29-31`; `README.md:109`;
  `thank-you.html` entire file

**Evidence.** `assets/suno-vibez-config.js:29-31` states: "Post-submit redirect —
set inside GHL, not here. Point it at `https://aguocha.com/thank-you.html` or the
confirmation page (spec §7.9) is unreachable." `README.md:109` repeats it as
outstanding operator TODO item 2. `thank-you.html` appears in no navigation, in no
footer, and is deliberately excluded from `sitemap.xml` (comment at
`sitemap.xml:2`) and marked `noindex` (`thank-you.html:8`). No first-party file
links to it. Its only inbound path is a GHL redirect.

**Risk.** Everything `thank-you.html` and `assets/thank-you.js` were built to do
is currently dead code: the concrete reply-by date (`assets/thank-you.js:31-42`),
the follow-the-playlist call to action (`:59-73`), the share affordance
(`:90-130`), and the withdrawal instructions (`thank-you.html:90-95`). Submitters
instead land on whatever GoHighLevel's default confirmation is — content this
review cannot see. The page also carries the only user-facing statement of the
7-day response promise at the moment of submission, so the promise is made on
`submit.html` and then not reinforced.

**Failure conditions.** Present by default. This is a missing configuration, not an
intermittent fault.

**Recommended correction.** Set the redirect in GoHighLevel to
`https://aguocha.com/thank-you.html`, optionally appending `?track=<title>` — but
see L-01 before enabling that parameter, because it is the injection surface.

**Compatibility impact.** None to repository code. `assets/thank-you.js` is written
to handle the parameter's absence (`:50-56` defaults to "Your track").

- **Operator approval required:** Yes — it is an operator action, not a code change.
- **Belongs in this project:** Yes, as a configuration step.
- **GHL configuration involved:** **Yes.** This is entirely a GHL setting.

---

### M-05 — Privacy notice and submission terms are absent from the global footer; booking pages collect PII with no disclosure

- **Severity:** Medium
- **Status:** Verified
- **Affected files:** `footer.html`; the four booking pages; `collab.html`
- **Lines:** `footer.html:16-35` (the "Navigate" list) and `:60-72` (the bottom
  bar); `private-corporate.html:37-45`; `festivals-tours.html:38-46`;
  `residencies.html:37-45`; `brand-activations.html:37-45`; `collab.html:99-111`

**Evidence.** `footer.html`'s navigation list enumerates Music, Book, the four
booking categories, Collab, Media, Tour, Store and Submit Song. It does **not**
include `privacy.html` or `submission-terms.html`. The bottom bar (`:60-72`)
carries copyright, the chatbotfarm.ai credit, and the Suno non-affiliation notice —
no policy links. Verified by reading the whole fragment.

Consequently, on `private-corporate.html`, `festivals-tours.html`,
`residencies.html`, `brand-activations.html` and `collab.html` — five pages whose
embedded GHL calendars collect at minimum a name, email address and phone number —
there is **no link to the privacy notice anywhere on the page**, and no on-page
statement that GoHighLevel/LeadConnector receives and processes the data. Those
pages' `<main>` contains only the iframe (`private-corporate.html:37-45` and
siblings). The privacy notice reachable only from `submit.html:353`,
`submission-terms.html:143`, `privacy.html` itself, and `thank-you.html:93` — none
of which a booking visitor passes through.

**Risk.** A data-collection surface with no accessible privacy disclosure. The
substantive disclosures exist and are unusually candid — `privacy.html:64-79`
names GoHighLevel/LeadConnector, YouTube and Spotify explicitly as embedded
processors — but a disclosure a user cannot find does not discharge the obligation
it was written to discharge. Under GDPR Art. 13 / CCPA-style notice-at-collection
expectations this is the kind of gap that matters, though whether either regime
applies depends on audience and is a question for counsel.

**Failure conditions.** Present on every visit to those five pages.

**Recommended correction.** Add `privacy.html` and `submission-terms.html` to
`footer.html`. Because the footer is a shared fragment, that single edit covers all
18 pages at once. Consider whether the booking pages additionally warrant a
one-line notice-at-collection above the calendar.

**Compatibility impact.** None. A footer link cannot break a GHL embed.

- **Operator approval required:** Yes.
- **Belongs in this project:** Yes. Single-file, low-risk, high-value.
- **GHL configuration involved:** No.

---

### M-06 — Marketing consent is bundled with the transactional submission; consent and rights text defective in the live form

- **Severity:** Medium
- **Status:** Operator confirmation required (bundling is Verified; the live-form
  defects are recorded in the repository but their current state is unconfirmed)
- **Affected files:** `submit.html`; `README.md`; the GHL form
  `hNlynM8h8zLs9jkDlTVW`
- **Lines:** `submit.html:280`, `submit.html:426`, `submit.html:346-354`;
  `README.md:98-108`; `assets/suno-vibez-config.js:18-24`

**Evidence.** Two distinct problems.

*Bundling (verified from the tree).* `submit.html:280` states: "We don't sell or
share your email. One confirmation, one decision, and a monthly playlist email you
can leave any time." FAQ 13 (`submit.html:426`) repeats it: "You get a
confirmation, a decision, and a monthly email when the playlist updates."
Submitting a track therefore enrolls the creator in a recurring marketing email.
Nothing on the site presents that as a separate, declinable choice — no separate
checkbox is described in the copy, and `assets/suno-vibez-config.js:18-24`
enumerates the intended field set (`track_link`, `creator_name`, `email`, `genre`,
`submission_notes`, `rights_confirmed`) with **no marketing-consent field**. The
page frames the marketing email as a consequence of submission rather than an
option.

*Live-form defects (recorded in the repository, current state unconfirmed).*
`README.md:98-108` records that the live form asks for ten fields rather than the
specified five and that, among them:

- the SMS consent text "still contains unfilled template placeholders,
  `[BUSINESS NAME]` and `[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]`, which real
  submitters currently see" (`README.md:103`);
- "the 'Rights Confirmed' checkbox is labelled 'Option 1'", so "the §7.7
  representation the creator is supposed to be making is not actually stated"
  (`README.md:102`);
- `terms_and_conditions` appears twice (`README.md:104`);
- phone is collected and **required** (`README.md:99`).

**Risk.** Three separable risks. (1) Consent bundling: marketing email sent on the
back of a transactional submission, without separate opt-in, is the pattern GDPR
Art. 7(2)/(4) and PECR treat as invalid consent, and CAN-SPAM handles differently
again. (2) SMS consent with unfilled placeholders is worse than absent consent
language: a consent string reading `[BUSINESS NAME]` cannot establish the express
written consent that US SMS marketing rules contemplate, while still creating a
record that consent was purportedly obtained. (3) A rights-confirmation checkbox
labelled "Option 1" is the one item on the form with legal weight, and it does not
state the representation being made — which undermines the warranty at
`submission-terms.html:69-74` that the whole submission model rests on.

**Failure conditions.** Present on every real submission, for as long as the form
is in its current state.

**Recommended correction.** Confirm the live form's current field set and consent
strings in GoHighLevel. Separate marketing consent from submission consent as an
explicit, unchecked, declinable field. Replace the SMS consent placeholders with
real values or remove the SMS consent path entirely if SMS marketing is not
actually intended. Label the rights checkbox with the representation it captures.
**Flag all consent and rights language for attorney review before changing it** —
this review does not assess legal sufficiency and does not propose wording.

**Compatibility impact.** Changing GHL field labels is safe; **renaming field keys
is not** — `assets/suno-vibez-config.js:22-24` and `README.md:108` both warn that
`track_link`, `creator_name`, `email`, `genre`, `submission_notes` and
`rights_confirmed` are integration contracts, and `prefillParam` at
`assets/suno-vibez-config.js:59` must keep matching `track_link` or the hero
prefill silently stops working.

- **Operator approval required:** Yes, and counsel review is recommended.
- **Belongs in this project:** Yes for the on-page consent presentation. The GHL
  form interior is operator + counsel work.
- **GHL configuration involved:** **Yes**, substantially.

---

### M-07 — `cdn.tailwindcss.com` is an unpinned production runtime script on all 18 pages

- **Severity:** Medium
- **Status:** Verified
- **Affected files:** 18 HTML files
- **Lines:** `404.html:16`, `book.html:15`, `brand-activations.html:15`,
  `collab.html:15`, `festivals-tours.html:15`, `index.html:15`, `media.html:15`,
  `music.html:15`, `privacy.html:16`, `private-corporate.html:15`,
  `residencies.html:15`, `store.html:15`, `submission-terms.html:16`,
  `submit.html:24`, `suno-vibez.html:14`, `suno-vibez/index.html:14`,
  `thank-you.html:16`, `tour.html:15`

**Evidence.** Every page loads `<script src="https://cdn.tailwindcss.com"></script>`
synchronously in `<head>`, with no version path and no `integrity` attribute
(verified: **zero** `integrity=` or `crossorigin=` attributes exist anywhere in the
repository). This is the Tailwind Play CDN, which is a JavaScript program that
scans the DOM and generates CSS at runtime — not a stylesheet. There is no
`tailwind.config`, no `@apply`, and no theme extension anywhere, so the utility set
in use is entirely stock.

**Risk.** Two distinct risks, and it is worth separating them.

*Supply chain (high impact, low likelihood).* The script executes with full
privileges on the `aguocha.com` origin on every page. A compromise of the CDN, or
DNS hijack of that hostname, would allow arbitrary script execution on every page,
including the ability to read the submitter's pasted link from `sessionStorage`, to
rewrite the GHL iframe `src`, or to overlay a credential-harvesting form. This is
the highest-impact scenario in the report. It is rated Medium rather than High
because there is no defect here and no exploitation path under any local control —
it is the inherent, accepted cost of any CDN dependency, and rating it High would
misrepresent it.

*Availability (moderate impact, moderate likelihood).* Because the script *is* the
stylesheet, a slow, blocked, or failed CDN leaves every page rendering as unstyled
HTML — the per-page inline `<style>` blocks supply only the colour tokens and a
handful of component rules, not layout. The Play CDN is also explicitly documented
by Tailwind as being for development, not production use.

**Failure conditions.** CDN outage, regional blocking, corporate or extension-level
script filtering, or a breaking change in a future Tailwind major that the
unversioned URL would pick up automatically.

**Recommended correction, in order of increasing cost.**

1. *No build step, immediate:* pin to a version path (`https://cdn.tailwindcss.com/3.x.y`)
   so a future major release cannot change the site's rendering without a commit.
   This addresses surprise breakage but not supply-chain risk.
2. *No build step, self-hosted:* commit a pre-built Tailwind CSS file produced once,
   externally, and serve it from `assets/`. This eliminates the third-party script
   entirely and is what makes a meaningful CSP achievable (§14). It costs a
   regeneration step whenever new utility classes are used.
3. *Build pipeline:* Tailwind CLI plus CI. Correct long-term, and the only option
   that scales — deferred to §18.5.

Subresource Integrity is **not** a workable mitigation for the current URL: the
unversioned endpoint's bytes change when Tailwind ships, so a pinned hash would
break the site on the next release; and Tailwind does not publish SRI hashes for
the Play CDN. Recommending SRI here would be wrong.

**Compatibility impact.** Option 1 is near-zero risk. Option 2 risks missing
utility classes if the extraction is incomplete, which would appear as broken
layout — it needs a visual check of all 18 pages. Option 3 changes the development
workflow for anyone touching the site.

- **Operator approval required:** Yes for options 2 and 3; option 1 is a one-line
  change per page but still 18 files.
- **Belongs in this project:** **No.** The brief prohibits replacing Tailwind,
  installing dependencies, and creating a build process, and rightly so — this is a
  separate migration. Option 1 is the only variant that could reasonably be folded
  into a small hardening pass, and even that should be a deliberate decision.
- **GHL configuration involved:** No.

---

### L-01 — `?track=` URL parameter reflected into the H1 (text injection, not XSS)

- **Severity:** Low
- **Status:** Verified
- **Affected files:** `assets/thank-you.js`; `thank-you.html`
- **Lines:** `assets/thank-you.js:48-57`; `thank-you.html:43-45`

**Evidence.** `setTrackName()` reads `new URLSearchParams(window.location.search).get("track")`
(`:52`), trims and truncates to 120 characters (`:55`), and assigns
`node.textContent = value ? "\u201C" + value + "\u201D" : "Your track"` (`:56`).
The target is `<span id="track-name">` inside the `<h1>` at `thank-you.html:44`.

**Risk assessment — and what this is not.** This is **not** cross-site scripting.
`textContent` does not parse HTML, so markup, `<script>`, and event-handler
attributes in the parameter are rendered as literal text and cannot execute. The
120-character cap further limits payload size. What remains is genuine but
narrower: an attacker can craft `https://aguocha.com/thank-you.html?track=<up to 120 chars>`
and cause arbitrary attacker-chosen text to appear inside the main heading of a
real page on the operator's own domain, framed by the surrounding trusted copy
("Got it. … is in the queue"). That is a social-engineering primitive — for
example, text instructing the reader to call an attacker-controlled number, on a
page that otherwise looks legitimate.

**Failure conditions.** Requires the victim to open a crafted link. Impact is
bounded by the page being `noindex` (`thank-you.html:8`), currently unreachable
through the funnel at all (M-04), and low-traffic. If M-04 is fixed by adding
`?track=` to the GHL redirect as `assets/suno-vibez-config.js:31` suggests, this
surface becomes live and more plausible as a lure.

**Recommended correction.** Constrain the accepted value rather than only its
length: allow a conservative character set (letters, digits, spaces, and a short
punctuation set), reject anything containing a URL scheme or a phone-number-like
run of digits, and fall back to "Your track" on rejection. A cheap alternative is
to drop the parameter entirely and always render "Your track" — the personalisation
is a nicety, not a requirement.

**Compatibility impact.** None, provided the fallback path is kept.

- **Operator approval required:** Yes (code change).
- **Belongs in this project:** Yes — small, and it sits directly on the submission
  path being consolidated.
- **GHL configuration involved:** Indirectly. Decide this before configuring the
  GHL redirect to append `?track=`.

---

### L-02 — Curator `photo` and `links[].url` bypass the file's own URL validation

- **Severity:** Low
- **Status:** Verified
- **Affected file:** `assets/submit.js`
- **Lines:** `:419-427` (photo), `:434-443` (links); contract stated at `:8-11`;
  validator at `:25-37`

**Evidence.** `assets/submit.js:8-11` states the file's security contract: "every
URL from config is validated (https + exact host allowlist) and every element is
built with createElement/setAttribute/textContent." That holds for the form URL
(`:243`), the playlist embed (`:145`), and the playlist links (`:492`) — each goes
through `validUrl()`. It does **not** hold for two values:

- `:421` — `img.setAttribute("src", c.photo)`, where `c.photo` comes straight from
  `CFG.curator.photo` with only an `if (c.photo)` truthiness guard at `:419`.
- `:438` — `link(item.url, …)` for each `CFG.curator.links` entry, where `link()`
  (`:46-50`) performs `a.setAttribute("href", href)` with no validation beyond
  `if (!item || !item.url) return` at `:437`.

Both are currently inert: `assets/suno-vibez-config.js:80-83` has `photo: ""` and
`links: []`, and `initCurator()` removes the entire block when `curator.name` is
empty (`:412-416`).

**Risk.** The data source is a first-party repository file, so this is a
defence-in-depth inconsistency rather than a vulnerability — an attacker able to
edit `assets/suno-vibez-config.js` could equally edit the HTML directly. The
meaningful failure is operator error: `links[].url` reaches an `<a href>`, where a
`javascript:` URL would execute on click, and where an `http://` URL would produce
a mixed-content link. For `photo`, an `http://` URL would be blocked as mixed
content and a third-party URL would create an undisclosed third-party request that
`privacy.html:64-79` does not account for. The `<img src>` sink itself is not
script-executing: `javascript:` does not run there, and an SVG in a `data:` URI
cannot execute script when loaded through `<img>`.

**Failure conditions.** An operator populating `curator` — which `README.md:110`
and `assets/suno-vibez-config.js:33-38` both list as a required pre-launch step —
with an `http://` URL, a `javascript:` URL, or a third-party image host.

**Recommended correction.** Route both through the existing `validUrl()`. `photo`
should be restricted to a first-party path or a small host allowlist; `links[].url`
should require `https:` and reject any other scheme. Both are three-line changes
that make the file honour the invariant it already documents.

**Compatibility impact.** None, so long as the eventual curator values are `https:`.

- **Operator approval required:** Yes (code change).
- **Belongs in this project:** Yes — and it should be fixed *before* the curator
  block is populated, not after.
- **GHL configuration involved:** No.

---

### L-03 — Seven iframes have no `title` attribute, including all five GHL calendars

- **Severity:** Low
- **Status:** Verified
- **Affected files:** `private-corporate.html`, `festivals-tours.html`,
  `residencies.html`, `brand-activations.html`, `collab.html`, `music.html`
- **Lines:** `private-corporate.html:41`; `festivals-tours.html:42`;
  `residencies.html:41`; `brand-activations.html:41`; `collab.html:102`;
  `collab.html:75`; `music.html:51`

**Evidence.** Attribute enumeration over every iframe in the tree. All five GHL
booking calendars lack `title`. Both Spotify embeds lack `title`
(`music.html:51`, `collab.html:75`). All five YouTube embeds have one
(`index.html:51`, `music.html:66`, `music.html:79`, `book.html:128`,
`collab.html:59`), as do both JS-injected frames (`assets/submit.js:176`, `:266`).

**Risk.** Screen-reader users navigating by frame hear an unlabelled frame, so the
booking calendar — the entire purpose of four of these pages — is announced without
identification. WCAG 2.1 SC 4.1.2 / technique H64. No security impact.

**Failure conditions.** Present for every assistive-technology user on those pages.

**Recommended correction.** Add a descriptive `title` to each of the seven frames.

**Compatibility impact.** None. `title` is inert to GHL, Spotify, and the resize
handshake.

- **Operator approval required:** Yes, nominally.
- **Belongs in this project:** Yes as an immediate low-risk correction.
- **GHL configuration involved:** No.

---

### L-04 — No `referrerpolicy` on any in-markup iframe

- **Severity:** Low
- **Status:** Verified
- **Affected files:** all 8 pages containing in-markup iframes
- **Lines:** the 12 in-markup iframes enumerated in §9.2

**Evidence.** None of the 12 iframes declared in HTML carries `referrerpolicy`.
Both JS-injected frames do: `assets/submit.js:178` and `:268` set
`strict-origin-when-cross-origin`.

**Risk.** Deliberately understated: since Chrome 85 and Firefox 87, browsers
default to `strict-origin-when-cross-origin`, so in practice modern browsers
already send only the origin cross-site. The residual exposure is limited to older
or non-default-configured user agents, which would send the full URL — including
any query string — to GHL, YouTube and Spotify. Since none of these pages carries
sensitive query parameters, the practical leak is minimal. This is a
defence-in-depth item, not a privacy incident.

**Failure conditions.** Legacy browser without the modern default.

**Recommended correction.** Add `referrerpolicy="strict-origin-when-cross-origin"`
to the 12 in-markup iframes, matching what the injected frames already do. Low
value, near-zero cost, worth bundling with L-03 since it touches the same tags.

**Compatibility impact.** None — it matches the current browser default.

- **Operator approval required:** Yes, nominally.
- **Belongs in this project:** Yes, bundled with L-03.
- **GHL configuration involved:** No.

---

### L-05 — `img/agu-mask-portrait.jpg` is missing, breaking `og:image` on 11 pages

- **Severity:** Low
- **Status:** Verified
- **Affected files:** `index.html`, `music.html`, `book.html`,
  `private-corporate.html`, `festivals-tours.html`, `residencies.html`,
  `brand-activations.html`, `collab.html`, `media.html`, `tour.html`, `store.html`
- **Lines:** line 14 in each

**Evidence.** All eleven declare
`<meta property="og:image" content="https://aguocha.com/img/agu-mask-portrait.jpg">`.
The file is absent from `img/`, which contains nine PNGs and no JPG. Already
documented at `README.md:120`. History confirms the reference is a survivor from
the deleted `agu_ocha_index_v2.html`, which used it as a visible `<img>`.

**Risk.** Social and messaging previews for those eleven pages render with no image,
which materially reduces click-through when links are shared. No security impact.
Note that `scripts/check-links.mjs` reports 0 errors because it inspects only
`href` and `src` attributes — see I-03.

**Failure conditions.** Present on every share of those pages.

**Recommended correction.** Either add a real image at that exact path or repoint
the eleven tags at `img/agu-logo.png`, which is what the four newer pages already
use (`privacy.html:15`, `submission-terms.html:15`, `thank-you.html:15`,
`submit.html:22`). Note that a square logo is a poor `og:image`; `submit.html:19-21`
already flags the need for a purpose-built 1200×630 asset.

**Compatibility impact.** None.

- **Operator approval required:** Yes — the choice between adding an asset and
  repointing tags is an operator decision. Creating the asset is outside this stage.
- **Belongs in this project:** The repoint does. Producing artwork does not.
- **GHL configuration involved:** No.

---

### L-06 — `favicon.ico` is 0 bytes but explicitly referenced by all 18 pages

- **Severity:** Low
- **Status:** Verified
- **Affected file:** `favicon.ico`; referenced from every full page's `<head>`
- **Lines:** e.g. `index.html:8`, `submit.html:13`, `suno-vibez/index.html:13`

**Evidence.** `favicon.ico` is present and zero bytes. Every full page declares
`<link rel="icon" href="favicon.ico">`.

**Risk.** Each page load fetches a zero-byte file that cannot be decoded; browsers
fall back to a default glyph and may log a console error. Cosmetic and trivially
wasteful. No security impact. Worth stating because a zero-byte file is easy to
mistake for a missing file during triage — it is present, just empty.

**Recommended correction.** Supply a real multi-resolution icon, or remove the
`<link rel="icon">` declarations and let the `apple-touch-icon` at
`img/agu-logo.png` carry the branding. Creating the asset is out of scope here.

**Compatibility impact.** None.

- **Operator approval required:** Yes.
- **Belongs in this project:** Only the decision. Asset production does not.
- **GHL configuration involved:** No.

---

### L-07 — Two different GHL hosts serve the same `form_embed.js`

- **Severity:** Low
- **Status:** Verified (equivalence of the two hosts: Unknown)
- **Affected files:** `residencies.html`, `brand-activations.html` vs
  `private-corporate.html`, `festivals-tours.html`, `collab.html`,
  `assets/submit.js`
- **Lines:** `residencies.html:42` and `brand-activations.html:42` load
  `https://api.leadconnectorhq.com/js/form_embed.js`; `private-corporate.html:42`,
  `festivals-tours.html:43`, `collab.html:109` and `assets/submit.js:20` load
  `https://link.msgsndr.com/js/form_embed.js`

**Evidence.** Direct read of all six references. Both hostnames are
GoHighLevel-operated; both are in `assets/submit.js:18`'s `FORM_HOSTS` allowlist.

**Risk.** Three consequences. (1) Maintainability: two conventions for one job,
with no comment explaining why, invites future inconsistency. (2) Any future
`script-src` CSP must allowlist both hosts, widening the policy for no benefit.
(3) If the two endpoints ever diverge in behaviour — for instance in the resize
handshake — two of the five calendars would break differently from the other three,
and M-02 makes that failure invisible until someone reports a clipped calendar.
Whether they are currently equivalent cannot be determined from the repository.

**Failure conditions.** Divergence between the two GHL endpoints, or a CSP
introduced without both hosts allowlisted.

**Recommended correction.** Standardise on whichever host GoHighLevel currently
documents as canonical for embeds, and record the choice in a comment. Confirm with
GHL before changing, since this is their delivery infrastructure, not ours.

**Compatibility impact.** Changing the host on a working page carries a small risk
of breaking a working embed; each changed page needs a visual check. This is a
reason to standardise deliberately, not hastily.

- **Operator approval required:** Yes.
- **Belongs in this project:** Marginally. Better handled alongside M-02, which
  touches the same four files.
- **GHL configuration involved:** Confirmation only; no GHL setting changes.

---

### L-08 — No email contact anywhere; privacy rights requests are SMS/phone only

- **Severity:** Low
- **Status:** Verified
- **Affected files:** `privacy.html`; `submission-terms.html`; whole tree
- **Lines:** `privacy.html:107-113`; `submission-terms.html:105-111`

**Evidence.** Whole-tree grep for `mailto:` and for any email-address pattern
across every HTML, JS, TXT and XML file returned **nothing**. The only contact
routes on the entire site are `tel:+17622486242` and `sms:+17622486242`.
`privacy.html:107-113` offers access, correction and deletion — and withdrawal of a
song submission — exclusively by text or phone call. `submission-terms.html:105-111`
routes withdrawal exclusively through SMS.

**Risk.** Two aspects. Practically, a phone-only channel for data-subject requests
excludes anyone unwilling or unable to send an SMS to a US number, and creates no
written record on the requester's side. Formally, several privacy regimes expect a
reasonably accessible request mechanism, and the site simultaneously promises
decisions "by email" (`submit.html:229`, `:386`) while providing no email address
for the reverse direction. Whether this is legally adequate is a question for
counsel; it is flagged, not assessed.

**Recommended correction.** Publish an email address, or a hosted contact form, for
privacy and withdrawal requests. Note the trade-off: a published address attracts
spam, which is presumably part of why one is absent. A GHL-hosted contact form
would avoid that while preserving a written channel.

**Compatibility impact.** None.

- **Operator approval required:** Yes.
- **Belongs in this project:** The site-side link does. Provisioning a mailbox or
  GHL form is operator work.
- **GHL configuration involved:** Possibly, if a GHL form is chosen as the channel.

---

### L-09 — Published claims reference page sections that are removed at runtime

- **Severity:** Low
- **Status:** Verified
- **Affected file:** `submit.html`; behaviour in `assets/submit.js`
- **Lines:** `submit.html:381` and `:481` (acceptance rate); `submit.html:436`
  (curator); removal logic at `assets/submit.js:449-458` and `:407-416`

**Evidence.** FAQ 4 (`submit.html:381`) states "We publish our acceptance rate at
the top of this page and it's usually in the single digits." `metrics.show` is
`false` (`assets/suno-vibez-config.js:88`), and `initMetrics()`
(`assets/submit.js:449-458`) removes `#metrics-block` entirely, so no acceptance
rate is rendered anywhere. FAQ 15 (`submit.html:436`) states "photo, links, and
contact details are in the 'who listens' section above"; `curator.name` is empty
(`assets/suno-vibez-config.js:80`) and `initCurator()` (`:407-416`) removes that
entire section. The acceptance-rate claim is additionally published in the JSON-LD
`FAQPage` payload at `submit.html:481`, where a search engine may surface it.

**Risk.** The page makes two verifiably false statements about its own content, one
of them in structured data offered to search engines. For a page whose entire
persuasive argument is transparency — "we publish our acceptance rate", "if you
can't find a real person behind a playlist, that's usually a reason to be careful"
(`:436`) — a reader who checks and finds neither has been given a concrete reason to
distrust it. This is a credibility and accuracy defect, not a security one.

**Failure conditions.** Present until either the config values are populated or the
copy is adjusted.

**Recommended correction.** Either populate `curator` and flip `metrics.show`
(both already required pre-launch per `README.md:110-112`), or soften the two FAQ
answers so they do not assert content that is conditionally removed. Note the copy
exists in two places — see I-08.

**Compatibility impact.** None.

- **Operator approval required:** Yes. Note the brief prohibits rewriting page copy
  in this stage, so this is a recommendation only.
- **Belongs in this project:** Yes.
- **GHL configuration involved:** No.

---

### L-10 — Data retention period not stated

- **Severity:** Low
- **Status:** Verified
- **Affected file:** `privacy.html`
- **Lines:** `:83-95`, `:106-114`

**Evidence.** `privacy.html:86-88` states the purposes — "to respond to you, to
schedule and run the review, and to keep a record of the submission" — with no
retention period or deletion schedule. `:107-113` offers deletion on request. No
statement anywhere describes how long submissions, contact details, or booking
enquiries are kept, nor what happens to them after a submission is rejected.

**Risk.** GDPR Art. 13(2)(a) expects the retention period or the criteria used to
determine it. "We keep a record" plus deletion-on-request is a common and
defensible position for a small operator, but it is not the same as stating a
period. Applicability depends on audience and is a question for counsel.

**Recommended correction.** Add a retention statement — even a criteria-based one
("submissions are retained for N monthly cycles, then deleted"). **Flag for
attorney review**; this review does not draft the language.

**Compatibility impact.** None.

- **Operator approval required:** Yes, with counsel.
- **Belongs in this project:** The edit does; the policy decision is the operator's.
- **GHL configuration involved:** Indirectly — the stated period must match actual
  GHL data retention, which this review cannot see.

---

### I-01 — No repository `.gitignore`; secret hygiene depends on one machine's global ignore

- **Severity:** Informational
- **Status:** Verified
- **Affected file:** repository root (absence)

**Evidence.** No `.gitignore` exists. `.git/info/exclude` contains no active rules.
`.claude/settings.local.json` is present on disk and untracked solely because
`C:\Users\mintl/.config/git/ignore` line 3 excludes `**/.claude/settings.local.json`
— confirmed via `git check-ignore -v`. It has never appeared in any commit. Because
`.nojekyll` is present, GitHub Pages publishes dot-prefixed paths, so had it been
committed it would likely have been fetchable at `https://aguocha.com/.claude/settings.local.json`.

**Risk.** The safeguard is not portable. On any other machine, or for any future
contributor without that global ignore, local agent configuration — and, more
importantly, a future `.env`, key file, or `node_modules` — would be committed and
published by default. The current clean state is a property of one developer's
environment, not of the repository.

**Recommended correction.** Add a `.gitignore` covering at minimum `.env*`,
`node_modules/`, `.claude/settings.local.json`, `.DS_Store`, and editor
directories. See §15 for the full "must never be committed" list.

- **Operator approval required:** Yes, nominally. New file, no site impact.
- **Belongs in this project:** Yes — cheap and directly protective.
- **GHL configuration involved:** No.

---

### I-02 — No CI; `check-links.mjs` is never run automatically, and deployment is direct from `main`

- **Severity:** Informational
- **Status:** Verified (branch protection: Unknown)
- **Affected files:** `scripts/check-links.mjs`; absence of `.github/`

**Evidence.** A working validation tool exists and nothing invokes it. No
`.github/` directory. All 27 commits prior to this branch are on `main`, with no
merge commits, so work has been committed directly to the deployment branch.
`README.md:130` describes Pages serving `main`.

**Risk.** Any commit to `main` deploys immediately and unvalidated. The single
available guard is a manual command that `README.md:154` documents but nothing
enforces. Whether branch protection exists cannot be seen from the working tree.

**Recommended correction.** Out of scope — the brief prohibits adding CI and
changing branch protection. Recorded so the gap is a known, accepted condition
rather than an unexamined one. When it is in scope, a single workflow running
`node scripts/check-links.mjs` on pull requests would be the highest-value
addition, and would have caught nothing currently outstanding except by extension
(see I-03).

- **Operator approval required:** Yes.
- **Belongs in this project:** **No** — explicitly prohibited this stage.
- **GHL configuration involved:** No.

---

### I-03 — `check-links.mjs` blind spots cause a false "0 errors" signal

- **Severity:** Informational
- **Status:** Verified
- **Affected file:** `scripts/check-links.mjs`
- **Lines:** `:18`, `:21-32`, `:54`, `:101-105`

**Evidence.** The checker reports "Checked 20 HTML files: 0 error(s), 0 warning(s)."
That result is accurate for what it inspects and misleading as a summary of site
health. Verified limitations:

- `:54` matches only `href` and `src` attributes, so `<meta property="og:image">` is
  never examined — the eleven broken references in L-05 pass silently.
- `:18` skips the `scripts` directory and `:27` only collects `.html`, so no URL in
  `assets/*.js` is ever validated — including `CFG.ghlFormUrl` and every playlist
  URL.
- Existence is checked but not content: `favicon.ico` at 0 bytes passes (L-06).
- `:101-105`'s `target="_blank"` check uses an unanchored alternation, so a `rel`
  value on one attribute and `noopener` appearing in an unrelated attribute could
  produce a false negative.

**Risk.** Over-trust. A green result reads as "links are fine" when three of this
report's findings sit in its blind spots.

**Recommended correction.** Extend coverage to `<meta>` content URLs and to
`assets/*.js`, and consider a zero-byte-asset check. Out of scope now; recorded so
the tool's output is read with the right confidence.

- **Operator approval required:** Yes.
- **Belongs in this project:** Optional, low priority.
- **GHL configuration involved:** No.

---

### I-04 — Internal links target `submit.html` while canonical and sitemap use `/submit`

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `header.html`, `footer.html`, `404.html`, `privacy.html`,
  `submission-terms.html`, `submit.html`, `sitemap.xml`
- **Lines:** links at `header.html:71`, `:109`; `footer.html:33`, `:53`;
  `404.html:61`; `privacy.html:118`; `submission-terms.html:142`. Canonical at
  `submit.html:12`. Sitemap at `sitemap.xml:12`.

**Evidence.** Every internal link points at `submit.html`. The canonical tag and
the sitemap entry both declare `https://aguocha.com/submit`. `README.md:56`
explains the choice: relative `.html` links resolve under any host including a
local `python -m http.server`, while the canonical consolidates both forms.

**Risk.** Low and largely mitigated by design. Both URLs serve byte-identical
content, so two crawlable URLs exist, but the canonical tag resolves the
duplication and there is no redirect loop. The residual effect is that every
internal link points at the non-canonical form, which is a mild internal-linking
inconsistency rather than a duplicate-content problem. The reasoning in
`README.md:56` is sound and this is a defensible trade-off, not an error.

**Recommended correction.** None required. If consolidation is wanted later, prefer
extension-less internal links and accept that local static preview then needs a
server that resolves them.

- **Operator approval required:** No action proposed.
- **Belongs in this project:** Decision point for the consolidation stage.
- **GHL configuration involved:** No.

---

### I-05 — "Suno Vibez" is hard-coded page identity; the lane model is not extensible

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `submit.html`, `thank-you.html`,
  `assets/suno-vibez-config.js`, `assets/submit.js`
- **Lines:** identity at `submit.html:10`, `:15-16`, `:116`, `:121`, `:154`, `:479`,
  `:492`; `thank-you.html:6`, `:11`; config global at
  `assets/suno-vibez-config.js:46`; lanes at `:62-75`; lane logic at
  `assets/submit.js:56-70`, `:72-78`, and `submit.html:155`

**Evidence.** The brief asks whether the setup is maintainable for future
playlists. It is not, and the reasons are specific:

- The brand name is baked into visible copy (`submit.html:118`, `:121`, `:154`),
  the title (`:10`), Open Graph tags (`:15-16`), and the JSON-LD payload (`:479`,
  `:492`) — not read from config.
- The config global is literally `window.SUNO_VIBEZ_CONFIG`
  (`assets/suno-vibez-config.js:46`), consumed by name at `assets/submit.js:15` and
  `assets/thank-you.js:13`. `README.md:60` records this as a deliberate decision:
  internal identifiers stay unchanged for integration stability.
- `lanes` has exactly two hard-coded keys, `a` and `b` (`:62-75`), and lane
  detection is a hard-coded hostname list in `assets/submit.js:56-70` with a
  matching hard-coded `LANE_COPY` map at `:72-78`.
- `submit.html:155` hard-codes `data-lane="b"`, so the hero player is always the
  Spotify lane.

**Risk.** Adding a second playlist would require editing page copy, the config
shape, the lane detector, and the JSON-LD — in several files, with the FAQ text
duplicated (I-08). Nothing is broken; the architecture is simply single-purpose.
Worth stating plainly because it is the central input to any future consolidation
decision: the existing implementation is a well-built *one-playlist* page, not a
playlist framework.

**Recommended correction.** None at this stage. If multiple playlists are a real
requirement, that is a design decision for the consolidation stage (§18.2), and it
should be made explicitly rather than discovered during implementation.

- **Operator approval required:** N/A — informational.
- **Belongs in this project:** As an input to consolidation planning.
- **GHL configuration involved:** Each additional playlist would need its own form.

---

### I-06 — Five pages have no `<h1>`

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `book.html`, `private-corporate.html`,
  `festivals-tours.html`, `residencies.html`, `brand-activations.html`

**Evidence.** Verified by scanning every full page for `<h1>`. `book.html`'s first
heading is the `<h2>` at `:50`; the four booking pages have no heading element of
any level inside `<main>`.

**Risk.** Screen-reader users get no page-level heading to orient by, and search
engines lose the strongest on-page relevance signal. This compounds M-02: with no
heading and no fallback text, a failed calendar leaves a page with nothing on it.

**Recommended correction.** Add one `<h1>` per page. On the booking pages this also
supplies the fallback content M-02 recommends, so the two are best fixed together.

- **Operator approval required:** Yes. Note the brief prohibits copy changes this
  stage, so this is a recommendation only.
- **Belongs in this project:** Yes, bundled with M-02.
- **GHL configuration involved:** No.

---

### I-07 — `store.html` is in the sitemap but reachable from no navigation

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `store.html`, `sitemap.xml`, `header.html`, `footer.html`
- **Lines:** `sitemap.xml:15`; `header.html:66`, `:108`; `footer.html:32`

**Evidence.** All three "Store" navigation entries link directly to
`https://store.aguocha.com`. `store.html` is submitted for indexing at
`sitemap.xml:15` but is linked from nowhere on the site.

**Risk.** An orphaned indexable page whose only content is a link onward
(`store.html:43`). Low SEO value, mild dilution, no security impact.

**Recommended correction.** Either link it from navigation or drop it from the
sitemap. An operator decision about whether the interstitial serves a purpose.

- **Operator approval required:** Yes.
- **Belongs in this project:** No — unrelated to the submission funnel.
- **GHL configuration involved:** No.

---

### I-08 — FAQ copy duplicated between visible HTML and JSON-LD

- **Severity:** Informational
- **Status:** Verified
- **Affected file:** `submit.html`
- **Lines:** visible accordion `:364-437`; JSON-LD `FAQPage` `:473-495`

**Evidence.** All fifteen questions and answers appear twice: once as accordion
markup and once inside the `application/ld+json` payload. The two already differ:
visible FAQ 4 at `:381` says "at the top of this page" where the JSON-LD at `:481`
omits it, and visible FAQ 15 at `:436` says "above" where `:492` says "of the page."

**Risk.** Maintenance trap. Any copy correction must be made in both places, and
they have already drifted. Because the JSON-LD is what search engines consume,
drift means the version users see and the version Google sees are not the same.
This directly complicates the L-09 correction.

**Recommended correction.** Generate the JSON-LD from the accordion at build time
— which needs the deferred pipeline — or, without a build step, add a comment at
both sites noting they must be kept in sync. Not a defect on its own.

- **Operator approval required:** Yes for any change.
- **Belongs in this project:** As a constraint on any copy edit, yes.
- **GHL configuration involved:** No.

---

### I-09 — `assets/analytics.js` filename invites ad-blocker blocking

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `assets/analytics.js`; `submit.html:499`
- **Lines:** `assets/analytics.js:1-29`; guards at `assets/submit.js:16`, `:125-127`,
  `:310`

**Evidence.** The file makes no network request, sets no cookie or storage, and
loads no third-party script — verified by full read; it only pushes to
`window.svEvents` and dispatches a `sv:track` `CustomEvent` (`:40-45`). But a path
ending in `/analytics.js` matches common privacy-blocklist patterns, so a
meaningful share of visitors will not load it.

**Verified as safe:** blocking it does **not** break the form.
`assets/submit.js:16` defines `var track = window.svTrack || function () {}`, and
every optional call site is guarded (`:125-127`, `:310`, `:395`). This is good
defensive design and is recorded as a positive finding.

**Risk.** Silent, skewed instrumentation once a destination is attached — the
events most likely to be missing are exactly those from privacy-conscious users.
Also a naming hazard: a future reviewer reading only the filename would reasonably
conclude the site runs analytics, contradicting `privacy.html:44-46`.

**Recommended correction.** Consider a neutral filename such as
`assets/events.js`. Renaming touches `submit.html:499`, so it is not free. Worth
doing before any destination listener is attached, not after.

- **Operator approval required:** Yes.
- **Belongs in this project:** Optional.
- **GHL configuration involved:** No.

---

### I-10 — Sitewide public phone number is scrapeable: spam exposure, not a leak

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `header.html`, `footer.html`, `404.html`, `media.html`,
  `privacy.html`, `submission-terms.html`, `thank-you.html`,
  `assets/suno-vibez-config.js`
- **Lines:** `header.html:75-76`, `:113-114`; `footer.html:41-42`;
  `404.html:68-69`; `media.html:63`; `privacy.html:110`, `:112`;
  `submission-terms.html:108`; `thank-you.html:92`;
  `assets/suno-vibez-config.js:109-110`

**Evidence.** `+17622486242` appears in plain text as `tel:` and `sms:` links on
every page via the shared fragments, and as a config value at
`assets/suno-vibez-config.js:109`.

**Risk.** This is a **deliberately published business contact detail**, not a
disclosure failure, and it is explicitly classified as such per the brief's
instruction to distinguish spam exposure from real secrets. The only real
consequence is harvesting for SMS and robocall spam. It is amplified by L-08: with
no email alternative, this number is the site's sole contact channel, so degrading
it degrades all inbound contact — and `assets/submit.js:196-236` uses it as the
form's failure fallback, making it load-bearing for the funnel.

**Recommended correction.** None required. If spam becomes a problem, route public
contact through a GHL-managed number or form rather than removing the only contact
path.

- **Operator approval required:** No action proposed.
- **Belongs in this project:** No.
- **GHL configuration involved:** Only if a managed number is adopted.

---

### I-11 — Redirect stubs are client-side only, and their inline scripts constrain future CSP

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `suno-vibez.html`, `suno-vibez/index.html`
- **Lines:** `suno-vibez.html:10`, `:34`; `suno-vibez/index.html:10`, `:34`

**Evidence.** Both stubs use `<meta http-equiv="refresh" content="0; url=…">` plus
an inline `<script>location.replace(…)</script>`, and both carry
`robots: noindex, follow` and a canonical pointing at `https://aguocha.com/submit`.
Both provide a manual link as the no-JS, no-meta-refresh fallback
(`suno-vibez.html:29`). Neither loads `assets/site.js`, so neither has a header or
footer — appropriate for a zero-delay redirect.

**Verified correct:** there is **no redirect loop**. Both point at `submit.html`,
which does not redirect. The `noindex, follow` plus canonical combination is the
right treatment for a legacy route, and `robots.txt` allows crawling so the
`noindex` directive is actually seen. This is competently done.

**Risk.** Two minor consequences. A client-side redirect is not a 301: it depends
on the client, and search engines treat it as a signal rather than an instruction.
More practically, these are the only two inline `<script>` elements on the site, so
any future strict `script-src` CSP would need `'unsafe-inline'`, a nonce, or a hash
specifically for them — relevant to §14. Note the JSON-LD block at
`submit.html:473` is *not* affected: `application/ld+json` is a data block, is not
executed, and is not governed by `script-src`.

**Recommended correction.** None. If a proxy is ever introduced (§16), replacing
these with real 301s would be marginally better and would remove the inline-script
constraint.

- **Operator approval required:** No action proposed.
- **Belongs in this project:** No. The brief prohibits adding or removing redirects.
- **GHL configuration involved:** No.

---

### I-12 — Deleted files in git history reviewed; no secrets, but history retains removed third-party links

- **Severity:** Informational
- **Status:** Verified
- **Affected files:** `agu_ocha_index_v2.html` (deleted in `e9c9c6c`),
  `assets/suno-vibez.js` (deleted in `7eaa77b`)

**Evidence.** Both recovered and read.

`agu_ocha_index_v2.html` contained no secrets. It did contain third-party links no
longer present anywhere in the working tree: `https://www.youtube.com/@blockblackprojects`,
`https://www.tiktok.com/@agu_ocha`, and a Google Fonts stylesheet plus preconnect
(`fonts.googleapis.com`). It also used `img/agu-mask-portrait.jpg` as a visible
`<img>`, which is the origin of the eleven orphaned `og:image` references in L-05,
and contained an inline `onclick` handler — the only one ever in the repository.

`assets/suno-vibez.js` was the predecessor of `assets/submit.js`. It contained no
secrets and already implemented the same defensive pattern: an
`https:`-plus-host-allowlist validator, `createElement`-based construction, and the
same hardcoded `link.msgsndr.com/js/form_embed.js` constant. Two stale references
to its old name survive at `README.md:153` and `assets/site.js:21`.

**Risk.** None to security. Recorded for two reasons: it confirms the secret scan
covered deleted content, and it documents that the site formerly loaded Google
Fonts and linked social profiles — useful context if anyone wonders whether those
were removed deliberately. Git history is permanent and public if the repository
is, which is the practical reason §15's "never commit" list matters.

**Recommended correction.** None. Optionally correct the two stale `suno-vibez.js`
references.

- **Operator approval required:** No.
- **Belongs in this project:** No.
- **GHL configuration involved:** No.

---

## 8. Submit Music architecture map

### 8.1 Route map

```
ENTRY POINTS (all first-party links point at submit.html)
  header.html:71   desktop "Submit Song"        ──┐
  header.html:109  mobile "Submit Song…"        ──┤
  footer.html:33   footer nav "Submit Song"     ──┤
  footer.html:53   footer CTA card "Submit Song"──┤
  404.html:61      recovery card                ──┤
  privacy.html:118 "Submit Song"                ──┤
  submission-terms.html:142 "Submit Song"       ──┤
  sitemap.xml:12   https://aguocha.com/submit   ──┤ (canonical form, extensionless)
                                                  │
LEGACY ROUTES (client-side, noindex+follow, canonical → /submit)
  /suno-vibez.html      meta refresh :10 + location.replace :34 → submit.html ──┤
  /suno-vibez/  (index) meta refresh :10 + location.replace :34 → ../submit.html ─┤
                                                  │
                                                  ▼
                                        ┌──────────────────────┐
                                        │  submit.html         │
                                        │  canonical: /submit  │
                                        └──────────┬───────────┘
                                                   │ 4 deferred scripts, order load-bearing
        ┌──────────────────────┬───────────────────┼────────────────────┐
        ▼                      ▼                   ▼                    ▼
 suno-vibez-config.js    analytics.js          site.js            submit.js
 (:498)                  (:499)                (:500)             (:501)
 SUNO_VIBEZ_CONFIG       window.svTrack        header/footer       reads CFG,
 global                  no network            fetch+innerHTML     builds DOM
        │                                                              │
        └──────────────────────── CFG.ghlFormUrl ──────────────────────┘
                                                   │
                                    validUrl() submit.js:243
                                    https + host allowlist :18
                                                   │
                              ┌────────────────────┴────────────────────┐
                              ▼ valid                                   ▼ invalid/empty
                   IntersectionObserver :317-337              fallbackPanel() :196-236
                   fires within 400px                         "Submissions open shortly"
                              │                               + sms:/tel: routes
                   renderForm() :238-311
                   • sessionStorage "sv_track_link" → ?track_link= (:251-257)
                   • iframe src = api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW
                   • inline-<formId> id + data-* resize contract (:281-294)
                   • injects link.msgsndr.com/js/form_embed.js once (:303-308)
                              │
                              ▼
                   ══ GHL-HOSTED FORM (cross-origin, opaque to this site) ══
                              │
                              ▼  post-submit redirect — NOT CONFIGURED (M-04)
                   ┌──────────────────────┐
                   │  thank-you.html      │  ◄── currently unreachable
                   │  noindex :8          │      no canonical tag
                   │  no inbound link     │
                   └──────────┬───────────┘
                              │ suno-vibez-config.js :103 → site.js :104 → thank-you.js :105
                              ├─ reply-by date       thank-you.js:31-42   (CFG.responseSlaDays=7)
                              ├─ ?track= reflected   thank-you.js:48-57   ← L-01
                              ├─ follow playlist     thank-you.js:59-73   (lanes.b, validated)
                              ├─ join community      thank-you.js:75-87   → REMOVED (communityUrl "")
                              └─ share/copy          thank-you.js:90-130
```

### 8.2 Dependency table

| File | Depends on | Consumed by | Failure effect |
| --- | --- | --- | --- |
| `submit.html` | 4 deferred scripts; Tailwind CDN | entry point | — |
| `assets/suno-vibez-config.js` | none | `submit.js:15`, `thank-you.js:13` | `CFG` undefined → both files fall back to `{}` and every block degrades to its empty state; the form shows `fallbackPanel()` |
| `assets/analytics.js` | none | `submit.js:16` via `window.svTrack` | **None** — guarded no-op (I-09) |
| `assets/site.js` | `header.html`, `footer.html` | all 18 full pages | no nav, no footer, silent (M-03) |
| `assets/submit.js` | `CFG`, `svTrack` | `submit.html` only | **no form at all** (M-01) |
| `assets/thank-you.js` | `CFG` | `thank-you.html` only | static fallback text remains |
| `thank-you.html` | GHL redirect | nothing links to it | unreachable (M-04) |
| `suno-vibez.html`, `suno-vibez/index.html` | none | legacy inbound only | manual link fallback at `:29` |

### 8.3 Direct answers to the questions posed

| Question | Answer |
| --- | --- |
| Does Submit Music already function as the intended permanent page? | **Yes, structurally.** `submit.html` is canonical (`:12`), sitemapped (`sitemap.xml:12`), and the target of every internal link. It is not a placeholder. But it is not launch-complete: the form is JS-only (M-01), the curator and metrics blocks self-remove, two FAQ answers are false (L-09), and the title/description are marked PROVISIONAL at `:6-9`. |
| Is Suno Vibez hard-coded as page identity? | **Yes** — in visible copy, `<title>`, OG tags, and JSON-LD. See I-05. |
| Do multiple URLs create duplicate content? | **Technically yes, practically no.** `/submit` and `/submit.html` serve identical bytes; the canonical at `:12` consolidates them. The two legacy stubs are `noindex, follow`. No unmanaged duplication. |
| Are redirects implemented correctly? | **Yes.** Meta refresh + `location.replace` + manual fallback + `noindex, follow` + canonical. **No redirect loop** — verified. Only weakness: client-side, not 301 (I-11). |
| Would JavaScript failures make the form unavailable? | **Yes, completely.** This is M-01, the most consequential finding. |
| Is the GHL form loaded more than once? | **No.** `formRendered` (`:194`, `:239`, `:301`) guards double render; `IntersectionObserver` disconnects after firing (`:331`); the hero CTA calls the same guarded `renderForm()` (`:128`); and `form_embed.js` injection is guarded by a `querySelector` existence check (`:303`). Correctly single-shot. |
| Is the thank-you page reachable? | **No.** M-04. |
| Is the setup maintainable for future playlists? | **No.** Single-purpose by construction. I-05. |

---

## 9. GHL embed review

### 9.1 Inventory of the six GHL assets plus one external page

| # | Type | Identifier | Location | HTTPS | Expected GHL domain | Public ID only |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Calendar | `gVxSS7k0YEJNYBFPQILA` | `private-corporate.html:41` | Yes | `api.leadconnectorhq.com` ✔ | Yes |
| 2 | Calendar | `X56pKuTIpw1vu5xdOVpX` | `festivals-tours.html:42` | Yes | `api.leadconnectorhq.com` ✔ | Yes |
| 3 | Calendar | `6tuaToT0K8aZFMLYJ2VU` | `residencies.html:41` | Yes | `api.leadconnectorhq.com` ✔ | Yes |
| 4 | Calendar | `Fwzuvt3S944xnibxng7O` | `brand-activations.html:41` | Yes | `api.leadconnectorhq.com` ✔ | Yes |
| 5 | Calendar | `4Zwyq5uTC8G7JdZW4ltW` | `collab.html:103` | Yes | `api.leadconnectorhq.com` ✔ | Yes |
| 6 | Form | `hNlynM8h8zLs9jkDlTVW` | `assets/suno-vibez-config.js:51`, injected | Yes | `api.leadconnectorhq.com` ✔ | Yes |
| 7 | External page | `/media-request-form` | `media.html:62` | Yes | `app.aguocha.com` (GHL-hosted, **inferred**) | Path only |

All seven use `https:`. No `http:` resource exists anywhere in the tree —
independently confirmed by `check-links.mjs:61-64`, which treats any `http://`
reference as an error and reported none.

**On whether these identifiers are credentials:** they are not. Each is a public
widget identifier designed to be embedded in client-side markup and rendered to
anonymous visitors; possession permits displaying the widget and submitting to it,
which is exactly what the public site does. No evidence was found that any grants
read access to submissions, account access, or any privileged operation. They are
classified as public embed identifiers, not secrets, per the brief's instruction.
The residual consideration is **unsolicited submissions**: anyone can embed form
`hNlynM8h8zLs9jkDlTVW` on another site or POST to it, so spam volume is bounded by
GHL's own protections, not by anything in this repository — see §17 item 9.

### 9.2 Per-embed attribute audit

| Embed | `title` | `referrerpolicy` | `loading` | `sandbox` | `min-height` | `scrolling="no"` | Fallback content |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GHL cal — `private-corporate.html:41` | **No** | No | No | No | **No** | Yes | **None** |
| GHL cal — `festivals-tours.html:42` | **No** | No | No | No | **No** | Yes | **None** |
| GHL cal — `residencies.html:41` | **No** | No | No | No | **No** | Yes | **None** |
| GHL cal — `brand-activations.html:41` | **No** | No | No | No | **No** | Yes | **None** |
| GHL cal — `collab.html:102` | **No** | No | No | No | Yes (850px) | Yes | None |
| GHL form — `assets/submit.js:264-300` | Yes `:266` | Yes `:268` | No | No | Yes (1342px `:271`) | Yes `:267` | Yes — `fallbackPanel()` |
| Spotify — `music.html:51` | **No** | No | Yes | No | n/a | — | None |
| Spotify — `collab.html:75` | **No** | No | Yes | No | n/a | — | None |
| Spotify — `assets/submit.js:174-183` | Yes `:176` | Yes `:178` | Yes `:177` | No | fixed 380px | — | Facade + text |
| YouTube ×5 | Yes (all) | No | No | No | n/a | — | None |

The injected frames are consistently better configured than the in-markup ones —
the newer code applies `title`, `referrerpolicy`, a height reservation, and a
fallback path, none of which the older in-markup embeds have.

### 9.3 Answers to the specific embed questions

**Scripts duplicated?** No harmful duplication. Each booking page loads
`form_embed.js` exactly once. `assets/submit.js:303-308` guards injection with an
existence check, so `submit.html` loads it at most once. The real issue is *host*
inconsistency, not duplication — L-07.

**Would sandboxing break legitimate operation?** **Yes, and it is not
recommended.** A GHL form or calendar requires script execution, form submission,
its own storage access, and popups for some flows. The minimum viable attribute
would be `sandbox="allow-scripts allow-forms allow-same-origin allow-popups"` —
and because `allow-scripts` together with `allow-same-origin` permits the framed
document to remove its own sandbox attribute, that combination provides
substantially no isolation. Adding it would create the appearance of hardening
without the substance, while risking breakage. Recommend **not** sandboxing these
frames. Stated explicitly because "add `sandbox`" is the reflexive recommendation
here and it would be wrong.

**Can referrer policy be safely improved?** Yes, safely but with small benefit —
L-04. GHL does not require a referrer for embed rendering, evidenced by the two
injected frames already sending `strict-origin-when-cross-origin` while working.

**Is loading behaviour reliable?** For the four bare calendars, no — M-02. For the
injected form, more reliable: a height reservation, a validated URL, and a designed
fallback, but gated behind M-01.

**Can the embed container overflow?** Yes — this is M-02. `scrolling="no"` plus
`overflow:hidden` plus no `min-height` means a failed resize handshake clips
content unscrollably on four pages.

**Is user input ever copied into local JavaScript or HTML?** Yes, in exactly two
places, both reviewed:

1. `#hero-track-link` (`submit.html:130-139`) → `input.value` read at
   `assets/submit.js:91`, `:120` → written to `sessionStorage` (`:105`, `:123`) →
   read back (`:253`) → `url.searchParams.set(CFG.prefillParam, stored)` (`:256`).
   **Safe.** `URLSearchParams.set()` percent-encodes, and the URL object was
   already origin-validated at `:243`, so user input cannot alter the frame's
   origin, inject a scheme, or escape the query string. The value also flows to
   `hint.textContent` (`:96`) — `textContent`, not HTML — and to `detectLane()`
   (`:56-70`), which only performs `indexOf` comparisons.
2. `?track=` on `thank-you.html` → `textContent` (`assets/thank-you.js:56`).
   Safe from XSS; text-injection only — L-01.

Nothing inside the GHL iframes is readable from the parent page: they are
cross-origin, and no `postMessage` listener exists in any first-party file
(verified). Per-field submission data is therefore invisible to this site, which
`README.md:94` also records.

**Could production submissions be exposed in browser storage?** Partially, and
minimally. `sessionStorage["sv_track_link"]` holds the pasted track link — one
field, not the submission. Scope: same-origin, per-tab, cleared when the tab
closes; no `localStorage` and no cookie exist anywhere in the repository
(verified). Name, email, phone and notes are typed **inside** the cross-origin GHL
iframe and are never accessible to, or stored by, this site. The behaviour is
accurately disclosed at `privacy.html:54-60`. One caveat: the value is written
unconditionally whenever the field is non-empty (`:99-109`), including text that is
not a URL, so anything a visitor happens to paste there persists for the tab's
lifetime. Low impact; worth knowing.

**Are URL parameters inserted unsafely?** No. The only two parameter paths are the
two above, and both are handled correctly.

---

## 10. JavaScript trust-boundary review

### 10.1 Dangerous sinks — verified absent

Whole-tree grep across all `.html` and `.js` files:

| Sink | Result |
| --- | --- |
| `eval(` | **Absent** |
| `new Function` / `Function(` | **Absent** |
| `document.write` | **Absent** |
| `insertAdjacentHTML` | **Absent** |
| `outerHTML` | **Absent** |
| `srcdoc` | **Absent** |
| `document.cookie` | **Absent** |
| `localStorage` | **Absent** |
| `javascript:` URL | **Absent** |
| Inline `onclick=` / `onerror=` / `onload=` | **Absent** (one existed historically in the deleted `agu_ocha_index_v2.html` — I-12) |
| `postMessage` listener | **Absent** |

`scripts/check-links.mjs:107-110` independently warns on inline handlers and
reported zero.

### 10.2 Every dynamic DOM insertion, classified by data source

| Location | Sink | Data source | Trust class | Assessment |
| --- | --- | --- | --- | --- |
| `assets/site.js:31` | `innerHTML` | `fetch("header.html" \| "footer.html")` — hardcoded literals at `:109-110` | **Static trusted repository content**, same-origin | **Safe.** The only `innerHTML` in the codebase. The path is never derived from config, a URL, or input. Documented at `:19-22`. |
| `assets/submit.js:175` | `setAttribute("src")` | `CFG.lanes[x].playlistEmbedUrl` via `validUrl` `:145` | Trusted config, validated | Safe |
| `assets/submit.js:265` | `setAttribute("src")` | `CFG.ghlFormUrl` via `validUrl` `:243` | Trusted config, validated | Safe |
| `assets/submit.js:256` | `searchParams.set` | **User input** (hero paste via sessionStorage) | **User-controlled** | **Safe** — encoded by the API; origin already fixed |
| `assets/submit.js:296` | `setAttribute("id")` | `CFG.ghlFormUrl` pathname segment `:259-260` | Trusted config, validated upstream | Safe (attribute, not markup) |
| `assets/submit.js:303-308` | `script.src` + `appendChild` | **Hardcoded constant** `FORM_EMBED_SCRIPT` `:20` | **Static trusted** | **Safe.** Not config-derived — no path exists for config to inject an arbitrary script. Worth stating, since "dynamic script injection" reads alarmingly. |
| `assets/submit.js:421` | `img.setAttribute("src")` | `CFG.curator.photo` — **not validated** | Trusted config, **unvalidated** | **L-02.** `<img src>` does not execute `javascript:`; risk is mixed content / third-party request |
| `assets/submit.js:438` | `a.setAttribute("href")` | `CFG.curator.links[].url` — **not validated** | Trusted config, **unvalidated** | **L-02.** `<a href>` *would* execute `javascript:` — the more meaningful of the two |
| `assets/submit.js:96` | `textContent` | User input via `LANE_COPY` lookup | User-controlled → static map | Safe (map lookup, then `textContent`) |
| `assets/submit.js:398` | `textContent` read | `trigger.textContent` (own markup) | Static trusted | Safe |
| `assets/submit.js:431-432`, `:477-478` | `textContent` via `el()` `:39-44` | `CFG.curator.*`, `CFG.metrics.*` | Trusted config | Safe — `textContent` cannot parse markup |
| `assets/thank-you.js:56` | `textContent` | **`?track=` URL parameter** | **URL parameter** | **L-01** — not XSS; text injection |
| `assets/thank-you.js:70`, `:83` | `setAttribute("href")` | `CFG.lanes.*.playlistUrl`, `CFG.communityUrl` via `validUrl` `:16-28` | Trusted config, validated | Safe |
| `assets/thank-you.js:101`, `:117-121` | `textContent` | Static strings + `CFG.shareUrl` | Trusted config | Safe |
| `assets/site.js:51`, `:71` | `setAttribute`, `classList` | Static literals | Static trusted | Safe |
| `suno-vibez.html:34`, `suno-vibez/index.html:34` | `location.replace` | **Hardcoded relative literal** | Static trusted | Safe — no parameter or config involvement |

### 10.3 Header/footer loading and mobile navigation

`assets/site.js` delegates every handler from `document` (`:62-79`, `:83-97`)
rather than binding to fragment elements, which correctly solves the problem that
scripts inside an `innerHTML`-injected fragment never execute. The `data-nav-toggle`
/ `data-nav-close` attribute contract is clean, `aria-expanded` is kept in sync
(`:49-52`), and Escape only acts while the menu is open and only restores focus if
focus was inside it (`:83-97`) — careful work. The one weakness is error handling:
the `catch` at `:32-34` logs and nothing more (M-03).

### 10.4 Error handling summary

| Location | Handling | Assessment |
| --- | --- | --- |
| `assets/site.js:32-34` | `console.error` only | **M-03** — silent sitewide degradation |
| `assets/submit.js:29-31`, `thank-you.js:19-22` | `new URL()` in try/catch → `null` | Correct — invalid config degrades to the empty state |
| `assets/submit.js:104-108`, `:122-124`, `:252-254` | `sessionStorage` in try/catch | Correct — private-browsing safe, with the comment at `:107` explaining the fallback |
| `assets/thank-you.js:53-54` | `URLSearchParams` in try/catch | Correct |
| `assets/thank-you.js:112`, `:115-122` | `navigator.share`/`clipboard` rejection handled | Correct |
| `assets/submit.js:321-324` | `IntersectionObserver` feature-detected with direct-render fallback | Correct |

No unhandled rejection path was found in `submit.js` or `thank-you.js`.

### 10.5 Storage inventory

| Mechanism | Key | Written | Read | Lifetime | Contains |
| --- | --- | --- | --- | --- | --- |
| `sessionStorage` | `sv_track_link` | `submit.js:105`, `:123` | `submit.js:253` | tab session | the pasted track link (or any pasted text) |
| in-memory | `window.svEvents` | `analytics.js:33`, `:43` | nothing | page load | event names + props, never transmitted |
| in-memory | `window.svLane` | `submit.js:93` | `analytics.js:59` | page load | `"a"`, `"b"`, or `null` |

**No cookies. No `localStorage`. No IndexedDB. No submission record of any kind is
stored client-side.**

---

## 11. External dependency review

### 11.1 Full dependency table

| Domain | File : line | Purpose | Executes code | SRI possible | Local copy practical | Removal breaks | Privacy | Supply chain | Recommended treatment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cdn.tailwindcss.com` | 18 files, `<head>` (see M-07) | Runtime CSS generation | **Yes — full JS** | **No** for the unversioned URL (bytes change on release; no published hashes) | Yes — a pre-built CSS file, produced externally | **All styling on every page** | Requests from every visitor on every page | **Highest impact on the site.** Unpinned, unverified, executes on origin | Pin a version now; self-host or build later (§18.5). **M-07** |
| `api.leadconnectorhq.com` | 5 calendars + injected form (§9.1) | Booking + submission widgets | Yes, inside cross-origin iframe | N/A (iframe) | **No** — it is the processor | All booking + all submission | Receives visitor requests and all submitted PII; disclosed at `privacy.html:72` | Isolated by iframe origin boundary | Keep. Add `title`, `referrerpolicy`, `min-height`. **Do not sandbox** (§9.3) |
| `api.leadconnectorhq.com/js/form_embed.js` | `residencies.html:42`, `brand-activations.html:42` | Iframe resize handshake | **Yes — on our origin** | Not published | No | Calendar sizing on 2 pages | Same-vendor | Standardise host — **L-07** |
| `link.msgsndr.com/js/form_embed.js` | `private-corporate.html:42`, `festivals-tours.html:43`, `collab.html:109`, `assets/submit.js:20` | Same | **Yes — on our origin** | Not published | No | Calendar/form sizing on 3 pages + submit | Same-vendor | Standardise host — **L-07** |
| `www.youtube.com` | `index.html:51`, `music.html:66`, `:79`, `book.html:128`, `collab.html:59` | Video | Yes, in iframe | N/A | No | 5 video embeds only | Google cookies on frame load; disclosed `privacy.html:73` | Isolated by iframe | Keep. Consider `loading="lazy"` and trimming the broad `allow` lists |
| `open.spotify.com` | `music.html:51`, `collab.html:75`, `assets/suno-vibez-config.js:73` | Artist/playlist players | Yes, in iframe | N/A | No | 3 music embeds | Spotify cookies; disclosed `privacy.html:74` | Isolated by iframe | Keep. Add `title` — **L-03** |
| `app.aguocha.com` | `media.html:62` | Media request form page | N/A — navigation | N/A | N/A | Media request route | Destination unseen by this review | Operator-owned subdomain | Confirm destination — §17 item 4 |
| `tour.aguocha.com` | `tour.html:43` | Tour signup | N/A — navigation | N/A | N/A | Tour signup route | Destination unseen | Operator-owned | Confirm — §17 item 4 |
| `store.aguocha.com` | `header.html:66`, `:108`, `footer.html:32`, `store.html:43` | Commerce | N/A — navigation | N/A | N/A | Store route | Destination unseen | Operator-owned | Confirm — §17 item 4 |
| `chatbotfarm.ai` | `footer.html:64` | "powered by" credit | N/A — navigation | N/A | N/A | Nothing | None | None | Keep. `rel="noopener"` already set |
| `schema.org` | `submit.html:475` | JSON-LD vocabulary URI | **No** | N/A | N/A | Nothing | **No network request is made** | None | Keep. Not a dependency |

**Verified: zero `integrity=` and zero `crossorigin=` attributes exist anywhere in
the repository.** There are no external fonts (the Google Fonts link existed only
in the deleted `agu_ocha_index_v2.html` — I-12), no external stylesheets, and no
analytics or tracker of any kind.

### 11.2 `cdn.tailwindcss.com` — the specific determinations requested

| Question | Determination |
| --- | --- |
| Used as a production runtime dependency? | **Yes, unambiguously.** All 18 pages load it synchronously in `<head>`. It is not a build artifact or a development convenience: it *is* the stylesheet, generated by JavaScript in the browser on every page load. Tailwind documents the Play CDN as not for production. |
| What risk does it create? | Two, separated in M-07. **Supply chain:** high impact, low likelihood — arbitrary script execution on the origin if the CDN or its DNS were compromised, with access to `sessionStorage` and the ability to rewrite the GHL iframe. **Availability:** moderate impact, moderate likelihood — a slow, blocked, or failed CDN renders every page unstyled, since the inline `<style>` blocks carry only colour tokens and a few component rules. Also unpinned, so a future Tailwind major could change rendering with no commit. |
| Does replacing it require a build pipeline? | **Not necessarily.** Three tiers: pin a version (no build, one-line per page); commit a pre-built CSS file generated once externally (no ongoing build, but a manual regeneration step whenever new utilities are used); full Tailwind CLI + CI (a real pipeline). Only the third is a build pipeline. |
| Is replacement necessary for this project? | **No.** It is not a present defect and nothing in the Submit Music objective depends on it. Version pinning is a reasonable low-risk hardening step to consider; full replacement is not required to ship the submission work. |
| Current project or separate migration? | **Separate migration.** The brief prohibits replacing Tailwind, installing dependencies, and creating a build process. Self-hosting also unlocks a meaningful CSP (§14), so the two belong in one deliberate piece of work rather than being smuggled into this one. Recorded in §18.5. |

---

## 12. Privacy and submission disclosure review

### 12.1 Requested disclosure checklist

| Requirement | Where addressed | Verdict |
| --- | --- | --- |
| Who receives submitted information | `privacy.html:83-89`, `:64-75` | **Adequate.** GoHighLevel/LeadConnector, YouTube and Spotify are named explicitly at `:72-74` — unusually specific for a site this size |
| What information is collected | `privacy.html:85-88` — name, email, phone, track link | **Gap.** Narrower than what the live form reportedly collects: `README.md:98-108` records ten fields including first name, last name, and official release date. The notice under-describes the collection |
| Why it is collected | `privacy.html:86-88` | Adequate |
| Whether GHL processes the information | `privacy.html:72` | Adequate |
| Marketing consent separate | `submit.html:280`, `:426` | **Gap — M-06.** Bundled with the transactional submission; no separate opt-in anywhere on the site |
| Creators retain ownership | `submission-terms.html:61-65` | **Clear** |
| Submission transfers copyright | `submission-terms.html:61-65` — explicitly does not | **Clear** |
| Placement guaranteed | `submission-terms.html:92-97`; `submit.html:348`; `footer.html:55` | **Clear, stated three times** |
| Tracks may be promoted | `submission-terms.html:78-84`; `submit.html:243-245`, `:406` | **Clear** — limited, revocable, non-exclusive licence with promotion scoped to selected tracks |
| Submitter confirms necessary rights | `submission-terms.html:69-74` | **Terms are clear; the form is not.** `README.md:102` records the rights checkbox labelled "Option 1", so the representation is not actually stated at the point of capture — M-06 |
| Suno endorsement | `footer.html:66-70` sitewide; `submission-terms.html:50-56`; `README.md:60` | **Handled well** — non-affiliation on every page, and no Suno logo, wordmark, or brand colour anywhere |
| How to contact the operator | `privacy.html:107-113`; `submission-terms.html:105-111`; header and footer | **Weak — L-08.** SMS/phone only; no email address exists anywhere on the site |
| Unpublished links may be shared | `submission-terms.html:115-120`; `privacy.html:93-94` | **Adequate and candid** — "Submissions are not confidential", plus a request for public links rather than attachments |
| Data retention explained | Nowhere | **Gap — L-10** |

### 12.2 Cross-page consistency

Verified accurate: `privacy.html:44-46` claims the site runs no analytics,
advertising trackers or marketing pixels and sets no cookies of its own — confirmed
by inspection (§10.1, §10.5). `privacy.html:54-60`'s description of session storage
and in-memory event recording matches `assets/submit.js:105` and
`assets/analytics.js` exactly. This is a privacy notice that has been kept in sync
with the code, which is uncommon and worth crediting.

Two inconsistencies: the collected-fields list is narrower than the live form
(§12.1), and the notice is not reachable from the pages that collect the most data
(M-05).

### 12.3 Flagged for attorney review

Not assessed for legal sufficiency and not rewritten. Recommended for counsel:

1. Consent bundling and the SMS consent placeholders — **M-06**, highest priority.
2. The rights-confirmation checkbox wording at the point of capture — M-06.
3. The limited licence at `submission-terms.html:78-88`.
4. The age gate at `submission-terms.html:124-129` (13, or age of majority) against
   the actual audience and COPPA/GDPR-K expectations.
5. Data retention — L-10.
6. The adequacy of an SMS-only data-subject request channel — L-08.
7. `README.md:114` already records that `submission-terms.html` has **not** been
   reviewed by counsel and is "a careful draft, not vetted legal advice."

---

## 13. Missing asset and routing review

### 13.1 Asset verification

| Item | State | User impact | SEO impact | Security | Reliability |
| --- | --- | --- | --- | --- | --- |
| `img/agu-mask-portrait.jpg` | **Absent**, referenced by 11 pages line 14 | Imageless social previews | Moderate — weak share cards | None | None |
| `favicon.ico` | **Present, 0 bytes**, referenced by 18 pages | Default glyph; possible console error | None | None | Negligible |
| `og:image` — 4 newer pages | `img/agu-logo.png`, exists | Works, though square is a poor share ratio | Minor | None | None |
| `apple-touch-icon` | `img/agu-logo.png`, exists, all pages | Correct | None | None | None |
| `img/*.png` × 5 in use | All present | Correct | None | None | Note `img/private-corporate.png` is 2.45 MB and `book.html:53` loads it lazily — page-weight concern only |
| 4 × `*-inquiry-1024-transp-web.png` | Present, **referenced nowhere** | None | None | None | ~1.9 MB of dead weight in the repo |
| `.nojekyll` | Present, 0 bytes | **Correct by design** — a marker file. Not a defect | — | — | — |
| `press/`, `rider/` | Present, **empty** | `README.md:125` describes assets and links that do not exist | None | None | None |

### 13.2 Routing verification

| Route | Serves | Canonical | Indexable | Duplicate risk | Loop risk |
| --- | --- | --- | --- | --- | --- |
| `/submit.html` | `submit.html` | → `/submit` | Yes | Managed by canonical | None |
| `/submit` | same bytes | → `/submit` (self) | Yes, sitemapped | Managed | None |
| `/suno-vibez.html` | stub | → `/submit` | `noindex, follow` | None | **None — verified** |
| `/suno-vibez/` | `suno-vibez/index.html` | → `/submit` | `noindex, follow` | None | **None — verified** |
| `/suno-vibez` | resolves to the directory index (Pages behaviour, **inferred**) | → `/submit` | `noindex, follow` | None | None |
| `/thank-you.html` | `thank-you.html` | **no canonical tag** | `noindex` | Moot — noindex | None |
| `/thank-you` | same file via extension-less resolution (**inferred**) | none | `noindex` | Moot | None |

**Conclusions.** No redirect loop exists — verified by tracing every stub's target.
No unmanaged duplicate content: the only true duplicate pair (`/submit` and
`/submit.html`) is resolved by the canonical tag. Titles are consistent across
routes. There are no competing calls to action between the stubs and `submit.html`
— the stubs contain a single CTA pointing at the canonical page. `thank-you.html`
has no canonical tag, which is harmless given `noindex` but is an inconsistency
with the five pages that do declare one.

The extension-less routes (`/submit`, `/thank-you`, `/suno-vibez`) depend on
GitHub Pages resolving paths without extensions. No sibling directories exist to
provide those routes explicitly (verified: no `submit/`, `thank-you/`, `privacy/`,
or `submission-terms/` directory). `README.md:56` asserts this works. It could not
be verified from the working tree — §17 item 3.

`404.html` is correctly built: `<base href="/">` at `:8` (with the reason at
`:4-7`) ensures relative URLs and the header/footer fetch resolve from the site
root regardless of the depth of the 404-ing path, and `check-links.mjs:50-52`
accounts for that `<base>` when validating. `robots.txt` permits crawling, so every
`noindex` directive is actually seen — the correct configuration.

---

## 14. GitHub Pages limitations

**The central constraint: no file in this repository can set any HTTP response
header.** GitHub Pages serves a fixed header set and offers no mechanism to alter
it — no `_headers` file (that is Cloudflare Pages / Netlify), no `netlify.toml`, no
`.htaccess`, no edge function. Any control that exists only as a response header is
unavailable without a proxy in front of the domain.

**Meta tags do not substitute for response headers.** `<meta http-equiv>` is
honoured for a subset of CSP directives and nothing else in this list. It is
ignored entirely for HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Permissions-Policy`, COOP and CORP, and — importantly — CSP's `frame-ancestors`,
`report-uri` and `sandbox` directives are specified as ignored when delivered by
meta. Claiming otherwise would be wrong.

| Control | Status from repo | Settable in HTML? | Requires | GHL / YouTube / Spotify compatibility risk | Recommended next action |
| --- | --- | --- | --- | --- | --- |
| **Content-Security-Policy** | Absent (verified: only `http-equiv` in the tree is the two meta-refresh tags) | **Partially** — most directives work via meta; `frame-ancestors`, `report-uri`, `sandbox` do **not** | Meta for a partial policy; header/proxy for a complete one | **High.** A working policy today would need `script-src` for `cdn.tailwindcss.com` + both `form_embed.js` hosts + `'unsafe-inline'` (the two stub inline scripts, I-11); `style-src 'unsafe-inline'` is **mandatory** because the Tailwind Play CDN injects styles at runtime; `frame-src` for `api.leadconnectorhq.com`, `www.youtube.com`, `open.spotify.com`. A policy that permissive blocks little | **Defer.** An honest assessment: a *meaningful* CSP is not achievable while the Tailwind Play CDN is in use. Sequence it after self-hosting (§18.5), then start report-only |
| **Strict-Transport-Security** | Not visible | **No** | Pages "Enforce HTTPS" setting, or a proxy | None | Confirm "Enforce HTTPS" is on (§17 item 1) and measure the live header |
| **X-Content-Type-Options** | Not visible | **No** | Header / proxy | None | Measure live; add at the proxy if one is introduced |
| **Referrer-Policy** | Absent as a page-level policy; two iframes set it per-element | **Yes** — `<meta name="referrer">` is honoured | Nothing | **None** | **Actionable now.** A sitewide `strict-origin-when-cross-origin` meta matches the modern browser default and the two injected frames. Low value, near-zero risk |
| **Permissions-Policy** | Absent | **No** as a header; per-iframe `allow=` is the practical equivalent and is already used | Header / proxy for site scope | Trimming the broad `allow` lists on the YouTube frames (`accelerometer; gyroscope; …`) is safe but low value | Optional: trim `allow` lists. Do not expect a header |
| **CSP `frame-ancestors`** | Absent | **No — explicitly ignored in meta** | Header / proxy only | None | Defer to proxy |
| **X-Frame-Options** | Absent | **No** | Header / proxy only | None | **Low priority, and say why:** the site has no authenticated session, no state-changing same-origin control, and no first-party form. The only inputs are third-party iframes that GHL protects with its own framing rules. Clickjacking exposure here is genuinely low — this is not a gap worth inflating |
| **Cross-Origin-Opener-Policy** | Absent | **No** | Header / proxy | `same-origin` would sever `window.opener` for `target="_blank"` links — already mitigated, every such link carries `rel="noopener"` (verified by `check-links.mjs:101-105`, zero findings) | Low value here. Defer |
| **Cross-Origin-Resource-Policy** | Absent | **No** | Header / proxy | Would restrict other sites embedding our assets; we publish no sensitive assets | Very low value for a public static site. Defer |

**Additional platform facts relevant to this repository.** Because `.nojekyll` is
present, GitHub Pages publishes dot- and underscore-prefixed paths, so any
committed dotfile becomes fetchable (see I-01 and §15). There is no server-side
processing of any kind, which is precisely why every form is a third-party
iframe — a design constraint, not a defect.

---

## 15. Recommended repository controls

Recommendations only. None implemented.

1. **Add a `.gitignore`** — I-01. At minimum: `.env`, `.env.*`, `node_modules/`,
   `.claude/settings.local.json`, `.DS_Store`, `Thumbs.db`, `*.log`, editor
   directories. The current clean state depends on one developer's global ignore.
2. **Add a `SECURITY.md`** — absent (confirmed in the inventory). A short file
   giving a contact route for vulnerability reports. Note L-08: there is currently
   no email address anywhere on the site, so this needs a channel to name.
3. **Never commit, under any circumstances:**
   - `.env` files, or any file holding a GoHighLevel **API key**, Private
     Integration token, or agency/location API credential — these are categorically
     different from the public widget IDs discussed in §9.1;
   - GHL private webhook URLs or inbound-webhook endpoints;
   - Cloudflare API tokens, GitHub PATs (`ghp_`, `github_pat_`), or deploy keys;
   - SMTP/mail credentials, Twilio auth tokens, or any messaging-provider secret;
   - private keys or certificates (`-----BEGIN`);
   - exported submitter data, CRM extracts, or any file containing third-party
     personal information;
   - internal GHL admin URLs, or screenshots showing an authenticated GHL session.
   The operative reason is §4.1 and I-12: history is permanent, so a secret
   committed once and removed later remains in the repository forever.
4. **Keep `assets/` free of secrets** — already stated at
   `assets/suno-vibez-config.js:5-6` and `README.md:116`. That instruction is
   correct and should be preserved in any refactor; it is the single most important
   convention in the codebase, since `assets/*.js` is fetched verbatim by every
   visitor.
5. **Treat the six GHL identifiers as public but rotatable.** They are not
   credentials, but if spam becomes a problem the form ID is the lever — regenerating
   it in GHL requires updating `assets/suno-vibez-config.js:51` only.
6. **Preserve the field-key contract.** `track_link`, `creator_name`, `email`,
   `genre`, `submission_notes`, `rights_confirmed`, and `prefillParam`
   (`assets/suno-vibez-config.js:59`) are an integration contract with GHL
   workflows. Renaming any of them silently breaks the prefill and downstream
   automation — `README.md:108` says so and it should stay said.
7. **Deferred (prohibited this stage):** a CI workflow running
   `node scripts/check-links.mjs` on pull requests, and branch protection on `main`.
   Recorded as known, accepted gaps — I-02.

---

## 16. Recommended Cloudflare or DNS controls

Recommendations only. No DNS or hosting change was made or is proposed for
execution in this stage. These apply **only** if the operator chooses to place a
reverse proxy in front of the domain; without one, none of it is available on
GitHub Pages (§14). Whether a proxy exists today is unknown — §17 item 2.

| Control | Value here | Notes and compatibility |
| --- | --- | --- |
| Response security headers | **The main reason to consider a proxy.** It is the only route to HSTS, `X-Content-Type-Options`, `frame-ancestors`, COOP and CORP | Introduce CSP in **report-only** mode first, and only after §18.5 removes the Tailwind Play CDN — otherwise the policy must be so permissive it is close to meaningless |
| HSTS with `includeSubDomains` | Moderate | **Caution:** `app.`, `store.` and `tour.aguocha.com` are separate services (§17 item 4). `includeSubDomains` forces HTTPS on all of them; confirm each supports it before enabling, or omit the directive |
| Server-side 301s for legacy routes | Low–moderate | Would replace the client-side stubs (I-11) with real redirects and remove the inline-script obstacle to a strict CSP. Requires deleting the stubs — prohibited this stage |
| Extension-less URL rewriting | Low | Would make `/submit` and `/thank-you` explicit rather than dependent on Pages behaviour (§17 item 3) |
| Bot / rate-limiting in front of the site | **Low, and worth being clear about** | The submission form is a **third-party iframe**; visitors POST directly to `api.leadconnectorhq.com`, not through this origin. A proxy in front of `aguocha.com` therefore **cannot** rate-limit form submissions. Anti-spam belongs in GHL — §17 item 9 |
| Caching / TLS management | Low | Operational convenience, not security |

**Honest bottom line:** a proxy is not required to ship the Submit Music work, and
introducing one adds an operational dependency. Its value is almost entirely
"unlocks response headers." That is worth having eventually and is not urgent given
that no Critical or High finding depends on it.

---

## 17. Items requiring operator confirmation

| # | Item | Why it matters | Evidence |
| --- | --- | --- | --- |
| 1 | Is Pages "Enforce HTTPS" enabled, and does the live response carry HSTS? | Cannot be seen from the tree; determines whether §14's HSTS row is already satisfied. Verify with `curl -sI https://aguocha.com/` | §4.2 |
| 2 | Does any reverse proxy (Cloudflare or other) front the domain today? | Determines whether §16 is immediately actionable or requires new infrastructure | §4.2 |
| 3 | Do `/submit`, `/thank-you` and `/suno-vibez` actually resolve? | The canonical tag (`submit.html:12`) and `sitemap.xml:12` both depend on it; no sibling directories exist as a fallback | §13.2 |
| 4 | What platforms serve `app.`, `store.` and `tour.aguocha.com`? | Three externally-linked subdomains whose content and data handling this review cannot see; `privacy.html:64-79` does not mention them as processors | `media.html:62`, `store.html:43`, `tour.html:43` |
| 5 | **Is the GHL post-submit redirect set to `thank-you.html`?** | **M-04** — the confirmation page is otherwise dead | `assets/suno-vibez-config.js:29-31` |
| 6 | Does the live form still ask for ten fields, with the placeholder SMS consent text and the "Option 1" rights checkbox? | **M-06** — the highest-priority item, and it needs counsel | `README.md:98-108` |
| 7 | Are `api.leadconnectorhq.com/js/form_embed.js` and `link.msgsndr.com/js/form_embed.js` currently equivalent, and which does GHL document as canonical? | **L-07**; also determines any future CSP allowlist | `residencies.html:42` vs `private-corporate.html:42` |
| 8 | Is Spotify playlist `5UP8zLioz5jelEk4n5sFi8` intended to serve both the collab pitch and Suno Vibez? | It is embedded as both (`collab.html:77`, `assets/suno-vibez-config.js:71`); if they should differ, one is wrong | `collab.html:77` |
| 9 | What anti-spam protection is active on the GHL form? | Anyone can POST to a public widget ID; the site cannot rate-limit a third-party iframe (§16) | §9.1 |
| 10 | Are the five booking calendars live and routing to a monitored destination? | The repository cannot confirm any of the six embeds functions | §9.1 |
| 11 | What is the actual data retention period in GHL? | **L-10** — any published statement must match reality | `privacy.html:83-95` |
| 12 | Is a monitored email address (or GHL contact form) available for privacy and vulnerability reports? | **L-08** and §15 item 2 | whole-tree grep: no email exists |
| 13 | Repository visibility and branch protection on `main` | Determines urgency of §15 item 3; deployment is direct from `main` with no CI | §4.2, I-02 |
| 14 | Are the four unreferenced `*-inquiry-*.png` images obsolete? | ~1.9 MB of unreferenced assets | §13.1 |
| 15 | Should a general `terms.html` exist, distinct from the song submission terms? | Absent; only submission-specific terms exist | inventory §5.3 |

---

## 18. Proposed remediation sequence

Proposal only. Nothing here is implemented, and each group needs approval.

### 18.1 Immediate, low-risk corrections

Independent of the submission work, individually small, none touching a GHL setting.

1. Add `privacy.html` and `submission-terms.html` to `footer.html` — **M-05**. One
   file, covers all 18 pages, highest value-to-risk ratio in the report.
2. Add `title` to the seven untitled iframes and `referrerpolicy` to the twelve
   in-markup iframes — **L-03**, **L-04**. Same tags, one pass.
3. Add `min-height` to the four bare booking calendars — **M-02** (sizing half).
4. Add an `<h1>` and one line of context to `book.html` and the four booking pages —
   **I-06**, and the fallback-content half of **M-02**.
5. Resolve `img/agu-mask-portrait.jpg` on 11 pages — **L-05**. Repointing is a code
   change; producing artwork is operator work.
6. Add a `.gitignore` — **I-01**.
7. Decide `favicon.ico` — **L-06**.

### 18.2 Submit Music consolidation

The core of the next stage. Sequence matters.

1. **Make the form exist without JavaScript** — **M-01**. The single most important
   change. Decide between static-first embedding and a `<noscript>` fallback; note
   the prefill/`form_embed.js` interaction in M-01's compatibility note.
2. **Set the GHL post-submit redirect** to `thank-you.html` — **M-04**. Operator
   action, and it makes an already-built page live.
3. **Constrain or drop `?track=`** — **L-01**. Do this **before** step 2 enables the
   parameter, not after.
4. **Fix consent and rights capture in the GHL form** — **M-06**. Needs counsel.
   Preserve the field-key contract (§15 item 6).
5. **Populate `curator` and `metrics`, or soften the two false FAQ answers** —
   **L-09**; remember the JSON-LD duplicate (**I-08**).
6. **Validate the curator URLs** — **L-02**. Before populating, not after.
7. **Decide the multi-playlist question** — **I-05**. If more playlists are real,
   decide it now; retrofitting is more expensive than designing for it.
8. Add a fallback nav for `assets/site.js` failure — **M-03**, acknowledging the
   duplication trade-off.

### 18.3 Security hardening

1. Sitewide `<meta name="referrer" content="strict-origin-when-cross-origin">` —
   the only §14 control fully available today.
2. Pin the Tailwind CDN to a version path — **M-07** option 1. Removes
   surprise-breakage risk without a build step.
3. Standardise the `form_embed.js` host after confirming with GHL — **L-07**.
4. Add `SECURITY.md` once a contact channel exists — §15 item 2.
5. Extend `check-links.mjs` to cover `<meta>` URLs and `assets/*.js` — **I-03**.

### 18.4 Hosting-level operator actions

1. Confirm Pages "Enforce HTTPS" and measure live response headers — §17 item 1.
2. Confirm extension-less routing works — §17 item 3.
3. Confirm the three `*.aguocha.com` subdomains' platforms and data handling —
   §17 item 4.
4. Confirm GHL anti-spam on the public form — §17 item 9.
5. Decide whether a reverse proxy is wanted. **Not urgent** — no Critical or High
   finding depends on it (§16).
6. Consider CI and branch protection when the prohibition lifts — **I-02**.

### 18.5 Deferred modernization

Explicitly out of scope, recorded so it is a decision rather than an oversight.

1. Replace the Tailwind Play CDN with a self-hosted or built stylesheet — **M-07**.
   This is the prerequisite for a meaningful CSP.
2. Introduce a Content-Security-Policy — only after (1), and report-only first.
3. Adopt build-time includes for `header.html`/`footer.html`, removing the runtime
   fetch that causes **M-03**.
4. Generate the JSON-LD `FAQPage` from the accordion markup — **I-08**.
5. Consider server-side 301s for the legacy routes if a proxy is adopted — **I-11**.

---

## 19. Explicit non-findings

Each statement below was verified by inspection. Only verified statements are
included.

**Secrets and credentials**

- **No private GoHighLevel API key, Private Integration token, or agency/location
  API credential** exists in the working tree or in any of the 27 commits.
- **No password** of any kind. The only `passw` matches in history are
  `if (url.username || url.password) return null;` — a security *check* in
  `assets/submit.js:36` and `assets/thank-you.js:27`.
- **No private webhook URL** — no `hooks.slack.com`, no `discord.com/api/webhooks`,
  no GHL inbound webhook endpoint.
- **No GitHub token** (`ghp_`, `github_pat_`), no AWS key (`AKIA…`), no Google API
  key (`AIza…`), no OpenAI-style key (`sk-…`), no Slack token (`xox[baprs]-`), no
  Stripe live key, no SendGrid key, no JWT, and no PEM private key block — verified
  against every text blob in every commit.
- **No mail, SMTP, Twilio, or Cloudflare credential.**
- **No `.env` file** ever committed; no environment file in the tree.
- **No internal administrative URL** and no authenticated GHL URL.
- **No debug output, stack trace, or commented-out credential.**
- **No third-party personal information** — no submitter data, CRM extract, or
  contact list. The only personal detail published is the operator's own business
  phone number, deliberately (**I-10**).

**Architecture**

- **No server-side form processor.** No PHP, no serverless function, no API route,
  no `<form action>` — indeed **no native `<form>` element exists anywhere**; the
  hero field at `submit.html:130-139` is a bare `<input>`.
- **No local storage of submissions.** No `localStorage`, no cookie, no IndexedDB.
  The only persistence is `sessionStorage["sv_track_link"]` — one field, per-tab,
  cleared on close, and accurately disclosed at `privacy.html:54-60`.
- **No analytics, tracker, or marketing pixel.** No GA4, GTM, Meta pixel, or any
  network beacon. `assets/analytics.js` makes **no network request** — verified by
  full read. `privacy.html:44-46` is accurate.
- **No external font** and **no external stylesheet.**
- **No `postMessage` listener**, so nothing from inside any iframe can drive
  first-party code.
- **No `eval`, `new Function`, `document.write`, `insertAdjacentHTML`, `outerHTML`,
  `srcdoc`, or inline event handler** anywhere in the tree.
- **No `http://` resource.** Every external reference is `https:`.
- **No mixed content** and **no protocol-relative URL** — `check-links.mjs:74`
  errors on those and reported none.
- **No redirect loop.** Both legacy stubs target `submit.html`, which does not
  redirect.
- **No duplicate GHL form load.** Guarded at three points (§8.3).
- **No `target="_blank"` without `rel="noopener"`** — 0 findings from
  `check-links.mjs:101-105`.
- **No broken internal link and no broken in-page fragment** — 0 errors across 20
  HTML files. Note the checker's blind spots (**I-03**): this statement covers
  `href`/`src` only.
- **No evidence of compromise, defacement, injected content, or unexpected commit.**
  All 27 commits have coherent messages and diffs consistent with the site's stated
  development history.

**Also verified as sound, and worth stating because they are where a real
vulnerability would most plausibly live**

- The user's pasted track link reaches the GHL form through
  `URLSearchParams.set()` — properly encoded, on a URL whose origin was already
  validated. It cannot change the iframe's origin or inject a scheme.
- The only `innerHTML` in the codebase (`assets/site.js:31`) takes a hardcoded
  same-origin path, never config, a URL, or input.
- The dynamically injected script (`assets/submit.js:303-308`) uses a hardcoded
  constant, not a config value.
- `?track=` is written with `textContent`, so **L-01 is text injection, not XSS.**
- Blocking `assets/analytics.js` does not break the form — every call site is
  guarded (**I-09**).

---

## 20. Files inspected

**Read in full (26).** `404.html`, `book.html`, `brand-activations.html`,
`collab.html`, `festivals-tours.html`, `footer.html`, `header.html`, `index.html`,
`media.html`, `music.html`, `privacy.html`, `private-corporate.html`,
`residencies.html`, `store.html`, `submission-terms.html`, `submit.html`,
`suno-vibez.html`, `suno-vibez/index.html`, `thank-you.html`, `tour.html`,
`assets/analytics.js`, `assets/site.js`, `assets/submit.js`,
`assets/suno-vibez-config.js`, `assets/thank-you.js`, `scripts/check-links.mjs`.

**Configuration and documentation (5).** `CNAME`, `robots.txt`, `sitemap.xml`,
`.nojekyll`, `README.md`.

**Recovered from history and reviewed (2).** `agu_ocha_index_v2.html` (deleted in
`e9c9c6c`), `assets/suno-vibez.js` (deleted in `7eaa77b`).

**Inspected as metadata only (10).** The nine PNGs in `img/` and `favicon.ico` —
size and reference status; image contents not analysed.

**Examined but out of repository scope (1).** `.claude/settings.local.json` — read
to establish that it is untracked and never committed (§4.3).

**History.** All 27 commits reachable from all refs; every text blob scanned twice.

---

## 21. Commands run

Read-only throughout. **No network request was made and no production endpoint was
contacted.**

| Purpose | Command |
| --- | --- |
| Precondition: branch | `git rev-parse --abbrev-ref HEAD` → `feature/submit-music` ✔ |
| Precondition: clean tree | `git status --porcelain` → empty ✔ |
| Precondition: inventory commit present | `git cat-file -t a45dab57…` → `commit` ✔; `git rev-parse HEAD` → `a45dab57…` ✔ |
| Precondition: inventory file present | `Test-Path SITE-INVENTORY.md` → true, 53,753 bytes ✔ |
| Commit and file history | `git log --all --oneline`; `git log --all --pretty=format: --name-only --diff-filter=A` |
| Secret scan, broad net | `git rev-list --all --objects` → per-blob `git cat-file -p` piped through a keyword pattern set (`api_key`, `secret`, `passw`, `bearer`, `token`, `webhook`, `.env`, `SMTP`, `MAILGUN`, `TWILIO`, `CLOUDFLARE`, `SENDGRID`, `ghp_`, `AKIA`, `AIza`, and others) |
| Secret scan, high-confidence formats | same enumeration against `ghp_`, `github_pat_`, `sk-`, `xox[baprs]-`, `AKIA[0-9A-Z]{16}`, `AIza[…]{35}`, JWT shape, `-----BEGIN`, `hooks.slack.com`, `discord.com/api/webhooks`, `pk_live_`, `sk_live_`, `SG.…` → **zero matches** |
| Deleted-file recovery | `git show <sha>:agu_ocha_index_v2.html`; `git show <sha>:assets/suno-vibez.js` |
| Dangerous-sink grep | `Select-String` over all `.html`/`.js` for 13 sink patterns |
| DOM-sink map | `Select-String -Path assets\*.js -Pattern 'innerHTML\|replaceChildren\|appendChild\|setAttribute\('` |
| Contact-channel check | whole-tree grep for `mailto:` and email-address pattern → none |
| Iframe attribute audit | per-file regex extraction of every `<iframe>` tag, recording `title`, `referrerpolicy`, `loading`, `sandbox`, `min-height`, `scrolling` |
| Header/SRI/noscript checks | grep for `integrity=`, `crossorigin=`, `http-equiv`, `name="referrer"`, `noscript` |
| Heading coverage | per-page `<h1>` presence check |
| Ignore-rule provenance | `git ls-files --error-unmatch .claude/settings.local.json` (not tracked); `git check-ignore -v` → global ignore at `C:\Users\mintl/.config/git/ignore:3` |
| Link validation | `node scripts/check-links.mjs` → **20 files, 0 errors, 0 warnings** |
| Clean-URL sibling dirs | `Test-Path` for `submit/`, `thank-you/`, `privacy/`, `submission-terms/` → all absent |

---

## 22. Limitations

1. **No live testing.** No form was submitted, no calendar opened, no HTTP request
   made to any host. Every conclusion about runtime behaviour is derived from
   reading code, not from observing it. M-01 and M-02 in particular describe
   failure modes reasoned from the markup and the resize contract; they were not
   reproduced in a browser.
2. **The GoHighLevel account interior is invisible.** Form fields, consent strings,
   workflows, the post-submit redirect, calendar availability, notification
   routing, retention settings, and anti-spam configuration were all treated as
   unknown. M-04 and M-06 rest on what the repository *records* about the live form
   (`README.md:98-108`, `assets/suno-vibez-config.js:29-31`), which may be stale.
3. **Live HTTP response headers were not measured.** §14 states what the repository
   can and cannot set; it does not state what the server currently sends. The
   operator must run `curl -sI https://aguocha.com/` to close that gap.
4. **Repository and Pages settings were not inspected.** Visibility, branch
   protection, Pages source, and "Enforce HTTPS" are all §17 items.
5. **Extension-less routing is inferred**, not verified — `/submit`, `/thank-you`
   and `/suno-vibez` depend on GitHub Pages behaviour that cannot be tested from
   the working tree.
6. **No legal assessment.** Privacy and submission language was reviewed for
   presence, internal consistency, and consistency with the code. Legal sufficiency
   was not assessed and no language was drafted or rewritten. §12.3 lists what
   should go to counsel.
7. **Third-party code was not audited.** `form_embed.js`, the Tailwind CDN bundle,
   and the contents of every GHL, YouTube and Spotify frame are opaque to this
   review. M-07 assesses the *dependency posture*, not the vendor's code.
8. **Image contents were not analysed** — only size and reference status. No
   steganographic or metadata review was performed.
9. **Accessibility was noted only where it intersected reliability or disclosure**
   (L-03, I-06). This is not an accessibility audit.
10. **No UX or conversion assessment**, per the brief.
11. **Severity is a judgement.** The two calibration decisions in §5 — nothing
    rated High, and missing headers consolidated rather than enumerated as findings
    — are stated explicitly so they can be disagreed with. A reviewer who considers
    an unpinned CDN script a High finding would move M-07; the reasoning is set out
    in full so that argument can be had on the evidence.

---

*End of Stage 2 review. No production file was modified. No implementation was
performed. Awaiting the next staged instruction.*
