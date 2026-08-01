# Security Hardening Assessment — aguocha.com

- **Repository:** `chatbotfarm/agu-ocha`
- **Branch audited:** `security/hardening-review`, cut from `main`
- **Production baseline SHA:** `3fb7455d4dd890acc0c9bba5ff540165eca18c48`
- **Date:** 2026-08-01
- **Hosting:** GitHub Pages, custom domain `aguocha.com` (`CNAME`)
- **Prior work read before starting:** `SECURITY-REVIEW.md` (baseline
  `7cc37a8`, 2026-07-29), `REMEDIATION-PLAN.md`, `SITE-INVENTORY.md`,
  `STAGE-E-VALIDATION.md`, `docs/GHL_OPERATOR_ACTIONS.md`

This is a **re-audit against current production**, not a re-issue of the earlier
review. The site was substantially rebuilt across the 52 commits between
`7cc37a8` and `3fb7455` — the Tailwind Play CDN was removed, clean directory
routes were introduced, and a repository `.gitignore` was added. Findings from
the prior review that those commits resolved are recorded as closed in §22 and
are not restated as open findings.

---

## 1. Executive summary

**No Critical and no High findings. One Medium, four Low, nine Informational.**

No secret, credential, token, private webhook, or administrative URL exists in
the working tree or anywhere in the 499 objects reachable from any ref,
including deleted files. No arbitrary-code-execution path exists in first-party
code. No evidence of compromise was found.

The first-party JavaScript is genuinely well-built, and the parts that carry
security weight were tested rather than read. Every URL that reaches an
`iframe src` or an `<a href>` passes an `https:` + exact-hostname allowlist
check; the one `innerHTML` assignment in the codebase takes a hardcoded
first-party path; the single `postMessage` listener validates `event.origin`
and never reads `event.data`; and `?type=` routing uses an exact
`hasOwnProperty` match that resists prototype-chain lookups. 57 of 58 fuzzing
assertions against the shipped validators passed (§20).

The one failure is the substance of this report's principal repository fix:

**`validPhotoPath()` in `assets/submit.js:77` permits directory traversal.** Its
regex allows `.` and `/`, so `/img/../../etc/passwd` is accepted by a function
whose documented contract is to keep the curator photograph first-party. The
input is a committed config value, not attacker-controlled, and traversal cannot
leave the origin — so this is **Low**, not a live vulnerability. It is fixed here
because a validator that does not enforce its own stated contract is a latent
defect, and the correction is one line with no behavioural change to any valid
input.

The most significant residual risk is **architectural, not a defect**: GoHighLevel's
`form_embed.js` executes on the `aguocha.com` origin across eight pages, is
unversioned, carries no Subresource Integrity, and is served from **two**
different GHL hosts. A compromise of either host would be a total compromise of
the origin. There is no repository fix — SRI is unworkable against an unversioned
script that changes without notice, and removing the script breaks every calendar
and form. This is rated **Medium** on impact × likelihood and is documented as an
accepted risk requiring a hosting-layer control (§14).

To be explicit about three things a reviewer might expect to see called out and
which are **not** findings: the `?track=` query parameter reflected onto
`/thank-you/` is assigned with `textContent` behind a strict character allowlist
and is **not** XSS; the legacy redirect stubs concatenating `location.search +
location.hash` onto a fixed path are **not** an open redirect; and the GoHighLevel
widget IDs in `assets/*-config.js` are **public embed identifiers, not
credentials**. All three were tested, not assumed (§20, §22).

### Finding counts

| Severity | Count | Fixed here | Deferred |
| --- | --- | --- | --- |
| Critical | 0 | — | — |
| High | 0 | — | — |
| Medium | 1 | 0 | 1 |
| Low | 4 | 2 | 2 |
| Informational | 9 | 1 | 8 |
| **Total** | **14** | **3** | **11** |

---

## 2. Scope

### In scope

- All 34 HTML files (16 directory routes, 16 legacy redirect stubs, `404.html`,
  and the two shared fragments `header.html` / `footer.html`).
- All 8 files under `assets/` that are JavaScript, plus `assets/site.css`,
  `assets/tailwind.css`, `assets/tailwind-input.css`.
- `scripts/check-links.mjs`, `package.json`, `package-lock.json`,
  `tailwind.config.js`.
- `.gitignore`, `.nojekyll`, `CNAME`, `robots.txt`, `sitemap.xml`, `favicon.ico`.
- All 499 objects reachable from any ref, including deleted files.
- The 8 GoHighLevel assets (5 booking calendars, 3 forms).
- Every external script, iframe, image, and link host.
- Privacy and submission disclosure text as published.

### Out of scope

- The GoHighLevel account interior: field configuration, consent text,
  workflows, notification routing, redirect settings, calendar availability.
- GitHub repository settings: visibility, branch protection, Pages
  configuration, secret-scanning enablement. Recommendations only (§16).
- Legal sufficiency of the privacy notice or submission terms.
- UX, conversion, and visual design.
- Live production HTTP testing (see §21 Limitations).

### Authority exercised

Read-only inspection, plus: one new report (this file), one new security policy
(`SECURITY.md`, `.well-known/security.txt`), one new test
(`scripts/check-embeds.mjs`), and three narrowly scoped source corrections
(§19). No form was submitted, no booking was made, no GoHighLevel setting was
touched, no DNS or hosting setting was changed, `main` was not modified.

---

## 3. Current architecture

A static site with no backend, no server-side build, no runtime dependency, and
no authentication. GitHub Pages serves committed files verbatim; `.nojekyll`
disables Jekyll processing.

**Routing.** 16 clean directory routes (`/submit-music/`, `/booking/residencies/`,
…). Each legacy `.html` path survives as a `noindex,follow` redirect stub that
carries both a `<meta http-equiv="refresh">` and an inline
`location.replace(<fixed path> + location.search + location.hash)` so query
strings and fragments survive the hop.

**Shared chrome.** `header.html` and `footer.html` are fetched same-origin by
`assets/site.js` and injected into `#site-header` / `#site-footer` with
`innerHTML`. Because `<script>` inside an `innerHTML`-injected fragment never
executes, all navigation behaviour is delegated from `document`.

**Styling.** A single compiled, committed `assets/tailwind.css` plus a per-page
inline `<style>` block. **No CSS or font is loaded from any external host.**

**Third-party surface.** Four external origins total:
`api.leadconnectorhq.com`, `link.msgsndr.com`, `open.spotify.com`,
`www.youtube.com`, plus one first-party subdomain `store.aguocha.com` (link
target only, never framed or scripted).

**Instrumentation.** `assets/analytics.js` is not an analytics vendor. It makes
no network request, sets no cookie and no storage, and loads no third-party
script. It pushes events onto an in-memory array and dispatches a `CustomEvent`.
Verified: the site ships **zero trackers**, and `/privacy/` says so accurately.

---

## 4. Threat model

### Assets

| Asset | Where | Compromise impact |
| --- | --- | --- |
| Static HTML (34 files) | repository → Pages | Defacement, phishing on a trusted domain |
| Shared fragments (`header.html`, `footer.html`) | injected into every page | **Highest first-party leverage** — one file reaches all 34 routes |
| First-party JS (8 files) | `assets/` | Origin-level script execution |
| Compiled CSS | `assets/tailwind.css` | Visual defacement, UI-redress aid |
| Images | `img/` | Low |
| GitHub repository | `chatbotfarm/agu-ocha` | Total site control |
| Pages deployment | direct from `main` | Total site control; no review gate |
| Custom domain / DNS | `CNAME` → `aguocha.com` | Total traffic interception |
| GHL forms + calendars | 3 forms, 5 calendars | Lead data; consent record integrity |
| Spotify / YouTube embeds | 8 iframes | Visitor privacy; no first-party data |
| `store.aguocha.com` | external subdomain | Commerce; outside this repository |

### Trust boundaries

1. **Browser ↔ GitHub Pages** — first-party origin. Everything served here is
   fully trusted by the browser and shares one origin.
2. **Browser ↔ GoHighLevel** — *two* boundaries, not one, and they differ in
   kind. GHL **iframes** are cross-origin and sandboxed by the origin model.
   GHL's **`form_embed.js` is not** — it executes with full first-party
   privilege on `aguocha.com`. This asymmetry is the single most important line
   in this threat model and is the basis of finding **M-01**.
3. **Browser ↔ Spotify / YouTube** — iframe only. No script from either origin
   executes first-party. Correctly bounded.
4. **Browser ↔ `store.aguocha.com`** — link only. Never framed, never scripted.
5. **Repository ↔ deployment** — no GitHub Actions exist. Pages builds directly
   from `main`; a push to `main` is a production deployment with no review gate.
6. **User-controlled URL parameters** — `?type=` (`assets/booking.js`),
   `?track=` (`assets/thank-you.js`), and `location.search`/`location.hash` on
   16 redirect stubs. All three traced end-to-end in §12 and fuzzed in §20.
7. **JS-injected shared header/footer** — same-origin `fetch` → `innerHTML`.
   Trusted because the path is hardcoded; would become a sink the moment the
   path became dynamic.
8. **JS-injected forms and embeds** — `assets/forms.js`, `assets/submit.js`,
   `assets/booking.js` each build an iframe from a config value behind an
   `https:` + exact-host allowlist.

### Primary risks, assessed

| Risk | Assessment |
| --- | --- |
| Cross-site scripting | **Not present.** No `eval`, `Function`, `document.write`, `outerHTML`, `insertAdjacentHTML`, `srcdoc`, string-timer, or inline handler anywhere. One `innerHTML`, hardcoded path. |
| DOM injection | **Not present.** All dynamic nodes via `createElement`/`textContent`/`setAttribute`. |
| Unsafe URL handling | **One latent defect** — L-01, traversal in `validPhotoPath`. All other validators held under fuzzing. |
| Open redirects | **Not present.** Verified by construction and by test (§20). |
| Third-party script compromise | **The dominant residual risk** — M-01. |
| Credential / secret exposure | **None.** 499 objects scanned, zero matches. |
| Form abuse | Outside the repository — GHL-side anti-spam is an operator action (§18). |
| Clickjacking | **Unmitigated** — L-03. No `frame-ancestors`, no `X-Frame-Options`. Impact limited: no authenticated action exists. |
| Supply-chain risk | Build-time only (`tailwindcss` devDependency); the shipped CSS is committed. No runtime npm dependency. |
| Dependency risk | One devDependency, not shipped to visitors. |
| Repository hygiene | `.gitignore` present and correct. No CI, no CodeQL, no push protection — I-03. |
| Misconfigured public files | `robots.txt`, `sitemap.xml`, `CNAME`, `.nojekyll` all correct. |
| Privacy leakage | Minor — L-02 (referrer), I-06 (`?si=` tokens). |
| Referrer leakage | L-02. |
| Broken external destinations | None. Link check: 0 errors. |
| Stale/misleading consent language | GHL-side; unresolved from prior review — operator + counsel (§17, §18). |
| Insecure mixed content | **None.** Zero `http://` resource URLs; the checker enforces this. |
| Missing security headers | I-01, L-03 — GitHub Pages platform limitation (§14). |
| Unsafe iframe permissions | I-05 — vendor-default `allow` lists, broader than strictly needed. |
| Exposure through git history | **None.** Deleted files reviewed; no secrets. |

**No backend threats are modelled, because no backend exists.** There is no
server-side code, no database, no API, and no authentication anywhere in this
repository.

---

## 5. Findings summary

| ID | Title | Severity | Status | Repo-fixable | Fixed here |
| --- | --- | --- | --- | --- | --- |
| M-01 | GHL `form_embed.js` executes first-party from two unversioned hosts with no SRI | Medium | Accepted risk | No | No |
| L-01 | `validPhotoPath()` accepts `../` traversal, defeating its own first-party contract | Low | Verified | Yes | **Yes** |
| L-02 | 12 of 15 in-markup iframes, plus the `/booking/?type=` router, carry no `referrerpolicy` | Low | Verified | Yes | **Yes** |
| L-03 | Site is framable — no `frame-ancestors`, no `X-Frame-Options` | Low | Platform limit | No | No |
| L-04 | Two distinct GHL hosts serve the same `form_embed.js` | Low | Needs GHL confirmation | Partly | No |
| I-01 | No Content-Security-Policy | Informational | Now feasible | Partly | No |
| I-02 | No vulnerability-disclosure route (`SECURITY.md` / `security.txt`) | Informational | Verified | Yes | **Yes** |
| I-03 | No `.github/` — no CI, CodeQL, Dependabot, or push protection | Informational | Verified | Partly | No |
| I-04 | `favicon.ico` is 0 bytes but referenced by every page | Informational | Verified | Needs asset | No |
| I-05 | YouTube iframes grant `accelerometer; gyroscope` motion sensors | Informational | Verified | Yes | No |
| I-06 | Spotify `?si=` share tokens present on embed and link URLs | Informational | Verified | Yes | No |
| I-07 | All navigation is JS-injected; no nav renders with JS disabled | Informational | Unchanged from M-03 | Needs build step | No |
| I-08 | No retention period stated; rights requests are phone/SMS only | Informational | Counsel | No | No |
| I-09 | Pages deploys directly from `main` with no review gate | Informational | Verified | No | No |

---

## 6. Critical findings

**None.**

## 7. High findings

**None.**

---

## 8. Medium findings

### M-01 — GoHighLevel `form_embed.js` executes with first-party privilege from two unversioned hosts with no Subresource Integrity

- **Severity:** Medium — **not a defect; an accepted architectural risk.**
- **Status:** Verified. No repository fix exists.
- **Affected files:**
  - `booking/private-corporate/index.html:96`, `booking/festivals-tours/index.html:96`,
    `collaborate/index.html:156` → `https://link.msgsndr.com/js/form_embed.js`
  - `booking/residencies/index.html:100`, `booking/brand-collaborations/index.html:100`
    → `https://api.leadconnectorhq.com/js/form_embed.js`
  - `assets/forms.js:32`, `assets/submit.js:20` inject the `link.msgsndr.com`
    copy at runtime on `/tour/`, `/media/`, `/submit-music/`
  - `assets/booking.js:33,43,53,63` selects per-calendar between both hosts

**Evidence.** Eight pages load this script. It is requested from an unversioned
path with no `integrity` attribute and no `crossorigin` attribute — confirmed by
`scripts/check-embeds.mjs` and by direct inspection. It is a classic `<script
src>`, so it runs in the `aguocha.com` origin with unrestricted access to the
DOM, to `sessionStorage`, and to every same-origin `fetch`.

**Attack scenario.** An attacker who compromises GoHighLevel's CDN, or any
upstream in its delivery path, serves modified JavaScript to `aguocha.com`
visitors. That script can rewrite the booking calendars, overlay a credential or
payment prompt on a domain the visitor trusts, exfiltrate the pasted track link
from `sessionStorage`, or silently alter the submission form's destination. The
blast radius is the whole origin, not the embed.

**Preconditions.** Compromise of a third party the site does not control. No
precondition is under the operator's or an attacker's local control.

**Impact.** Total, for the origin. **Likelihood.** Low — GoHighLevel is an
established vendor with no known compromise. Medium is the product of the two,
and the severity model explicitly places "requires third-party compromise" at
Medium.

**Recommended correction.** None available in this repository:

1. **SRI is not workable.** `form_embed.js` is unversioned and GHL changes it
   without notice or published hashes. An `integrity` attribute would pin a hash
   that GHL will silently invalidate, and the *next* GHL release would break
   every calendar and form on the site. This is exactly the case the brief names
   as one where SRI should not be recommended.
2. **Removal breaks the product.** Without it no calendar or form resizes; the
   frames collapse or clip. Five booking journeys and three forms depend on it.
3. **The only real mitigation is a Content-Security-Policy `script-src`
   allowlist delivered as an HTTP header**, which GitHub Pages cannot set. That
   requires a proxy (§14) and is a separate project.

**Regression risk of the recommended action:** N/A — no action taken.
**Repository-fixable:** No. **Operator action required:** Yes, if the CSP path in
§14 is pursued. **Counsel review:** No.
**Test:** `scripts/check-embeds.mjs` pins the current external script hosts to a
two-host allowlist, so a *third* script origin cannot be added unnoticed.

---

## 9. Low findings

### L-01 — `validPhotoPath()` accepts `../` traversal, defeating its own documented contract

- **Severity:** Low. **Status:** Verified by test, **fixed in this branch**.
- **Affected file:** `assets/submit.js:77`

**Evidence.** The validator is:

```js
return /^\/img\/[A-Za-z0-9._\-/]+$/.test(value) ? value : null;
```

The character class contains both `.` and `/`, so `../` sequences satisfy it.
Fuzzing (§20) returned:

```
FAIL  reject /img/../../etc/passwd  -> got "/img/../../etc/passwd"
```

Every other assertion against this function passed — `img/x.png` (no leading
slash), `https://evil.com/x.png`, `//evil.com/x.png`, `/IMG/x.png`, and
`/img/x.png?a=b` are all correctly rejected.

**Attack scenario.** The value flows to `img.setAttribute("src", photo)` at
`assets/submit.js:441`. A traversal path resolves to an arbitrary same-origin
path — `/img/../../etc/passwd` normalises to `https://aguocha.com/etc/passwd`.

**Preconditions.** The input is `curator.photo` in
`assets/suno-vibez-config.js:130`, a **committed first-party config value**. It
is not reachable from any URL parameter, form field, or storage key. Exploiting
it requires the ability to commit to this repository — at which point the
attacker has better options.

**Impact.** Very low. Traversal cannot leave the origin (`//evil.com` is
correctly rejected), so the function's *security* purpose — keeping the
photograph first-party so no undisclosed third-party request appears — still
holds. The realistic worst case is a broken image.

**Likelihood.** Very low.

**Why it is fixed anyway.** The function's own documentation states it is
"Restricted to a first-party `img/` path on purpose". A validator that does not
enforce its stated contract is a latent defect: the next person to widen this
input source inherits a bypass they have been told does not exist.

**Recommended correction.** Reject `..` before returning. One line, no change to
any valid input.

**Regression risk.** None. The only production value is `/img/agu-logo.png`,
which is unaffected; verified in §20.
**Repository-fixable:** Yes. **Operator action:** No. **Counsel review:** No.
**Test proving the correction:** `scripts/check-embeds.mjs` §"validPhotoPath"
asserts `/img/../../etc/passwd` → `null` and `/img/agu-logo.png` → unchanged.

---

### L-02 — 12 of 15 in-markup iframes, plus the `/booking/?type=` router, carry no `referrerpolicy`

- **Severity:** Low. **Status:** Verified, **fixed in this branch**.
- **Affected files (13 surfaces):** `assets/booking.js:99-107` — see the note
  below — plus the following 12 in-markup iframes: `index.html:178`, `index.html:220`,
  `music/index.html:67`, `music/index.html:122`, `music/index.html:134`,
  `collaborate/index.html:92`, `collaborate/index.html:112`,
  `collaborate/index.html:147`, `booking/residencies/index.html:99`,
  `booking/private-corporate/index.html:95`,
  `booking/festivals-tours/index.html:95`,
  `booking/brand-collaborations/index.html:99`

**Evidence.** Three in-markup iframes already carry
`referrerpolicy="strict-origin-when-cross-origin"`
(`submit-music/index.html:183`, `media/index.html:84`, `booking/index.html:256`),
as do two of the three JS-built frames (`assets/forms.js:82`,
`assets/submit.js:265`). The other twelve markup iframes carry none.

**A thirteenth surface was found while implementing the fix, not during the
markup audit.** `assets/booking.js` builds a calendar iframe in code for the
`/booking/?type=` route and set no `referrerpolicy` — unlike its two sibling
embedders. The attribute-level markup scan could not see it because the element
never exists in any HTML file. This is the more interesting instance of the two:
`/booking/?type=residency` is precisely the URL whose **query string** discloses
the visitor's booking category, and it is the one route where the referrer had
something to leak beyond the origin. Fixed at `assets/booking.js:107`.

**Attack scenario.** Not an attack — a passive privacy leak. On a browser whose
default is `no-referrer-when-downgrade` (Safari on iOS below 14.5, and older
Android WebViews), the **full URL including path and query** is sent as
`Referer` to Spotify, YouTube, and GoHighLevel. `/booking/?type=residency`
therefore discloses which booking category a visitor was viewing to a third
party that has no need for it.

**Preconditions.** A visitor on a browser that predates the
`strict-origin-when-cross-origin` default. Modern Chrome, Firefox, Edge, and
Safari already apply that default, so for most traffic this attribute changes
nothing.

**Impact.** Minor privacy leakage. **Likelihood.** Moderate on legacy mobile,
which is a real share of music-site traffic.

**Recommended correction.** Add
`referrerpolicy="strict-origin-when-cross-origin"` to the twelve iframes and to
`assets/booking.js`, matching the value already proven in this codebase on the
other five frames.

**Regression risk.** None. This exact value is already live on Spotify, YouTube,
and GoHighLevel frames in this same repository, so all three vendors are
confirmed to work with it. The policy still sends the origin, which is all any
of them use.
**Repository-fixable:** Yes. **Operator action:** No. **Counsel review:** No.
**Test proving the correction:** `scripts/check-embeds.mjs` fails the build if
any cross-origin iframe lacks `referrerpolicy` or `title`, and separately
asserts that all three JS embedders set both — the check that would have caught
`booking.js`. Negative-tested: removing the attribute from `index.html:178`
reproduces the failure.

---

### L-03 — The site can be framed by any origin (no `frame-ancestors`, no `X-Frame-Options`)

- **Severity:** Low. **Status:** Platform limitation. **Not fixed** — cannot be.
- **Affected:** all 34 routes.

**Evidence.** No `Content-Security-Policy` exists in any form; the only
`http-equiv` tags in the tree are the 16 redirect stubs' `refresh` tags. GitHub
Pages does not send `X-Frame-Options` and offers no mechanism to set it.

**Attack scenario.** An attacker frames `https://aguocha.com/booking/` inside a
malicious page and uses UI redress to induce clicks — for example over the
`tel:`/`sms:` buttons, or to lend an unrelated page the appearance of being
operated by Agu Ocha.

**Preconditions.** Victim visits the attacker's page.

**Impact.** Low. There is **no authenticated session, no logged-in state, and no
state-changing first-party control** on this site. The high-value interactions —
booking and submission — occur inside cross-origin GoHighLevel iframes, which
this site cannot protect and which GHL frames under its own policy.

**Likelihood.** Low.

**Recommended correction.** `frame-ancestors 'self'` **cannot be delivered by a
`<meta>` tag** — the directive is ignored outside an HTTP header, by
specification. Mitigation therefore requires a proxy that can set response
headers (§14). Do not add a meta CSP believing it addresses this; it does not.

**Regression risk of the recommended action:** Would need testing at the proxy —
`frame-ancestors 'self'` does not affect the site's own outbound iframes.
**Repository-fixable:** No. **Operator action required:** Yes (hosting).
**Counsel review:** No. **Test:** none possible without the header.

---

### L-04 — Two distinct GoHighLevel hosts serve the same `form_embed.js`

- **Severity:** Low. **Status:** Carried forward from prior L-07, still open.
  **Not fixed** — requires GoHighLevel confirmation.
- **Affected files:** `booking/residencies/index.html:100` and
  `booking/brand-collaborations/index.html:100` use
  `api.leadconnectorhq.com`; `booking/private-corporate/index.html:96`,
  `booking/festivals-tours/index.html:96`, `collaborate/index.html:156`, and
  both JS injectors use `link.msgsndr.com`.

**Evidence.** Same filename, same purpose, two origins. `assets/booking.js:12`
documents the split as inherited from the legacy category pages rather than
intentional.

**Impact.** The set of origins trusted to execute first-party script is one
larger than it needs to be, which widens M-01's surface and would force a future
`script-src` to allowlist both hosts instead of one.

**Likelihood.** N/A — this is surface, not an exploit path.

**Recommended correction.** Consolidate on one host. **Deliberately not done
here.** The two files using `api.leadconnectorhq.com` are the two calendars
whose widgets are *also* served from that host, and GoHighLevel's resize
handshake is origin-sensitive in ways not documented publicly. Changing a
working embed URL on evidence this thin risks breaking two booking journeys to
remove one entry from a future allowlist. The brief's instruction to preserve
external embed URLs "unless the URL itself is the finding" applies.

**Regression risk of the correction:** Medium — it touches live booking embeds
and cannot be verified without submitting or at least loading a production
calendar.
**Repository-fixable:** Partly. **Operator action required:** Yes — confirm with
GoHighLevel that both calendars function with a single script host, then change
in a dedicated branch and test each calendar individually.

---

## 10. Informational findings

### I-01 — No Content-Security-Policy

Now **newly feasible**: the prior review correctly concluded a meaningful CSP was
unachievable while the Tailwind Play CDN generated styles at runtime. Commit
`8a1ffb2` removed it. Full feasibility analysis, including a draft policy and its
honest limitations, is in §14. **Deferred — CSP rollout requires separate
approval per the brief.**

### I-02 — No vulnerability-disclosure route — **fixed in this branch**

Neither `SECURITY.md` nor `/.well-known/security.txt` existed. A researcher who
found an issue in `aguocha.com` had no documented way to report it. Added both,
using the phone number already published sitewide; no new contact channel was
invented. **Operator note:** a dedicated security email would be materially
better than a phone number and is recommended (§18).

### I-03 — No `.github/` — no CI, CodeQL, Dependabot, or push protection

`scripts/check-links.mjs` is a good checker that **never runs automatically**.
Nothing prevents a commit that breaks every link, adds an `http://` resource, or
introduces an inline handler from reaching production. Exact recommended
settings in §16. **Not changed** — the brief forbids modifying GitHub settings
without operator approval, and adding a workflow file is a deployment-affecting
change beyond the remediation authority granted.

### I-04 — `favicon.ico` is 0 bytes but referenced by every page

`ls` confirms 0 bytes. Every page carries `<link rel="icon" href="/favicon.ico">`.
Not a security issue; every visitor makes a request that returns an empty body.
**Requires an asset**, not a code change — operator.

### I-05 — YouTube iframes grant `accelerometer` and `gyroscope`

The four YouTube embeds carry
`allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`,
granting motion-sensor access to a cross-origin frame that does not need it for
playback. This is **YouTube's own published embed snippet**, copied verbatim.
Trimming it is plausible but would be a change made on reasoning rather than
evidence, against a vendor that may depend on those permissions for features not
exercised in testing. **Documented, not changed** — the brief prohibits
speculative changes.

### I-06 — Spotify `?si=` share tokens on embed and link URLs

`index.html:181` (`si=370396ac9c84430c`), `index.html:211`
(`si=f1371b6ab08b4b5f`), and `assets/suno-vibez-config.js:101`
(`si=2840471ba6ed40a3`). These are **public share-attribution tokens, not
credentials** — they identify the share, not an account, and cannot authenticate
anything. Worth noting only because `assets/suno-vibez-config.js:94-96` states
the embed URL "deliberately carries no query string", which `index.html:181`
contradicts. Cosmetic inconsistency; no security impact. **Not changed.**

### I-07 — All navigation is JS-injected; no navigation renders with JS disabled

Unchanged from prior M-03. All 34 pages ship `<div id="site-header"></div>` and
`<div id="site-footer"></div>` filled by `fetch` + `innerHTML`. With JavaScript
disabled or `site.js` blocked, **every page loses its entire navigation**,
including the footer's Privacy Notice and Submission Terms links.

Mitigating context found in this audit: the *content* degrades well. Every page
carries substantial static markup in `<main>` (10–29 text blocks), all form and
calendar fallbacks are static, and `<noscript>` rules correctly reveal the
failure panels. So this is loss of navigation, not a blank page.

**Availability and accessibility, not exploitability.** Rated Informational here
rather than Medium because no confidentiality or integrity impact exists.
**Deferred:** fixing it means inlining the fragments into 34 files, which needs a
build step — explicitly outside the remediation authority granted.

### I-08 — No retention period stated; rights requests are phone/SMS only

Carried forward from prior L-08 and L-10. `/privacy/` is otherwise accurate and
notably specific — it correctly discloses the `sessionStorage` use, the in-memory
event layer, all three embed providers, and GitHub Pages request logging. Two
gaps remain: no retention or deletion period is stated, and access/correction/
deletion requests route only to a phone number (`privacy/index.html:126-128`),
with no email anywhere on the site. **Counsel and operator — not rewritten here**,
per the brief's instruction not to alter approved legal text absent a direct
contradiction or defect.

### I-09 — Pages deploys directly from `main` with no review gate

Any push to `main` is a production deployment. No branch protection is visible
from the working tree, no status check is required, and no `.github/` workflow
exists. Combined with I-03, a single mistaken push reaches `aguocha.com`
immediately. Recommended settings in §16. **Not changed** — operator approval
required.

---

## 11. Secret-scan results

**Result: clean. No secret of any kind was found. No secret value is printed in
this report, because none was discovered to print.**

| Scope | Method | Result |
| --- | --- | --- |
| Working tree | Pattern grep across all `.js`, `.html`, `.json`, `.md`, `.txt`, `.xml` | 0 |
| All refs, all commits | `git grep` over `$(git rev-list --all)` for 11 high-confidence provider formats | 0 |
| **Every object in history** | `git rev-list --objects --all` → 499 objects, each `cat-file`'d and matched against 17 pattern classes | **0** |
| Deleted files | `agu_ocha_index_v2.html`, `assets/home.js`, `assets/suno-vibez.js` recovered and read in full | 0 |
| Env / key files | `.env*`, `*.pem`, `*.key`, `*.p12`, `id_rsa`, `credential*`, `secret*` across all refs | **never existed** |

Pattern classes searched: Anthropic (`sk-ant-`), OpenAI (`sk-`), GitHub
(`ghp_`/`gho_`/`ghu_`/`ghs_`/`ghr_`/`github_pat_`), AWS (`AKIA`/`ASIA`), Stripe
(`sk_live_`/`pk_live_`/`rk_live_` and test variants), Slack (`xox[abprs]-`,
`hooks.slack.com/services/`), Google (`AIza…`, `ya29.`), Discord webhooks, JWT
shape, PEM private-key headers, high-entropy base64 lines, and generic
`password|secret|api_key|access_token|client_secret = "…"` assignments.

The only hits for any credential-shaped pattern anywhere in history were
(a) the defensive checks `if (url.username || url.password) return null;` in
`assets/forms.js`, `assets/submit.js`, and `assets/thank-you.js`; (b) comments
in both config files warning against committing secrets; and (c) the prior
`SECURITY-REVIEW.md` listing the pattern names it had searched for.

### Public identifiers correctly classified as NOT credentials

These are public embed identifiers. They appear in the HTML delivered to every
visitor by design, cannot authenticate anything, and are **not** reported as
exposure:

- **GHL calendar IDs (5):** `gVxSS7k0YEJNYBFPQILA`, `X56pKuTIpw1vu5xdOVpX`,
  `6tuaToT0K8aZFMLYJ2VU`, `Fwzuvt3S944xnibxng7O`, `4Zwyq5uTC8G7JdZW4ltW`
- **GHL form IDs (3):** `hNlynM8h8zLs9jkDlTVW` (Submit Music),
  `VH5umJecHaUdTesROA21` (Tour Updates), `jqVlv3qxUCz06vUEHVMk` (Media Request)
- **Spotify IDs:** artist `5ymz8gAPHU5sgDUhdhVqzh`, playlist
  `5u17B3EXagZ5F2bm0mgCTq`, and the `?si=` share tokens (I-06)
- **YouTube video IDs:** `rCBM8kuzI3U`, `1JGjYV1WcHE`, `qIGUNEUQSFY`, `C_ynqwU8_74`
- **The public phone number** `+17622486242` — published deliberately sitewide

No private GoHighLevel API key, location ID, or webhook URL exists anywhere in
the repository or its history.

---

## 12. Client-side trust-boundary review

### 12.1 Dangerous sinks — verified absent

| Sink | Occurrences | Note |
| --- | --- | --- |
| `eval` | **0** | |
| `new Function` | **0** | |
| `document.write` | **0** | |
| `outerHTML` | **0** | |
| `insertAdjacentHTML` | **0** | |
| `srcdoc` | **0** | |
| `setTimeout`/`setInterval` with a string | **0** | |
| Inline `on*=` handlers | **0** | enforced by `check-links.mjs` |
| `document.cookie` | **0** | |
| `localStorage` | **0** | |
| `innerHTML` | **1** | `assets/site.js:33` — analysed below |

### 12.2 The single `innerHTML`

```js
async function loadHTML(id, file) {          // assets/site.js:25
  var res = await fetch(file, { cache: "no-cache" });
  el.innerHTML = await res.text();           // :33
}
```

Called exactly twice, both with string literals: `loadHTML("site-header",
"/header.html")` and `loadHTML("site-footer", "/footer.html")` (`:147-148`).
`file` is never a URL parameter, config value, or user input. Both paths are
root-relative and same-origin. **Not a vulnerability.** It would become one the
moment `file` accepted a dynamic value — a comment at `:21` already says so.

### 12.3 Every user-controlled value traced end-to-end

| # | Source | Validation | Transformation | Sink | Impact |
| --- | --- | --- | --- | --- | --- |
| 1 | `?type=` — `booking.js:74` | `hasOwnProperty` exact match against 4 keys (`:78`) | none — used only as a lookup key | selects a hardcoded `CALENDARS` entry | **None.** Unknown values render the chooser and load nothing. Never echoed to the DOM. |
| 2 | `?track=` — `thank-you.js:81` | `slice(0,120)` + strict char allowlist + `www.` reject + ≥7-digit reject (`:63-70`) | quoted | `node.textContent` (`:84`) | **Not XSS.** `textContent` cannot create nodes. Allowlist excludes `:` and `/`, so no URL can be rendered. |
| 3 | Pasted track link — `submit.js:132` | none at input (deliberate: spec §7.6 warns, never blocks) | `sessionStorage` → `URLSearchParams.set()` (`:253`) | GHL iframe `src` query | **None first-party.** `set()` percent-encodes; cannot alter the frame's origin or escape the URL. Forwarded to GHL by design and disclosed in `/privacy/`. |
| 4 | `location.search` + `location.hash` — 16 redirect stubs | none needed | concatenated onto a **fixed absolute path** | `location.replace()` | **Not an open redirect.** `search` always begins `?`, `hash` always `#`; the leading `/booking/`-style literal cannot be displaced. Tested in §20. |
| 5 | `curator.photo` — config | `validPhotoPath()` (`:66-78`) | none | `img src` | **L-01** — traversal accepted. Same-origin only. Fixed. |
| 6 | `curator.links[].url` — config | `validHttpsUrl()` (`:48-59`) | none | `<a href>` + `target="_blank"` + `rel="noopener noreferrer"` (`:469-470`) | **None.** `https:` enforced, so `javascript:` cannot reach the href. No host allowlist by design — curator profiles may live anywhere. |
| 7 | `lanes[].playlistUrl` — config | `validUrl()` + 3-host allowlist | none | `<a href>` + `rel="noopener"` | **None.** |
| 8 | `ghlFormUrl` / `tourUpdatesFormUrl` / `mediaRequestFormUrl` — config | `validUrl()` / `validFormUrl()` — `https:` + exact host + `/widget/form/` path + non-empty id | none | iframe `src` | **None.** A `/widget/booking/` URL is rejected on purpose. |
| 9 | `communityUrl` — config | `validUrl(…, null)` — `https:` enforced, no host allowlist | none | `<a href>` + `rel="noopener noreferrer"` | **None.** Currently empty; the element is removed. |

### 12.4 `postMessage` — the only listener

```js
function onFrameMessage(event) {                       // submit.js:333
  if (formOrigin && event.origin === formOrigin) settleFormLoaded("handshake");
}
```

Origin is validated by **exact string equality** against `new URL(url).origin`.
`event.data` is **never read** — the message's arrival is the entire signal. Even
a forged message from the correct origin can only mark a form as successfully
loaded. Correctly bounded; a good example of using `postMessage` as a liveness
signal without trusting its payload. Removed on settle and on both timeout paths
(`:329`, `:348`, `:359`) — no listener leak.

### 12.5 Storage inventory

| Mechanism | Key | Contents | Lifetime | Disclosed? |
| --- | --- | --- | --- | --- |
| `sessionStorage` | `sv_track_link` | the URL the visitor pasted | tab close | **Yes** — `/privacy/` names it explicitly |
| `localStorage` | — | none | — | — |
| Cookies | — | none | — | — |
| In-memory | `window.svEvents` | event names and non-PII props | page unload | **Yes** — `/privacy/` names it |

Every `sessionStorage` call is wrapped in `try/catch` for private-mode failure
(`:145-149`, `:163-165`, `:249-251`). No email, name, or phone number is ever
stored. Confirmed by `analytics.js:44-49`: only event names and
`{lane, source, field, index}` props are recorded — never field values.

### 12.6 Other checks

- **Prototype pollution:** none. No deep merge, no `Object.assign` from external
  data, no dynamic key assignment from user input. `booking.js:78` uses
  `Object.prototype.hasOwnProperty.call` rather than `raw in CALENDARS`,
  correctly resisting `?type=constructor` and `?type=__proto__` (tested, §20).
- **DOM clobbering:** no `document.<name>` or `window.<name>` lookups that a
  named element could shadow. All access is `getElementById` / `querySelector`.
- **Duplicate element IDs:** none across all 34 files. (The two
  `data-testid="embed-iframe"` attributes in `index.html` are Spotify's own
  test hook, not `id`.)
- **Unsafe JSON parsing:** no `JSON.parse` on external data anywhere.
- **Null guards:** present at every DOM lookup. No unguarded dereference found.
- **Duplicate script loading:** all three injectors check
  `document.querySelector('script[src="…"]')` before appending
  (`forms.js:62`, `submit.js:363`, `booking.js:82`), and each render path is
  idempotent — `formRendered` (`submit.js:187`), `rendered` (`booking.js:67`),
  `data-ghl-form-rendered` (`forms.js:125`).
- **Console output:** one call, `console.error(err)` at `site.js:35`, on
  fragment-fetch failure. Logs a fetch error, never user data.

---

## 13. External-resource review

| Host | Type | Purpose | Executable? | Version-pinned | SRI possible | `referrerpolicy` | Sandbox appropriate | `allow` excessive | Required for a primary journey | Fallback exists |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `api.leadconnectorhq.com` | iframe | 5 booking calendars, 3 forms — 8 frame surfaces (5 in markup, 3 JS-built) | No — cross-origin frame | N/A | N/A | 2 of 8 before fix → **8 of 8 after** | **No** — would break GHL | No `allow` set | **Yes** — booking, submission | Yes, static panel on every page |
| `api.leadconnectorhq.com` | **script** | `form_embed.js` on 2 pages | **Yes — first-party** | **No** | **No** (see M-01) | N/A | N/A | N/A | Yes — resize handshake | Frame renders, may clip |
| `link.msgsndr.com` | **script** | `form_embed.js` on 6 pages | **Yes — first-party** | **No** | **No** (see M-01) | N/A | N/A | N/A | Yes | As above |
| `open.spotify.com` | iframe | 5 artist/playlist embeds | No | N/A | N/A | 1 of 5 → **5 of 5** | **No** — breaks playback | `fullscreen` — vendor default | No — enhancement | Yes, direct link |
| `www.youtube.com` | iframe | 5 video embeds (4 unique videos) | No | N/A | N/A | 2 of 5 → **5 of 5** | **No** — breaks playback | `accelerometer; gyroscope` — I-05 | No — enhancement | Yes, surrounding copy |
| `store.aguocha.com` | link | external store | No | N/A | N/A | N/A | N/A | N/A | No | Yes, phone/text panel |
| `chatbotfarm.ai` | link | footer attribution | No | N/A | N/A | N/A | N/A | N/A | No | N/A |

**Fonts, CSS, images: zero external hosts.** All styling is
`assets/tailwind.css` + inline `<style>`; all images are first-party `img/`.
There is **no** analytics, tag manager, ad network, A/B tool, session recorder,
chat widget, or consent-management vendor anywhere on the site.

**No mixed content.** Zero `http://` resource URLs; `check-links.mjs:61-64`
fails the build on any.

**On sandboxing.** Deliberately not added to any iframe. GoHighLevel calendars
require scripts, forms, same-origin, popups, and top-navigation on submit;
Spotify and YouTube require scripts, same-origin, and presentation. A `sandbox`
attribute permissive enough to keep all three working
(`allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation`)
grants back essentially everything the attribute exists to remove, while adding
a real risk of breaking three revenue-relevant journeys. The brief's instruction
not to add sandbox attributes that would break these vendors is the right call
and is followed.

---

## 14. Security-header feasibility on GitHub Pages

GitHub Pages serves static files and **provides no mechanism to set custom
response headers**. There is no `_headers` file, no `netlify.toml` equivalent,
and no configuration surface. This governs everything below.

| Header | Current | Settable in this repo? | Meta equivalent? | Would it break embeds? | Assessment |
| --- | --- | --- | --- | --- | --- |
| `Content-Security-Policy` | Absent | Partly — `<meta http-equiv>` | Yes, with limits | Only if misconfigured | **Now feasible** for most directives. See draft below. Deferred — I-01. |
| `frame-ancestors` | Absent | **No** | **No — ignored in meta by spec** | N/A | **L-03.** Needs a proxy. |
| `X-Frame-Options` | Absent | **No** | **No — meta not honoured** | N/A | Needs a proxy. |
| `Referrer-Policy` | Absent | Partly — `<meta name="referrer">` | Yes | No | Per-iframe `referrerpolicy` chosen instead — L-02. |
| `Permissions-Policy` | Absent | **No** | **No** | Would restrict embeds | Per-iframe `allow` is the only lever — I-05. |
| `Strict-Transport-Security` | **Set by GitHub** when "Enforce HTTPS" is on | No | **No** | N/A | Operator: confirm Enforce HTTPS is enabled (§16). |
| `X-Content-Type-Options` | **`nosniff`, set by GitHub Pages** | No | No | N/A | Already correct. |
| `Cross-Origin-Opener-Policy` | Absent | No | No | `same-origin` would break GHL popups | Needs a proxy; test carefully. |
| `Cross-Origin-Resource-Policy` | Absent | No | No | No | Needs a proxy. Low value here. |
| `Cross-Origin-Embedder-Policy` | Absent | No | No | **Would break all embeds** | **Do not pursue.** |

### What a meta CSP could and could not do

A meta CSP is **not** equivalent to the header. It cannot express
`frame-ancestors`, `report-uri`/`report-to`, or `sandbox`; it applies only from
its position in `<head>` onward; and it cannot be report-only. Claiming
otherwise would misstate the protection gained.

Removing the Tailwind Play CDN made the rest achievable. A policy that matches
the site as built today:

```
default-src 'self';
script-src  'self' https://link.msgsndr.com https://api.leadconnectorhq.com;
style-src   'self' 'unsafe-inline';
img-src     'self' data:;
frame-src   https://api.leadconnectorhq.com https://open.spotify.com https://www.youtube.com;
connect-src 'self';
base-uri    'self';
form-action 'none';
object-src  'none'
```

Honest limitations of that policy:

1. **`style-src 'unsafe-inline'` is unavoidable** — 17 pages carry an inline
   `<style>` block and ~40 elements carry `style` attributes. Removing them is a
   large refactor with real visual-regression risk.
2. **The 16 redirect stubs carry inline `<script>`** and would each need
   `'unsafe-inline'` or a per-file hash. A hash is workable (the scripts are
   static and one line) but means 16 distinct policies.
3. **It does not mitigate M-01.** `script-src` must allowlist both GHL hosts for
   the site to function, so a compromised `form_embed.js` remains fully
   permitted. CSP narrows *other* injection, not this.
4. **`form-action 'none'`** is safe only because no first-party `<form>` element
   exists — all forms are inside cross-origin frames, which CSP does not reach.
5. **No reporting.** Without `report-to`, a mistake surfaces as a silently broken
   page rather than a report.

**Recommendation.** Treat CSP as a separate, approved project, in this order:
(a) proxy through Cloudflare so real headers become available; (b) deploy
`Content-Security-Policy-Report-Only` with the policy above; (c) collect reports
across all 34 routes and all five booking journeys; (d) enforce; (e) only then
add `frame-ancestors 'self'` to close L-03. Attempting (e) or a strict
`style-src` without (a) will break the site.

---

## 15. GoHighLevel form and calendar review

**No form was submitted. No booking was made. No GoHighLevel setting was viewed
or changed.** All findings below are from repository inspection only.

### Inventory — IDs unchanged by this branch

| Asset | ID | Route | Delivery | Script host |
| --- | --- | --- | --- | --- |
| Private / Corporate calendar | `gVxSS7k0YEJNYBFPQILA` | `/booking/private-corporate/` | in-markup | `link.msgsndr.com` |
| Festival / Tour calendar | `X56pKuTIpw1vu5xdOVpX` | `/booking/festivals-tours/` | in-markup | `link.msgsndr.com` |
| Residency calendar | `6tuaToT0K8aZFMLYJ2VU` | `/booking/residencies/` | in-markup | `api.leadconnectorhq.com` |
| Brand calendar | `Fwzuvt3S944xnibxng7O` | `/booking/brand-collaborations/` | in-markup | `api.leadconnectorhq.com` |
| Collaboration calendar | `4Zwyq5uTC8G7JdZW4ltW` | `/collaborate/` | in-markup | `link.msgsndr.com` |
| Submit Music form | `hNlynM8h8zLs9jkDlTVW` | `/submit-music/` | JS (`submit.js`) | `link.msgsndr.com` |
| Tour Updates form | `VH5umJecHaUdTesROA21` | `/tour/` | JS (`forms.js`) | `link.msgsndr.com` |
| Media Request form | `jqVlv3qxUCz06vUEHVMk` | `/media/` | JS (`forms.js`) | `link.msgsndr.com` |

All 4 booking calendars are additionally routed by `assets/booking.js` from
`/booking/?type=`, reusing the identical IDs and iframe element IDs.

### Verification checklist

| Check | Result |
| --- | --- |
| Form IDs unchanged | ✅ all 3 byte-identical before and after |
| Calendar IDs unchanged | ✅ all 5 byte-identical before and after |
| HTTPS only | ✅ every GHL URL is `https:`; enforced in code by 3 validators |
| No private API credentials | ✅ none in tree or history (§11) |
| No local field duplication | ✅ no first-party `<form>`, `<input name>`, or field mirror exists |
| No sensitive form values stored locally | ✅ only the pasted track link; no name, email, or phone |
| No user data logged to console | ✅ one `console.error` on fetch failure only |
| No user data in URLs unnecessarily | ⚠️ the pasted track link is forwarded as `?track_link=` to prefill — necessary, encoded, and disclosed in `/privacy/` |
| Form loads once | ✅ `formRendered` / `data-ghl-form-rendered` guards |
| Calendar loads once | ✅ `rendered` guard; only one calendar is ever requested |
| Static fallback exists | ✅ on all 8 surfaces |
| No blank-page failure mode | ✅ verified — see below |
| Privacy / terms links present | ✅ in the global footer on every page |
| Accessible iframe titles | ✅ **15 of 15** — the prior review's L-03 is closed |
| No test submission required | ✅ none performed |

### Failure-mode analysis

This is the strongest part of the codebase and deserves to be recorded. The
Submit Music form does **not** treat the iframe `load` event as success, because
`load` also fires for the browser's error page — and, as the comment at
`submit.js:305-309` documents from measurement, fires *faster* when the form is
broken (229 ms failing vs 687 ms working). Success is instead keyed on GHL's own
`postMessage` resize handshake from the correct origin. A form that never
handshakes reveals a static failure panel offering a retry and the Submission
Terms — and deliberately **not** a phone or SMS route, because a track sent by
message would bypass the rights-confirmation checkbox, the only control in the
flow carrying legal weight. That is a genuinely well-reasoned security decision.

With JavaScript disabled, `<noscript>` rules reveal the failure panel
(`submit-music/index.html:72-76`), hide dead loading lines, and on `/booking/`
swap the calendar panel for direct category links (`booking/index.html:39-43`).
No surface fails blank.

---

## 16. Repository and GitHub security

### Verified from the working tree

| Control | State |
| --- | --- |
| `.gitignore` | **Present and correct.** Covers `node_modules/`, `.claude/`, `.env`, `.env.*`, `*.local`, `*.log`, OS and editor temporaries. Prior I-01 closed. |
| `.github/` | **Absent** — no workflows, no CodeQL, no Dependabot, no issue/PR templates |
| CI | **None.** `npm run check` never runs automatically |
| Dependencies | One devDependency (`tailwindcss ^3.4.17`), build-time only, never shipped |
| `package-lock.json` | Present and committed |
| Deployment | Direct from `main` — no gate (I-09) |
| Secrets in history | None (§11) |
| Release artifacts | None |

### Not verifiable from the working tree

Branch protection, required reviews, required status checks, force-push
restrictions, secret-scanning and push-protection enablement, Actions
permissions, contributor access, and Pages configuration are all server-side
settings. **The GitHub CLI is not installed on this machine and was not
installed**, per the brief. These were not inspected and are not asserted either
way.

### Recommended settings — for operator action, NOT changed here

1. **Branch protection on `main`:** require a pull request; require 1 approval;
   dismiss stale approvals on new commits; block force-pushes; block deletion.
2. **Required status check:** `npm run check` (see the workflow below) as a
   required check before merge.
3. **Secret scanning + push protection:** enable both. Free for public
   repositories and would have made §11 an automated guarantee rather than a
   point-in-time result.
4. **Dependabot:** enable security updates for `tailwindcss`. Low value (build
   only) but free.
5. **CodeQL:** enable the default JavaScript setup. Low yield on 8 dependency-free
   files, but it catches regressions in the sinks §12 confirms are currently
   absent.
6. **Actions permissions:** if any workflow is ever added, set the default
   `GITHUB_TOKEN` permission to read-only, grant `contents: write` only where
   required, and pin every third-party action to a full commit SHA rather than a
   tag.
7. **Confirm "Enforce HTTPS" is enabled** in Pages settings — this is what emits
   HSTS (§14).
8. **Review contributor access** against least privilege.

Suggested minimal workflow, to be added only with operator approval:

```yaml
name: check
on: [push, pull_request]
permissions:
  contents: read
jobs:
  links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<full-40-char-sha>   # v4
      - uses: actions/setup-node@<full-40-char-sha> # v4
        with: { node-version: '20' }
      - run: npm run check
```

---

## 17. Privacy and data-minimisation review

**No legal conclusion is offered. Nothing below is legal advice. Every item
marked ⚠️ requires operator or counsel approval.**

| Disclosure | `/privacy/` | `/submission-terms/` | Assessment |
| --- | --- | --- | --- |
| GoHighLevel processing | ✅ named explicitly as processor for calendars and the submission form | ✅ | Accurate |
| Contact information collected | ✅ "name, email address, phone number, and a link to your track" | ✅ | Accurate |
| Marketing vs transactional | ⚠️ not separated | ⚠️ | **Unresolved.** Prior M-06. GHL-side. |
| External embeds | ✅ all three providers listed | — | Accurate |
| Spotify / YouTube data loading | ✅ "When one of those frames loads … that provider receives your request" | — | Accurate, and correctly covers the homepage embeds that now load without a click |
| Cookies / third-party tracking | ✅ "does not run analytics, advertising trackers, or marketing pixels, and it does not set cookies of its own" | — | **Verified true.** Zero trackers found. |
| `sessionStorage` use | ✅ named, with its purpose and lifetime | — | Unusually good; exceeds common practice |
| In-memory event layer | ✅ named, with "Neither is sent anywhere" | — | Accurate |
| GitHub Pages request logging | ✅ named | — | Accurate |
| Retention / deletion period | ❌ **absent** | ❌ | ⚠️ **I-08** — counsel |
| Rights-request route | ⚠️ phone/SMS only, no email | — | ⚠️ **I-08** — operator |
| Creator ownership | ✅ | ✅ | Accurate |
| DJ-set and playlist permissions | ✅ | ✅ | Accurate |

**Data minimisation is genuinely good.** The site collects nothing itself. The
one value it holds client-side — the pasted track link — is held in
`sessionStorage` for a single purpose (prefill), cleared on tab close, disclosed
by name, and never sent anywhere by first-party code. The event layer records
event names and non-PII props only, never field values.

**One conflict worth flagging for counsel, not resolved here:** `/privacy/`
directs rights requests to a phone number, while `/submit-music/`'s failure
panel deliberately refuses to accept submissions by phone or SMS. Both positions
are individually defensible; a visitor may find the combination confusing. Not a
security defect and not rewritten.

---

## 18. External operator checklist

These are **outside this repository** and cannot be verified or changed from it.
Each requires action in the GoHighLevel dashboard or by the operator.

### GoHighLevel — consent and compliance

1. ⚠️ **Replace unfilled placeholders in the live SMS consent text.**
   `README.md:98-108` records that `[BUSINESS NAME]` and
   `[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]` are shown to real submitters. Carried
   forward from prior M-06 and still recorded as open. **Highest-priority
   operator item.** Counsel review recommended.
2. ⚠️ **Relabel the rights-confirmation checkbox.** Recorded as reading
   "Option 1" rather than stating the representation being made. It is the only
   control in the submission flow carrying legal weight.
3. ⚠️ **Separate marketing consent from the transactional submission.** The
   monthly playlist email is currently described as a consequence of submitting,
   with no separate opt-in. Counsel review.
4. **Confirm SMS consent meets carrier/CTIA requirements** for the number in use.
5. **Confirm the post-submit redirect** still points at
   `https://aguocha.com/thank-you/` (recorded as operator-confirmed 2026-07-31).

### GoHighLevel — operations

6. **Enable anti-spam / CAPTCHA** on all three forms. No first-party rate
   limiting is possible on a static site; this is the only available control.
7. **Verify form notifications route to a monitored destination** for all 3 forms
   and all 5 calendars.
8. **Set and document a retention policy**, then state the period in `/privacy/`
   (closes I-08).
9. **Review staff access for least privilege** — restrict who can read submitter
   PII, edit forms, and change workflows.
10. **Confirm contact permissions** are recorded per-contact in a form that can
    be evidenced later.
11. **Confirm the 6 approved field keys** on the Submit Music form
    (`docs/GHL_SUBMIT_MUSIC_FORM_REBUILD.md`). Renaming any key silently breaks
    the `?track_link=` prefill.

### Repository / hosting operator

12. Apply the GitHub settings in §16 — branch protection and push protection
    first.
13. Confirm "Enforce HTTPS" is on in Pages settings (emits HSTS).
14. **Consider a dedicated security contact email**, then update `SECURITY.md`
    and `.well-known/security.txt`. Both currently point at the public phone
    number because no email address exists anywhere on the site; an email is
    materially better for vulnerability reports.
15. Supply a real `favicon.ico` (I-04) and, optionally, a curator portrait
    (`/img/…`, leading slash required — see `suno-vibez-config.js:113-118`).
16. Decide on the CSP project in §14.
17. Confirm with GoHighLevel whether both booking calendars work from a single
    `form_embed.js` host (L-04).

---

## 19. Remediation plan

### Implemented in this branch

Three fixes meet every criterion in the brief's remediation authority: verified
by evidence, repository-fixable, low regression risk, no GHL/DNS/hosting/legal
change, no route removed, no dependency added, testable locally.

| ID | Fix | Files | Regression risk |
| --- | --- | --- | --- |
| L-01 | Reject `..` in `validPhotoPath()` | `assets/submit.js` | None — the only production value is unaffected |
| L-02 | Add `referrerpolicy="strict-origin-when-cross-origin"` to 12 iframes and to the `/booking/?type=` router | 6 HTML files, `assets/booking.js` | None — value already proven on 5 frames in this repo |
| I-02 | Add `SECURITY.md` and `.well-known/security.txt` | 2 new files | None — documentation only |
| — | Add `scripts/check-embeds.mjs`; wire into `npm run check` | 2 files | None — test only, no shipped asset |

### Deliberately not implemented

| ID | Why not |
| --- | --- |
| M-01 | No repository fix exists. SRI unworkable; removal breaks 8 surfaces. Needs CSP at a proxy. |
| L-03 | `frame-ancestors` cannot be set from a static repository. Needs a proxy. |
| L-04 | Changing a working GHL embed URL needs vendor confirmation; regression risk to 2 booking journeys outweighs the benefit. |
| I-01 | CSP rollout explicitly requires separate approval. Draft policy provided (§14). |
| I-03, I-09 | Modifying GitHub settings or adding a deploying workflow requires operator approval. |
| I-04 | Requires a binary asset, not a code change. |
| I-05 | Trimming a vendor's published `allow` list on reasoning rather than evidence would be a speculative change. |
| I-06 | Cosmetic; `?si=` tokens are public and carry no security impact. |
| I-07 | Fixing needs a build step to inline fragments into 34 files — outside the granted authority. |
| I-08 | Legal text. Counsel and operator only. |

### Recommended sequence

1. **Now:** merge this branch after review; apply GitHub branch protection and
   push protection (§16).
2. **Next:** operator items 1–3 in §18 — the consent-text placeholders are the
   most consequential open issue on the site and are not fixable from here.
3. **Then:** enable GHL anti-spam; set and publish a retention period; add a
   security email.
4. **Separate project:** Cloudflare proxy → report-only CSP → enforce →
   `frame-ancestors` (§14). This closes M-01's mitigation gap and L-03 together.

---

## 20. Tests performed

All tests were non-destructive and local. **No form was submitted, no booking was
made, no request was sent to any production or third-party host.**

| Test | Method | Result |
| --- | --- | --- |
| Link check (baseline) | `npm run check` at `3fb7455` | **34 files, 0 errors, 0 warnings** |
| Secret scan — working tree | pattern grep, 17 classes | 0 |
| Secret scan — all refs | `git grep` over `$(git rev-list --all)` | 0 |
| Secret scan — every object | 499 objects `cat-file`'d, 17 pattern classes | **0** |
| Deleted-file review | 3 deleted files recovered and read in full | 0 |
| Dangerous-sink grep | `eval`, `Function`, `document.write`, `outerHTML`, `insertAdjacentHTML`, `srcdoc`, string timers, inline `on*` | **0** (1 justified `innerHTML`) |
| Duplicate element IDs | per-file `id="…"` uniqueness, all 34 files | 0 |
| JSON-LD parse | all 6 blocks `JSON.parse`'d | **6/6 valid** |
| Mixed content | `http://` resource URLs | 0 |
| `target="_blank"` safety | all anchors, static and JS-built | **all carry `rel="noopener noreferrer"`** |
| Iframe attribute audit | all 15 iframes: `title`, `referrerpolicy`, `allow`, `sandbox`, `loading` | 15/15 titled; 3/15 → **15/15** `referrerpolicy`; JS embedders 2/3 → **3/3** |
| Regression-test negative testing | reverted each fix in turn and re-ran `check-embeds.mjs` | **3/3 reproduced the expected failure** — the test is not vacuous |
| External-host inventory | all `https?://` refs in HTML/JS/CSS/XML | 4 third-party origins; 0 external CSS/font |
| **URL-parameter fuzzing** | 58 assertions against the shipped validators, copied verbatim | **57 pass, 1 fail → L-01** |
| JS-disabled review | `<noscript>` rules + static `<main>` content, all pages | No blank surface; navigation lost (I-07) |
| Script-blocking review | failure paths in `submit.js`, `forms.js`, `booking.js` | All three degrade to a static fallback |
| Dependency scan | `package.json` / `package-lock.json` | 1 devDependency, build-time only |

### URL-parameter fuzzing detail

Validators were copied verbatim from `assets/submit.js`, `assets/forms.js`,
`assets/thank-you.js`, and `assets/booking.js` so production logic was exercised.

- **`safeTrackName` — 12 payloads, all correctly rejected:** `<script>`,
  `<img onerror>`, `javascript:`, `"><svg/onload=`, phone-number lures,
  `www.evil.com`, `https://evil.com`, `evil.com/login`, a right-to-left override,
  `{{constructor.constructor(…)()}}`, and `${…}`. Legitimate titles including
  `Ayé (Remix)` and `Don't Stop — Extended` survive unchanged.
- **`requestedType` — 8 hostile keys rejected**, including `__proto__`,
  `constructor`, `toString`, `hasOwnProperty`, `../../etc/passwd`, a null byte,
  and a case variant. Both valid keys accepted.
- **`validUrl` / `validFormUrl` — 14 bypass attempts rejected**, including the
  suffix-confusion host `open.spotify.com.evil.com`, embedded credentials,
  protocol-relative `//`, scheme downgrade, and a `/widget/booking/` URL offered
  where a form is required.
- **`validHttpsUrl` — 5 rejected**, including whitespace-padded `javascript:`.
- **`validPhotoPath` — 6 of 7 correct; `/img/../../etc/passwd` accepted → L-01.**
- **Redirect stubs — 4 open-redirect attempts, none escaped** the fixed base path.

Post-fix, all 58 assertions pass. The permanent regression test lives at
`scripts/check-embeds.mjs` and runs as part of `npm run check`.

---

## 21. Limitations

1. **No live production HTTP testing.** No request was made to `aguocha.com`, to
   GoHighLevel, to Spotify, or to YouTube. Actual response headers, TLS
   configuration, and GitHub Pages behaviour were **not** observed. §14's
   statements about which headers GitHub Pages sets are drawn from platform
   documentation, not measurement. **The operator should confirm them with
   `curl -I https://aguocha.com`.**
2. **No real-browser rendering or viewport testing.** No browser automation is
   available in this environment. Regression testing was static: markup
   inspection, the link checker, the embed checker, and reasoning about the CSS
   and JS paths. The responsive matrix (320/375/768/1024/1440) was **not**
   executed in a browser. No statement in this report should be read as
   asserting observed browser behaviour at any viewport. What supports the
   low regression-risk ratings in §19 is narrower and checkable: the fixes
   touch no layout-affecting markup — no element, class, inline style,
   dimension, embed URL, or route changes.
3. **The GoHighLevel dashboard was not accessed.** Field configuration, consent
   text, workflows, notification routing, redirect settings, and anti-spam state
   are asserted only where `README.md` or `docs/` records them. Items in §18 are
   recommendations, not verified defects.
4. **GitHub repository settings were not inspected.** The GitHub CLI is not
   installed and was not installed. Branch protection, secret scanning, and Pages
   configuration are unverified in both directions.
5. **No form or booking was submitted**, so the end-to-end submission path,
   the post-submit redirect to `/thank-you/`, and the `?track_link=` prefill were
   not confirmed working in production.
6. **`git grep` over all refs is bounded by textual patterns.** A secret with no
   recognisable structure, split across lines, or encoded could evade it. The
   499-object scan reduces but does not eliminate this. GitHub secret scanning
   with push protection (§16) is the durable control.
7. **Legal sufficiency was not assessed.** §17 and §18 flag language for counsel;
   they do not evaluate it.

---

## 22. Explicit non-findings

Recorded deliberately, so a future reviewer does not spend effort re-deriving
them or raise them as defects.

1. **`?track=` reflected into `/thank-you/` is not XSS.** Assigned with
   `textContent`, which cannot create nodes, behind a 120-char cap and a
   character allowlist that excludes `:` and `/`. 12 payloads tested (§20).
2. **The 16 redirect stubs are not open redirects.** `location.search` always
   begins `?` and `location.hash` always begins `#`, so neither can displace the
   hardcoded leading path. 4 attempts tested.
3. **The `innerHTML` in `site.js:33` is not a vulnerability.** Both call sites
   pass string literals.
4. **The `postMessage` listener is correctly bounded.** Exact origin equality;
   `event.data` never read.
5. **GHL widget IDs, Spotify IDs, YouTube IDs, and `?si=` tokens are public
   embed identifiers, not credentials.**
6. **The published phone number is not a leak.** It is deliberately public
   sitewide. Scrape/spam exposure is an accepted business decision.
7. **`assets/analytics.js` is not a tracker.** No network request, no cookie, no
   storage, no third-party script. Verified line by line.
8. **`sessionStorage` use is not undisclosed.** `/privacy/` names it, its
   purpose, and its lifetime.
9. **`textContent`-based rendering is not flagged**, and no sanitisation library
   is recommended. Adding one would be strictly worse here.
10. **`rel="noopener"` on the non-`_blank` `store.aguocha.com` links is inert,
    not wrong.** No change recommended.
11. **No iframe `sandbox` is recommended.** Reasoning in §13.
12. **`favicon.ico` being 0 bytes is not a security issue** (I-04).
13. **The absence of SRI on `form_embed.js` is reported as an accepted risk, not
    a fixable defect** (M-01). Recommending SRI on an unversioned script would
    be wrong.
14. **Homepage Spotify embeds loading without a click is not a finding.** They
    carry `loading="lazy"`, sit below the fold, and `/privacy/` accurately
    discloses that loading a frame contacts the provider.

### Prior-review findings closed by commits between `7cc37a8` and `3fb7455`

| Prior ID | Title | Closed by |
| --- | --- | --- |
| M-07 | `cdn.tailwindcss.com` unpinned runtime script on 18 pages | `8a1ffb2` — compiled, committed Tailwind; **zero external CSS/JS for styling** |
| L-03 | 7 iframes without `title` | all 15 iframes now titled |
| I-01 | No `.gitignore` | `1c9f7e0` — present and correct |
| I-04 | Internal links target `.html` while canonical uses clean routes | clean-URL migration; `check-links.mjs:149-157` now enforces it |
| M-01 (partly) | Submission form JS-dependent with no fallback | static `#form-failure` panel + `<noscript>` reveal |
| M-02 (partly) | Booking calendars clip with no fallback | static fallback panel on all 5 calendar pages |
| M-05 | Privacy/terms absent from global footer | `footer.html:39-40` |
| L-01 (prior) | `?track=` unconstrained beyond length | character allowlist added (`thank-you.js:60-70`) |

Still open from the prior review and re-confirmed here: M-03 → I-07,
M-06 → §18 items 1–3, L-07 → L-04, L-08/L-10 → I-08, I-02 → I-03, I-06/I-10 →
non-findings.

---

## 23. Files inspected

**HTML (34).** `index.html`; `404.html`; `header.html`; `footer.html`;
`booking/index.html`; `booking/private-corporate/index.html`;
`booking/festivals-tours/index.html`; `booking/residencies/index.html`;
`booking/brand-collaborations/index.html`; `collaborate/index.html`;
`media/index.html`; `music/index.html`; `privacy/index.html`;
`store/index.html`; `submission-terms/index.html`; `submit-music/index.html`;
`suno-vibez/index.html`; `thank-you/index.html`; `tour/index.html`; and the 15
legacy redirect stubs `book.html`, `brand-activations.html`, `collab.html`,
`festivals-tours.html`, `media.html`, `music.html`, `privacy.html`,
`private-corporate.html`, `residencies.html`, `store.html`,
`submission-terms.html`, `submit.html`, `suno-vibez.html`, `thank-you.html`,
`tour.html`.

**JavaScript (9).** `assets/site.js`, `assets/submit.js`, `assets/forms.js`,
`assets/booking.js`, `assets/thank-you.js`, `assets/analytics.js`,
`assets/site-config.js`, `assets/suno-vibez-config.js`,
`scripts/check-links.mjs`.

**Config and data (9).** `package.json`, `package-lock.json`,
`tailwind.config.js`, `.gitignore`, `.nojekyll`, `CNAME`, `robots.txt`,
`sitemap.xml`, `favicon.ico`.

**CSS (3).** `assets/site.css`, `assets/tailwind.css`,
`assets/tailwind-input.css`.

**Documentation (8), read for context.** `README.md`, `SECURITY-REVIEW.md`,
`REMEDIATION-PLAN.md`, `SITE-INVENTORY.md`, `STAGE-E-VALIDATION.md`,
`docs/GHL_OPERATOR_ACTIONS.md`, `docs/GHL_SUBMIT_MUSIC_FORM_REBUILD.md`,
`docs/SITE_REBUILD_AUDIT.md`.

**History.** All 499 objects reachable from any ref; 3 deleted files recovered
and read in full (`agu_ocha_index_v2.html`, `assets/home.js`,
`assets/suno-vibez.js`).

---

## 24. Commands and tools used

All read-only except the branch creation and the commits described in §19.

| Purpose | Command |
| --- | --- |
| Confirm clean tree | `git status --porcelain` |
| Confirm parity with origin | `git fetch origin`; `git rev-parse main origin/main` |
| Record baseline SHA | `git rev-parse HEAD` → `3fb7455…` |
| Feature branch | `git checkout -b security/hardening-review` |
| File tree | `git ls-files` |
| Link check | `npm run check` (`node scripts/check-links.mjs`) |
| Dangerous-sink audit | `grep -rnE "innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write\|eval\(\|new Function\|srcdoc"` |
| Inline handlers | `grep -rnE "\son(click\|load\|error\|…)="` |
| External-host inventory | `grep -rhoE "https?://[a-zA-Z0-9._-]+" \| sort \| uniq -c \| sort -rn` |
| Iframe / anchor / script inventory | custom Node script (attribute-level extraction across all 34 files) |
| Duplicate IDs | per-file `grep -oE '(^\|\s)id="[^"]+"' \| sort \| uniq -d` |
| JSON-LD validation | `node -e` — `JSON.parse` over all 6 blocks |
| Secret scan, all refs | `git grep -InE "<11 provider patterns>" $(git rev-list --all)` |
| Secret scan, every object | `git rev-list --objects --all` → `git cat-file -p` → 17 pattern classes |
| Deleted-file review | `git log --all --diff-filter=D --name-only`; `git show <sha>^:<path>` |
| URL-parameter fuzzing | custom Node harness, 58 assertions against verbatim-copied validators |
| Regression test added | `node scripts/check-embeds.mjs` |

**Tools deliberately not used.** The GitHub CLI (`gh`) is not installed on this
machine and **was not installed** — per the brief. No scanner was run against any
third-party host. No browser automation was available. No production HTTP
request was made.
