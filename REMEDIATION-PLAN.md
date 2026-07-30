# Bounded UX, Conversion and Remediation Plan — aguocha.com

Stage 3. Planning only. No production file was modified.

- Repository: `chatbotfarm/agu-ocha`
- Branch: `feature/submit-music`
- Production baseline: `7cc37a85ea9b6f971d793d19a24e69f0677d11d4`
- Site inventory: `a45dab57ade4238d587775cfd61e8cd2fe2ff574` → `SITE-INVENTORY.md`
- Security review: `ef0255ec0ea7acdea42449faa1485181314122b0` → `SECURITY-REVIEW.md`
- Date: 2026-07-29

This document translates the verified inventory and the verified security findings
into a staged, file-by-file implementation plan. It authorises nothing. Every stage
below has an explicit stop gate requiring operator approval.

---

## 1. Executive recommendation

**Recommended scope: Option 2 — controlled submission-layer refactor.** Preserve
every route, every GoHighLevel identifier, the domain, the deployment, and the
visual identity. Change one structural thing: separate the *permanent* Submit Music
page shell from the *campaign* content that currently describes Suno Vibez.

Five gated stages, in this order:

| Stage | Scope | Files | Gate |
| --- | --- | --- | --- |
| **A** | Repository hygiene + verified low-risk defects | 20 | Operator approval |
| **B** | Calendar resilience (wrappers only) | 5 | Operator approval + A merged |
| **C** | Submit Music consolidation | 8 | Operator decisions 1–11 answered |
| **D** | Assets and SEO | 13 | Operator supplies approved assets |
| **E** | Tailwind modernization | 18+ | Separate project; explicit approval |

**Permanent Submit Music route: `/submit`, served by `submit.html`. Unchanged.**
The evidence for keeping it is in `SECURITY-REVIEW.md` §8.3: it is already
canonical (`submit.html:12`), already sitemapped (`sitemap.xml:12`), and already the
target of all seven internal links. Nothing supports moving it, and moving it would
invalidate the two backward-compatible stubs that exist precisely to point at it.

**Page identity becomes "Submit Music". Suno Vibez becomes the featured campaign
inside it.** This is the one genuinely structural change, and it is justified: 62
hard-coded Suno/Vibez references across 12 files (§7) currently make the page
inseparable from one playlist, so activating a second opportunity would mean editing
copy, metadata, JSON-LD, JavaScript and configuration in parallel.

**Tailwind: defer to a separate modernization phase (§14).** It is Medium finding
M-07, it blocks nothing in the funnel, and folding an 18-page CSS migration into a
conversion project would make the diff unreviewable.

**What this plan deliberately does not do:** it does not redesign the site, does not
touch a single GHL widget identifier, does not add a build step, a framework, a
dependency, or an analytics destination, does not delete or rename any page, and
does not rewrite legal text. Consent and legal language is flagged for counsel, not
drafted.

The most important single change in the whole plan is **M-01**: `submit.html:344`
ships an empty `<div>`, so the submission form exists only if
`assets/submit.js` runs. §9 specifies a static-first fix that keeps working when
JavaScript is disabled *and* when `submit.js` itself fails — two distinct failure
modes that a `<noscript>` block alone does not cover.

---

## 2. Why a destructive rebuild is not recommended

The brief requires that a full rebuild be recommended only if evidence shows the
existing architecture cannot safely support the objective. The evidence shows the
opposite.

### 2.1 The existing code is verified sound where it matters

From `SECURITY-REVIEW.md` §10 and §19, all independently verified:

- Every external URL reaching an iframe `src` passes an `https:` + exact-hostname
  allowlist check (`assets/submit.js:25-37`, `assets/thank-you.js:16-28`).
- The user's pasted link reaches GoHighLevel through `URLSearchParams.set()`
  (`assets/submit.js:256`) — correctly encoded, on an already-origin-validated URL.
  It cannot change the frame's origin or inject a scheme.
- There is exactly **one** `innerHTML` in the codebase (`assets/site.js:31`) and its
  input is a hardcoded same-origin path.
- The one dynamically injected script uses a **hardcoded constant**
  (`assets/submit.js:20`), not a config value.
- No `eval`, `Function()`, `document.write`, `insertAdjacentHTML`, `outerHTML`,
  `srcdoc`, cookie, `localStorage`, `postMessage` listener, or inline handler exists
  anywhere.
- The GHL form is loaded exactly once, guarded at three separate points.
- Both redirect stubs are correctly built: no loop, `noindex, follow`, canonical to
  `/submit`, manual fallback link.
- `privacy.html` is **already accurate about the code** — its description of session
  storage and in-memory event recording matches `assets/submit.js:105` and
  `assets/analytics.js` exactly. That synchronisation is uncommon and valuable.

A rebuild would discard all of it and re-earn the same verification from scratch.

### 2.2 Working infrastructure a rebuild would put at risk

- **Six GoHighLevel integration contracts.** Five calendar IDs and one form ID, plus
  the `form_embed.js` resize handshake, which `assets/submit.js:275-294` documents as
  silently version-sensitive: forms want `id="inline-<formId>"` plus a specific
  `data-*` set, booking widgets want `<calendarId>_<timestamp>`, and getting it
  wrong produces a frame that simply never resizes with no error.
- **The field-key contract.** `track_link`, `creator_name`, `email`, `genre`,
  `submission_notes`, `rights_confirmed`, and `prefillParam`
  (`assets/suno-vibez-config.js:59`) are wired to GHL workflows. `README.md:108`
  records that renaming any of them breaks downstream automation.
- **Coherent canonicalisation.** `/submit` canonical, sitemap, and two legacy stubs
  already agree. A rebuild re-opens a solved problem.
- **`404.html`'s `<base href="/">`** (`:8`), which exists for a specific
  GitHub Pages reason documented at `:4-7` and is accounted for by
  `scripts/check-links.mjs:50-52`.

### 2.3 Proportionality

There are **zero Critical and zero High findings**. All seven Medium findings are
addressable with surgical edits to at most 16 files, and none requires new
architecture:

| Finding | Nature | Requires rebuild? |
| --- | --- | --- |
| M-01 form is JS-only | Add static markup | No |
| M-02 calendar clipping | Add `min-height` + heading | No |
| M-03 nav/footer JS-injected | Add static fallback | No |
| M-04 thank-you unreachable | GHL setting | No |
| M-05 legal links missing | Edit one fragment | No |
| M-06 consent bundling | GHL + counsel | No |
| M-07 Tailwind CDN | Separate phase | No |

### 2.4 Option comparison

| | **Option 1 — Patch only** | **Option 2 — Submission-layer refactor** | **Option 3 — Clean-slate rebuild** |
| --- | --- | --- | --- |
| Fixes the 7 Medium findings | Yes | Yes | Yes, eventually |
| Achieves "Submit Music" identity | **No** | Yes | Yes |
| Supports a second playlist | **No** — 62 refs remain coupled | Yes, via config | Yes |
| Preserves GHL contracts | Yes | Yes | **At risk** |
| Preserves verified-safe code | Yes | Yes | **Discarded** |
| Regression surface | ~16 files | ~18 files | **All 20 HTML + 5 JS** |
| Re-verification needed | Low | Moderate, bounded | **Full re-review** |
| Meets the business objective | **No** | Yes | Yes |
| Justified by evidence | Insufficient | **Yes** | **No** |

**Option 1 is rejected** because it leaves the stated business objective unmet: the
permanent identity stays "Suno Vibez" and the campaign coupling stays in place, so
the next playlist costs the same effort again.

**Option 3 is rejected** because no evidence supports it. The architecture is not
the problem; the campaign coupling is, and that is a separation-of-concerns problem
solvable in place. A rebuild would also violate the explicit instruction that this
plan must not authorise a general redesign.

**Option 2 is selected.** It preserves everything verified as working, addresses
every verified finding, and achieves the business objective. Its remaining
limitations are stated in §23: the GHL form interior is still opaque, `thank-you.html`
still depends on an operator setting, and multi-campaign support will be *possible*
but untested until a second campaign actually exists.

### 2.5 Explicitly excluded from Option 2

Visual redesign; new page templates; typography or colour changes; navigation
information-architecture beyond the label and grouping changes in §5; replacing
Tailwind; any build tooling; any framework; any new third-party service; any
analytics destination; rewriting `privacy.html` or `submission-terms.html` legal
text; changing any GHL identifier.

---

## 3. Scope boundaries

### 3.1 Must be preserved (non-negotiable)

| Item | Evidence |
| --- | --- |
| 5 GHL calendar IDs, exactly as written | `SECURITY-REVIEW.md` §9.1 |
| 1 GHL form ID `hNlynM8h8zLs9jkDlTVW` | `assets/suno-vibez-config.js:51` |
| `form_embed.js` behaviour and the `data-*` resize contract | `assets/submit.js:275-294` |
| GHL field keys and `prefillParam` | `assets/suno-vibez-config.js:22-24`, `:59` |
| All existing routes, including `/suno-vibez.html` and `/suno-vibez/` | `SECURITY-REVIEW.md` §13.2 |
| `CNAME` = `aguocha.com`; GitHub Pages deployment | `CNAME`, `.nojekyll` |
| Visual identity: `--jet`, `--ink`, `--leopard`, `--steel`, `--brand:#D41414` | e.g. `index.html:17` |
| Contact paths `tel:` / `sms:+17622486242` | `header.html:75-76` |
| External destinations `store.`, `tour.`, `app.aguocha.com` | `header.html:66`, `tour.html:43`, `media.html:62` |
| The non-affiliation disclosure regarding Suno | `footer.html:66-70`, `submission-terms.html:50-56` |

### 3.2 In scope for change (subject to per-stage gates)

Static markup around existing embeds; iframe accessibility attributes; footer legal
links; the Submit Music page shell and its campaign separation; the configuration
file's internal structure; form fallback behaviour; `?track=` input constraint;
`.gitignore`; metadata corrections; asset references.

### 3.3 Out of scope for every stage in this plan

Deleting, renaming, or adding any page or route; changing any GHL identifier or GHL
dashboard setting from the repository side; DNS; Pages settings; adding CI; adding
dependencies; replacing Tailwind (§14 defers it to its own project); drafting legal
language.

---

## 4. Current page-purpose map

Classification per the brief. **No page is proposed for deletion.** Absence from
navigation is recorded as a fact, never used as grounds for removal.

| Page | Classification | Current purpose | Primary CTA | Journey | Purpose unchanged? | Action |
| --- | --- | --- | --- | --- | --- | --- |
| `index.html` | Primary navigation | Homepage; identity + routing | `Book` → `book.html` (`:45`) | 1, 2, 3 | Yes | **Minor UX correction** — see 4.1 |
| `music.html` | Primary navigation | Catalog / listening | **None** — no button in `<main>` | 2 | Yes | **Minor UX correction** — 4.2 |
| `book.html` | Primary navigation | Hub for 4 booking types | `Start Booking` → `private-corporate.html` (`:60`) | 3 | Yes | **Minor UX correction** — 4.3 |
| `private-corporate.html` | Supporting | Booking calendar | GHL calendar `gVxSS7k0YEJNYBFPQILA` | 3 | Yes | **Stage B wrapper** |
| `festivals-tours.html` | Supporting | Booking calendar | GHL calendar `X56pKuTIpw1vu5xdOVpX` | 3 | Yes | **Stage B wrapper** |
| `residencies.html` | Supporting | Booking calendar | GHL calendar `6tuaToT0K8aZFMLYJ2VU` | 3 | Yes | **Stage B wrapper** |
| `brand-activations.html` | Supporting | Booking calendar | GHL calendar `Fwzuvt3S944xnibxng7O` | 3 | Yes | **Stage B wrapper** |
| `collab.html` | Supporting | Collaboration pitch + meeting calendar | GHL calendar `4Zwyq5uTC8G7JdZW4ltW` | 3, partly 4 | Yes | **Stage B (reference pattern)** — 4.4 |
| `media.html` | Primary navigation | Press facts + media request | `Media Request Form` → `app.aguocha.com` (`:62`) | 1 | Yes | Minor: iframe/asset only |
| `tour.html` | Campaign landing / external wrapper | Tour-update signup | `Sign Up` → `tour.aguocha.com` (`:43`) | 1 | Yes | **Demote from primary nav, keep page** — §5 |
| `store.html` | External destination wrapper | Interstitial to commerce | `Go to store.aguocha.com` (`:43`) | 1 | Yes | **Operator decision** — 4.5 |
| `submit.html` | Campaign landing → **becomes Primary navigation** | Playlist submission funnel | `Submit your track` → `#submit-form` | 4 | **No — identity changes** | **Stage C** |
| `thank-you.html` | Utility | Post-submission confirmation | `Follow the playlist` | 4 | Yes | **Stage C + GHL setting (M-04)** |
| `privacy.html` | Legal | Privacy notice | `Submit Song` (`:118`) | All | Yes | **Stage A footer link; Stage C field-list correction** |
| `submission-terms.html` | Legal | Song submission terms | `Submit Song` (`:142`) | 4 | Yes | **Stage A footer link** |
| `404.html` | Utility | Pages 404 handler | `Call` (`:68`) | — | Yes | Label only |
| `suno-vibez.html` | Redirect | Legacy route → `submit.html` | Manual link (`:29`) | 4 | Yes | **Preserve unchanged** |
| `suno-vibez/index.html` | Redirect | Legacy route → `../submit.html` | Manual link (`:29`) | 4 | Yes | **Preserve unchanged** |
| `header.html` | Shared fragment | Primary navigation | `Submit Song` (`:71-74`) | All | Yes | **Stage A + C** |
| `footer.html` | Shared fragment | Footer nav, contact, legal notices | `Submit Song` (`:53`) | All | Yes | **Stage A (M-05) + C** |

### 4.1 `index.html` — journey mismatch

`index.html:59` heads a section **"Upcoming Shows."** whose only CTA at `:61` is
`Open Booking Calendar` → `book.html`. A visitor reading "Upcoming Shows" is
looking for a performance to attend (Journey 1). `book.html` is for hiring the DJ
(Journey 3). The intervening copy at `:60` does reframe it as booking, but the
heading sets the wrong expectation, and `tour.html` — the page that actually serves
that intent — is not linked from the homepage at all.

The homepage also has no route to Submit Music (Journey 4) outside the injected
header. **Requires copy approval** (operator decision 17).

### 4.2 `music.html` — no call to action

Verified: `<main>` contains no `.btn` or `.btn-primary` element. The page ends after
three iframes. A visitor completing Journey 2 has no offered next step — neither
Book nor Submit Music. Adding one CTA is the single highest-value conversion change
outside the submission funnel. **Requires copy approval.**

### 4.3 `book.html` — asymmetric CTA weighting and no `<h1>`

Four booking cards, but only the first (`:60-61`) uses `btn-primary`; the other
three (`:77`, `:94`, `:111`) use the secondary `btn`. That visually privileges
Private & Corporate for no stated reason. The page also has no `<h1>` — its first
heading is the `<h2>` at `:50`. **Requires copy approval** for the CTA weighting;
the `<h1>` is Stage A.

### 4.4 `collab.html` — overlaps Journey 4, and is the best existing pattern

Two observations. First, `collab.html:52` reads "If you have a track that deserves a
spot on *myplaylist*, let's talk" — a literal unreplaced placeholder in visible
copy, and it offers playlist placement through a scheduled meeting, which overlaps
Submit Music's form-based path. Whether these should be distinct journeys is
**operator decision 18**.

Second, and usefully: `collab.html:88-111` is **the best existing calendar wrapper
in the repository** and is designated the reference pattern for Stage B (§10).

### 4.5 `store.html` — potentially redundant, but not proposed for deletion

All three "Store" nav entries link directly to `https://store.aguocha.com`
(`header.html:66`, `:108`, `footer.html:32`), bypassing `store.html`, which is
nonetheless submitted for indexing at `sitemap.xml:15`. It is therefore an orphaned
indexable page. **No deletion proposed.** Operator decision 19: link it from
navigation, or leave it as a standalone landing target and remove it from the
sitemap. Either is defensible; doing neither leaves a page indexed that nothing
links to.

---

## 5. Recommended primary navigation

### 5.1 Current state

Desktop (`header.html:27-77`): Music · Book ▾ (Private & Corporate, Festivals &
Tours, Residencies, Brand Activations) · Collab · Media · Tour · Store — plus three
buttons: **Submit Song**, Call, Text. Logo → `index.html` (`:21`).

That is **seven top-level targets plus three buttons = ten decisions** in the
header, on a nav that collapses at 1024px because it already does not fit
(`README.md:52`).

### 5.2 Proposed state

**Home** (logo, unchanged) · **Music** · **Book ▾** (Private & Corporate ·
Festivals & Tours · Residencies · Brand Activations · **Collaborations**) ·
**Submit Music** · **Media** · **Store** — plus Call, Text.

Five top-level targets plus two contact buttons. Submit Music retains its
`btn-primary` treatment as the site's featured conversion action.

### 5.3 Change table

| # | Existing label | Proposed label | Existing destination | Proposed destination | Conversion rationale | Risk to existing users | Operator approval |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N1 | `Submit Song` (`header.html:74`) | **`Submit Music`** | `submit.html` | `submit.html` (unchanged) | Required by the business objective: the permanent identity is Submit Music. "Song" and "Music" also appear inconsistently today — `header.html:72` says "Submit Song to a Playlist", `:74` says "Submit Song", `footer.html:48` says "Submit Song to a Playlist" | **Low.** Destination unchanged; a label change cannot break a bookmark | **Yes** |
| N2 | `Collab` (`header.html:63`) | **`Collaborations`**, moved into the Book dropdown | `collab.html` | `collab.html` (unchanged) | It is a GHL booking calendar with the same mechanic as the other four. Grouping it removes a top-level item and makes Book the single answer to "how do I engage him professionally" | **Low.** One extra click for a low-traffic page; destination and URL unchanged | **Yes** |
| N3 | `Tour` (`header.html:65`) | **Removed from primary nav** | `tour.html` | `tour.html` retained; linked from `index.html`'s Upcoming Shows section and from `media.html` | `tour.html` lists **no dates** — it is a single external signup link (`:43`). It does not earn a top-level slot, and surfacing it from the homepage section that already promises "Upcoming Shows" (4.1) puts it where the intent actually is | **Low–moderate.** Anyone habituated to the Tour nav item loses it. Mitigation: the page is not deleted, stays in the sitemap, and gains a homepage entry point | **Yes** |
| N4 | `Store` (`header.html:66`) | `Store` — unchanged | `https://store.aguocha.com` | Unchanged | External commerce is a real journey; leave it alone | None | No |
| N5 | Book dropdown trigger (`header.html:33`) | Unchanged label; add the 5th item | `book.html` | `book.html` | The trigger is already a real link to the hub, which is correct — a dropdown whose parent is not clickable is a known usability failure | None | No |
| N6 | Mobile nav (`header.html:92-117`) | Mirror all of the above | — | — | Desktop and mobile must not diverge; they are currently in sync and should stay so | None | **Yes** |
| N7 | Footer nav (`footer.html:16-35`) | Mirror; **add Privacy and Submission Terms** | — | `privacy.html`, `submission-terms.html` | Addresses **M-05**. Footer is the conventional home for policy links and the fragment covers all 18 pages in one edit | None — additive | **Yes** |

### 5.4 Determinations requested

- **Should Tour remain primary navigation?** **No.** Recommend demoting it to a
  campaign page reachable from the homepage and Media. It has no dates and one
  external CTA. Operator decision 15.
- **Should Collaboration remain primary navigation?** **No.** Recommend moving it
  under Book. It is mechanically identical to the four booking calendars. Operator
  decision 16.
- Neither page is deleted, renamed, or removed from `sitemap.xml`.

---

## 6. Submit Music target architecture

Target content structure for `submit.html`, in order, with each block marked
**PERMANENT** (survives a campaign change) or **CAMPAIGN** (sourced from
configuration).

| # | Section | Type | Content source | Notes |
| --- | --- | --- | --- | --- |
| 1 | **Page identity: Submit Music** | PERMANENT | Static markup | `<h1>` becomes the page identity. `<title>` becomes `Submit Music — Agu Ocha`, with the campaign name as a secondary phrase |
| 2 | **Current opportunity: Suno Vibez** | CAMPAIGN | `campaign.displayName`, `campaign.status`, `campaign.submissionPeriod` | Rendered as a badge/eyebrow + subheading. Today this is the `<h1>` at `submit.html:118`; it becomes a subordinate element |
| 3 | **Short value proposition** | Split | Permanent sentence + `campaign.description` | Permanent: what Submit Music is and that every submission gets a real answer. Campaign: what *this* playlist is |
| 4 | **Who should submit** | CAMPAIGN | `campaign.eligibility[]` | Today the Lane A / Lane B blocks (`submit.html:292-311`) — entirely Suno-specific |
| 5 | **What to prepare** | PERMANENT | Static markup | One link, name, email, genre. Generic across any campaign. New section — does not exist today |
| 6 | **How review works** | Split | Permanent 5-step flow + `campaign.responseSlaDays` | The 5-step "How it works" at `submit.html:207-248` is already campaign-neutral except the monthly cadence |
| 7 | **Existing GHL form** | CAMPAIGN | `campaign.ghlFormUrl`, `ghlFormTitle`, `ghlFormMinHeight`, `prefillParam` | **Static-first** per §9. Form ID unchanged |
| 8 | **Placement and ownership disclosure** | PERMANENT | Static markup | "We don't guarantee placement", "you keep ownership" — already at `submit.html:346-354`; must remain adjacent to the form |
| 9 | **FAQ** | Split | Permanent Q&A + `campaign.faq[]` | Of 15 current questions, 5 are Suno-specific (§7.2). Permanent ones stay in markup |
| 10 | **Future opportunities** | PERMANENT shell | `campaigns` where `status !== "active"` | **Renders nothing while only one campaign exists.** Must not invent placeholder campaigns — operator decision 12 |
| 11 | **Privacy and submission terms** | PERMANENT | Static markup | Already present at `submit.html:350-354`. Keep adjacent to the form |
| — | **Non-affiliation disclosure** | CAMPAIGN | `campaign.disclaimer` | Currently sitewide in `footer.html:66-70`. See §11.4 — legal, counsel required |

### 6.1 Structural consequence

The current page leads with the campaign (`submit.html:116-124`: eyebrow "Suno
Vibez", `<h1>` "Made with Suno. Judged on the music.", then the description). The
target inverts the top two levels: **Submit Music** is the page, **Suno Vibez** is
what is open right now. Everything below section 4 is largely reorganisation of
existing copy, not new writing — which keeps Stage C's copy-approval surface small.

---

## 7. Separation of permanent Submit Music content from Suno Vibez campaign content

The previous session enumerated **62 hard-coded Suno or Vibez references across 12
files**. Each is classified below.

### 7.0 How to read this classification

Two of the required categories are not mutually exclusive in practice: a string can
**stay Suno-worded** *and* **relocate into configuration**. The category answers
*what happens to the wording*; the Mechanism column answers *where the wording
lives*. Assignment rule applied consistently:

- If the value varies per campaign and is short enough to be a config field →
  **Move into campaign configuration**.
- If it stays Suno-worded but is structured prose that belongs in campaign-section
  markup → **Keep campaign-specific**.

Stating this explicitly rather than forcing a false partition.

### 7.1 Reference count by file

| File | Refs | Lines |
| --- | --- | --- |
| `submit.html` | 24 | 10, 11, 15, 116, 118, 121, 138, 281, 294, 296, 299, 306, 308, 342, 371, 374, 376, 391, 436, 479, 480, 483, 492, 498 |
| `assets/submit.js` | 9 | 2, 4, 5, 15, 19, 59, 73, 77, 176 |
| `assets/suno-vibez-config.js` | 9 | 2, 39, 46, 52, 64, 65, 83, 103, 106 |
| `assets/thank-you.js` | 5 | 2, 8, 13, 14, 110 |
| `thank-you.html` | 4 | 6, 7, 11, 103 |
| `suno-vibez/index.html` | 3 | 6, 7, 26 |
| `footer.html` | 2 | 67, 68 |
| `suno-vibez.html` | 2 | 6, 26 |
| `assets/analytics.js` | 1 | 2 |
| `assets/site.js` | 1 | 21 |
| `sitemap.xml` | 1 | 2 |
| `submission-terms.html` | 1 | 53 |
| **Total** | **62** | **12 files** |

### 7.2 Keep campaign-specific — 14 references

Structured prose describing the active opportunity. Stays Suno-worded; moves into a
clearly delimited campaign section of `submit.html` so a future campaign swap
replaces one contiguous block.

| File : line | Content | Mechanism |
| --- | --- | --- |
| `submit.html:281` | "We don't require a paid Suno plan to submit." | Move into the campaign "What we don't do" item |
| `submit.html:294` | Lane A heading — "a Suno link (open to everyone)" | Campaign eligibility block |
| `submit.html:296` | "Any track hosted on Suno, any subscription tier" | Campaign eligibility block |
| `submit.html:299` | "Selected tracks join the Suno Vibez playlist on Suno" | Campaign eligibility block |
| `submit.html:306` | Suno Pro/Premier commercial-rights explanation | Campaign eligibility block |
| `submit.html:308` | "Selected tracks join the Suno Vibez playlist on Spotify" | Campaign eligibility block |
| `submit.html:371` | FAQ 2 — "Suno Vibez exists because AI tracks get rejected" | Campaign FAQ |
| `submit.html:374` | FAQ 3 question — "Do I need a paid Suno plan?" | Campaign FAQ |
| `submit.html:376` | FAQ 3 answer — Suno tier / commercial rights | Campaign FAQ |
| `submit.html:391` | FAQ 6 — "Unreleased Suno tracks are welcome" | Campaign FAQ |
| `submit.html:436` | FAQ 15 — "A Suno creator…" | Campaign FAQ. **Also L-09**: points at a section removed at runtime |
| `submission-terms.html:53` | Non-affiliation clause in the terms | **Legal — counsel required.** Keep. See §11.4 |
| `assets/suno-vibez-config.js:64` | `lanes.a.label: "Suno playlist"` | Becomes `campaign.lanes[].label` |
| `assets/suno-vibez-config.js:65` | Comment — "Lane A accepts any Suno link" | Comment; update alongside |

`submit.html:479`, `:480`, `:483`, `:492` are the JSON-LD mirrors of FAQs 2, 3, 6
and 15 and follow their visible counterparts exactly — counted in §7.6 as the
duplication hazard they are.

### 7.3 Convert to permanent Submit Music language — 8 references

These define the page, not the campaign.

| File : line | Current | Becomes | Notes |
| --- | --- | --- | --- |
| `submit.html:10` | `<title>Submit a track to Suno Vibez — a free monthly playlist…` | `Submit Music — Agu Ocha`, campaign name appended from config | Also clears the **PROVISIONAL** marker at `:6-9`. Copy approval |
| `submit.html:11` | meta description, entirely Suno-worded | Permanent lead sentence + `campaign.metaDescription` | Copy approval |
| `submit.html:15` | `og:title` "Suno Vibez — made with Suno…" | Permanent + campaign suffix | Copy approval |
| `submit.html:118` | `<h1>` "Made with Suno. Judged on the music." | `<h1>Submit Music`; the tagline becomes the campaign subheading | **The single most important conversion change in Stage C.** Copy approval |
| `submit.html:121` | "Suno Vibez is a monthly playlist built entirely from creator submissions." | `campaign.description` | Copy approval |
| `thank-you.html:6` | `<title>Submission received | Suno Vibez` | `Submission received | Submit Music`, campaign from config | Copy approval |
| `thank-you.html:11` | `og:title` — same | Same treatment | Copy approval |
| `submit.html:342` | Comment referencing `SUNO_VIBEZ_CONFIG.ghlFormUrl` | Update to the new config path | Comment only, zero risk |

**Additional label set not captured by the 62.** The grep matched `suno|vibez`, so
it did **not** surface the strings that must change for the identity rename because
they say "Submit Song" rather than "Suno". These must also be converted:

`header.html:72`, `:73`, `:74`, `:109`; `footer.html:33`, `:48`, `:53`;
`404.html:62`; `privacy.html:118`; `submission-terms.html:142`. Ten strings,
inconsistent today between "Submit Song" and "Submit Song to a Playlist". All
become **Submit Music**. Copy approval; destinations unchanged.

### 7.4 Move into campaign configuration — 11 references

Values that vary per campaign and are short enough to be config fields.

| File : line | Current | Config field |
| --- | --- | --- |
| `submit.html:138` | placeholder "Paste your Suno or Spotify link" | `campaign.linkPlaceholder` |
| `assets/submit.js:19` | `PLAYLIST_HOSTS = ["open.spotify.com","suno.com","www.suno.com"]` | `campaign.playlistHosts[]` — **see §7.4.1, security-critical** |
| `assets/submit.js:59` | lane detection on `suno.com` / `suno.ai` | `campaign.lanes[].matchHosts[]` — **see §7.4.1** |
| `assets/submit.js:73` | `LANE_COPY.a` — "…Suno submission for the Suno playlist" | `campaign.lanes[].helperCopy` |
| `assets/submit.js:77` | `LANE_COPY.unknown` — "We accept Suno and streaming links" | `campaign.lanes.unknownCopy` |
| `assets/submit.js:176` | injected iframe `title` "Suno Vibez playlist" | `campaign.playlistEmbedTitle` |
| `assets/suno-vibez-config.js:52` | `ghlFormTitle: "Suno Vibez track submission form"` | `campaign.ghlFormTitle` — already config, now per-campaign |
| `assets/suno-vibez-config.js:103` | `communityLabel: "Join the Suno Vibez community"` | `campaign.communityLabel` |
| `assets/suno-vibez-config.js:106` | `shareText` — Suno-worded | `campaign.shareText` |
| `assets/thank-you.js:110` | `navigator.share({title:"Suno Vibez"})` | `campaign.displayName` |
| `thank-you.html:7` | meta description — Suno-worded | `campaign.thankYouMetaDescription` |

#### 7.4.1 A distinction that must not be lost in refactoring

`assets/submit.js` contains **two different Suno hostname lists with two different
trust roles**, and conflating them would introduce a real defect:

- **`:19` `PLAYLIST_HOSTS` is a security allowlist.** It is consumed by `validUrl()`
  (`:34`) via **exact hostname equality** and gates what may become an iframe `src`.
  When this moves to config, it must remain an **exact-match allowlist**. Converting
  it to a substring test or a regex would weaken a control that
  `SECURITY-REVIEW.md` §10.2 verified as sound. `assets/thank-you.js:14` holds the
  same list for the same purpose.
- **`:59` lane detection is cosmetic routing.** It uses `indexOf` substring
  matching and, per the comment at `:54-55`, is "never used to block submission —
  only to choose helper copy." That looseness is deliberate and correct: a regex
  that rejected a valid-but-unanticipated URL would silently destroy submissions.
  When this moves to config, the **never-blocks property must be preserved**.

Stage C acceptance criteria (§16.3) test both properties explicitly.

### 7.5 Preserve for backward compatibility — 9 references

Untouched. These exist because old URLs may be shared or indexed.

| File : line | Content | Disposition |
| --- | --- | --- |
| `suno-vibez.html:6` | `<title>Suno Vibez — submit a track` | **Unchanged** |
| `suno-vibez.html:26` | `<h1>Suno Vibez` | **Unchanged** |
| `suno-vibez/index.html:6` | `<title>` | **Unchanged** |
| `suno-vibez/index.html:7` | Historical route comment | **Unchanged** |
| `suno-vibez/index.html:26` | `<h1>` | **Unchanged** |
| `sitemap.xml:2` | Comment noting `/suno-vibez/` is excluded | **Unchanged** — still accurate |
| Both stubs `:12` | `canonical` → `https://aguocha.com/submit` | **Unchanged** — already correct |
| Both stubs `:10`, `:34` | meta refresh + `location.replace` | **Unchanged** — verified no loop |

**Rationale for touching nothing here.** These pages are `noindex, follow`, so their
titles and headings are not competing for search results, and they are the only
thing keeping previously-shared `/suno-vibez` links working. Editing them buys
nothing and risks the one behaviour they exist to provide. If a future campaign
replaces Suno Vibez, these stubs remain correct: they point at `/submit`, which will
still be the submission page.

### 7.6 Rename internally only if justified — 10 references

The brief instructs that internal renames not be recommended for cosmetic
consistency unless they materially improve multi-campaign support. Applying that
test honestly:

| Identifier | Refs | Materially improves multi-campaign support? | Recommendation |
| --- | --- | --- | --- |
| `window.SUNO_VIBEZ_CONFIG` | `config:46`, `submit.js:5`, `:15`, `thank-you.js:13` | **No.** A global with this name can hold `campaigns:{}` perfectly well. The *structure* enables multi-campaign; the *name* does not | **Defer the rename.** Restructure contents in Stage C, add a one-line comment recording the name as legacy |
| `assets/suno-vibez-config.js` (filename) | `submit.html:498`, `thank-you.html:103` | **No** | **Do not rename.** See 7.6.1 — there is a concrete regression risk |
| `svTrack`, `svEvents`, `svLane`, `svMarkFormStarted`, `svTrackFieldComplete` | `analytics.js:79-82` and call sites | **No.** The `sv` prefix is opaque, not user-visible | **No rename** |
| `sv_track_link` (sessionStorage key) | `submit.js:21` | **No**, and renaming orphans the key for returning visitors (harmless — one lost prefill) | **No rename** |
| `.sv-*` CSS classes | `submit.html:43-101` | **No.** Not user-visible | **No rename** |
| `assets/analytics.js:2`, `submit.js:2`, `:4`, `thank-you.js:2`, `:8` | Header **comments** saying "Suno Vibez" | Comments are free to correct and carry zero regression risk — this is not a rename | **Update the comment text** in Stage C |
| `assets/site.js:21` | Comment referencing `assets/suno-vibez.js`, **a file that does not exist** (deleted in `7eaa77b`) | Factual error in a comment | **Fix in Stage A** — zero risk |

#### 7.6.1 Why the config filename must not be renamed

Renaming `assets/suno-vibez-config.js` requires editing `submit.html:498` and
`thank-you.html:103`. That creates a cache-skew failure: a visitor holding a cached
copy of `submit.html` that references the old path, against a deployment where only
the new path exists, gets a 404 for the config. `assets/submit.js:15` then evaluates
`CFG = window.SUNO_VIBEZ_CONFIG || {}` → `{}`, `validUrl(undefined, …)` returns
`null` at `:243`, and `renderForm()` falls through to `fallbackPanel()` — so the
visitor sees "Submissions open shortly" instead of a working form.

The gain is cosmetic; the loss is a broken funnel for an unknown number of cached
visitors. **Do not rename.** If the operator wants the cleaner name, the safe route
is to add the new name as the primary and keep the old file as a one-line alias —
offered as an option, not recommended, because an alias is a maintenance item that
buys nothing functional.

### 7.7 Classification summary

| Category | Refs |
| --- | --- |
| Keep campaign-specific | 14 |
| Convert to permanent Submit Music language | 8 (+10 "Submit Song" labels outside the grep) |
| Move into campaign configuration | 11 |
| Preserve for backward compatibility | 9 |
| Rename internally only if justified — **all deferred or comment-only** | 10 |
| JSON-LD mirrors of campaign FAQs (`submit.html:479`, `:480`, `:483`, `:492`) | 4 |
| Structural / comment references resolved incidentally (`submit.html:498`; `thank-you.html:103`; `config:2`, `:39`, `:83`; `submit.js:15`) | 6 |
| **Total** | **62** |

### 7.8 The duplication hazard

`submit.html:364-437` (visible accordion) and `:473-495` (JSON-LD `FAQPage`) carry
the same fifteen questions, and they have **already drifted**: visible FAQ 4 at
`:381` says the acceptance rate is published "at the top of this page" where the
JSON-LD at `:481` omits that phrase. Every FAQ edit in Stage C must be made in both
places. Stage C acceptance criteria include a diff-count check on both blocks.

---

## 8. Minimal campaign configuration model

Pseudostructure only — **not production code**, no syntax to copy. Shape and field
semantics only.

### 8.1 Constraints this model satisfies

- Public GHL form IDs only. **No API key, token, or private webhook** — the file is
  served publicly, as `assets/suno-vibez-config.js:5-6` already warns.
- No database, no backend, no framework, no build step.
- No local storage of submissions.
- **No invented campaigns.** Exactly one entry exists at first: `suno-vibez`, holding
  today's values verbatim.
- Current Suno Vibez behaviour preserved byte-for-byte in output.

### 8.2 Shape

```
CONFIG
├── featuredCampaign            campaign key rendered by default
├── site                        PERMANENT — shared across campaigns
│   ├── phone / phoneDisplay        existing values, unchanged
│   ├── responseSlaDays             default; a campaign may override
│   ├── submissionsPerCreatorPerMonth
│   └── fallbackContactNote         copy for the degraded state (§9)
└── campaigns
    └── <campaignKey>           e.g. "suno-vibez"
        ├── key                     slug, must match the object key
        ├── displayName             "Suno Vibez"
        ├── status                  "active" | "closed" | "upcoming"
        ├── submissionPeriod        human-readable, e.g. "Opens the 1st monthly"
        ├── description             the value now at submit.html:121
        ├── metaTitleSuffix         appended to "Submit Music — Agu Ocha"
        ├── metaDescription         the value now at submit.html:11
        ├── ogDescription           the value now at submit.html:16
        ├── disclaimer              non-affiliation text — LEGAL, counsel (§11.4)
        ├── responseSlaDays         optional override
        ├── linkPlaceholder         the value now at submit.html:138
        ├── ghl
        │   ├── formUrl                 UNCHANGED: .../widget/form/hNlynM8h8zLs9jkDlTVW
        │   ├── formTitle               iframe title
        │   ├── formName                data-form-name
        │   ├── formMinHeight           1342 — height reservation
        │   └── prefillParam            "track_link" — MUST match the GHL field key
        ├── playlistHosts[]         SECURITY ALLOWLIST — exact hostname match only (§7.4.1)
        ├── lanes[]
        │   ├── key                     "a" | "b"
        │   ├── label                   "Suno playlist"
        │   ├── matchHosts[]            substring hints — cosmetic only, NEVER blocks (§7.4.1)
        │   ├── helperCopy              lane hint text
        │   ├── playlistUrl             validated against playlistHosts
        │   └── playlistEmbedUrl        validated against playlistHosts
        ├── lanesUnknownCopy        the value now at submit.js:77
        ├── eligibility[]           the Lane A/B bullet lists (submit.html:292-311)
        ├── faq[]                   { question, answer } — campaign-specific only
        ├── thankYou
        │   ├── heading                 campaign-aware confirmation heading
        │   ├── metaDescription
        │   ├── communityUrl            currently "" → CTA omitted
        │   └── communityLabel
        ├── share
        │   ├── url                     https://aguocha.com/submit
        │   └── text
        ├── playlistEmbedTitle
        └── metrics                 { show:false, … } — unchanged semantics
```

### 8.3 Resolution and validation rules

1. `featuredCampaign` selects the campaign. A `?campaign=<key>` override may be
   supported, but **only** if the key matches an existing entry exactly; otherwise
   silently fall back to `featuredCampaign` and never echo the supplied value (§9.6).
2. Every URL still passes the existing `validUrl()` — `https:` + exact hostname
   allowlist + no embedded credentials. **No config value may bypass it**, which
   also closes **L-02** (`assets/submit.js:421`, `:438` currently bypass it).
3. Every string reaching the DOM goes through `textContent` or `setAttribute`.
   **No config value through `innerHTML`** — the existing invariant at
   `assets/submit.js:8-11`, now actually true everywhere.
4. Missing or empty campaign fields **omit** their block rather than rendering it
   half-filled, matching the existing behaviour at `assets/submit.js:412-416`
   (curator) and `:454-458` (metrics).
5. `campaigns` with `status !== "active"` render in "Future opportunities" (§6 row
   10) **only if the operator opts in** — decision 12. With one campaign, that
   section renders nothing.

### 8.4 What stays out of config

Permanent page copy (the value proposition, "What to prepare", "How review works",
the placement/ownership disclosure, the generic FAQ) stays in `submit.html` markup.
Pushing permanent copy into config would make the page unreadable without
JavaScript — the exact failure §9 exists to prevent.

---

## 9. Form resilience plan (addresses M-01)

### 9.1 The defect

`submit.html:344` is `<div id="submission-form" class="mt-6"></div>` — empty in
served markup. The GHL iframe is constructed only inside `renderForm()`
(`assets/submit.js:238-311`). The page's only `<noscript>` (`submit.html:104`)
styles the FAQ accordion and says nothing about the form.

### 9.2 Why `<noscript>` alone is insufficient

A `<noscript>` block covers "JavaScript disabled" but **not** "`assets/submit.js`
failed" — if JS is enabled and the script 404s or throws, `<noscript>` does not
render and the mount stays empty. The brief requires both. **The iframe must be in
static markup unconditionally.**

### 9.3 Recommended design — static-first with progressive enhancement

Four layers, each degrading into the next:

| Layer | Mechanism | Survives |
| --- | --- | --- |
| 1 | GHL form iframe **in static markup** with `title`, `referrerpolicy`, and a `min-height` reservation of 1342px (the value already known at `assets/suno-vibez-config.js:55`) | JS disabled; `submit.js` failed |
| 2 | `form_embed.js` as a **static `defer` script placed after `submit.js`** in document order | `submit.js` failed — resize still works |
| 3 | `min-height` floor | `form_embed.js` failed — form is tall enough to use, just not auto-fitted |
| 4 | Static fallback text + `sms:` / `tel:` links, always in markup | The iframe itself failed to load |

**Ordering constraint — the delicate part.** The `track_link` prefill must be applied
to the iframe `src` *before* `form_embed.js` attaches. `defer` scripts execute in
document order, so placing `form_embed.js` after `assets/submit.js` in the markup
guarantees `submit.js` finishes its `src` rewrite first. If that ordering is
inverted, the prefill will intermittently fail to appear with no error — the same
class of silent failure `assets/submit.js:275-280` already warns about.

**Enhancement `submit.js` retains:** rewrite `src` to add the prefill; keep the
lazy playlist facade; keep the FAQ accordion; keep the sticky CTA; keep the
event surface. **What it no longer owns:** the existence of the form.

### 9.4 Static content that must always remain visible

Without any JavaScript, a visitor must still see: the `<h1>` Submit Music; the
campaign name and status; the value proposition; "What to prepare"; "How review
works"; the working form iframe; the placement and ownership disclosure; links to
`privacy.html` and `submission-terms.html`; and the fallback contact.

Note this interacts with **M-03**: `header.html` and `footer.html` are JS-injected,
so with JS off the page has no navigation and no footer. The privacy and terms links
at `submit.html:350-354` are in static markup and therefore survive — which is
exactly why §11.2 keeps them on the page rather than relying on the footer.

### 9.5 Fallback contact and fallback form link

**Fallback contact:** `sms:+17622486242` primary, `tel:+17622486242` secondary — the
values already at `assets/suno-vibez-config.js:109-110` and used by
`fallbackPanel()` (`assets/submit.js:212-225`). These are the **only** verified
contact routes; `SECURITY-REVIEW.md` L-08 confirms no email address exists anywhere
on the site.

**Fallback form link:** the one verified direct URL is
`https://api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW`
(`assets/suno-vibez-config.js:51`). Whether GHL serves it as a standalone page
outside an iframe is **not verified** — operator decision 6. **No URL is invented
here.** If the operator confirms it renders standalone, it becomes a "open the form
directly" fallback link; if not, the fallback stays contact-only.

### 9.6 Error, logging, retry, and exposure rules

| Concern | Rule |
| --- | --- |
| Error messages | Never show a raw error, stack trace, HTTP status, or exception text. One calm sentence plus the contact fallback, in the tone of the existing `fallbackPanel()` (`assets/submit.js:200-234`) |
| Invalid campaign key | Silently fall back to `featuredCampaign`. **Never echo the supplied key** — that would recreate the L-01 text-injection surface on a new parameter |
| Malformed `?track=` | Constrain to a conservative character set, reject anything containing a URL scheme or a long digit run, fall back to "Your track". **Fixes L-01, and must land before the GHL redirect is configured to append `?track=`** |
| Logging | `console.error` / `console.warn` only. **Do not add a network beacon.** `privacy.html:44-46` states the site sends no data; attaching any destination requires editing `privacy.html` in the same commit |
| Retry | The playlist facade may retry — it is idempotent. **The form must not JS-retry**: a partially-attached `form_embed.js` is not safely re-attachable. Offer "reload the page" instead |
| Must not be exposed | Raw query values; config object dumps; internal spec section numbers and operator TODOs currently visible in page source (`submit.html:6-9`, `:19-21`, `:336-339`, and the `spec §` references in all five JS files) — these should be trimmed or rephrased as ordinary comments in Stage C |

---

## 10. Calendar resilience plan (addresses M-02)

### 10.1 Reference pattern

**`collab.html:88-111` is the best existing pattern and is the designated
reference.** It is the only calendar page that has both a heading and explanatory
copy before the embed (`:89-94`) and a `min-height` floor (`:104`). The other four
have neither.

### 10.2 Approved wrapper pattern

Applied identically to all five pages. **The iframe `src`, the calendar ID, the
`id` attribute, and the `form_embed.js` script tag are copied through byte-for-byte.**

| Element | Specification | Addresses |
| --- | --- | --- |
| Semantic heading | One `<h1>` naming the booking type, matching the existing `<title>` | M-02, I-06 |
| Brief explanation | 1–2 sentences: what this calendar books and what happens after | M-02 |
| Responsive width | Keep each page's current container. `collab.html:101`'s full-bleed wrapper is acceptable; the other four use `max-w-7xl px-0` | — |
| Safe minimum height | `min-height` floor on the iframe. `collab.html:104` uses `850px`; confirm per calendar (decision 20). **Do not remove `scrolling="no"`** — it prevents a double scrollbar once the handshake succeeds | **M-02** |
| Loading state | A static paragraph in markup, above the calendar, that is always present: "If the calendar does not load, call or text." No JS spinner — a JS loading state cannot help when JS is the thing that failed | M-02 |
| Fallback call / text | `tel:` + `sms:+17622486242`, in static markup | M-02 |
| Privacy link | Link to `privacy.html`, plus one line naming GoHighLevel as the processor | **M-05** |
| Accessible iframe title | `title` describing the calendar | **L-03** |
| Referrer policy | `referrerpolicy="strict-origin-when-cross-origin"`, matching what `assets/submit.js:268` already does | **L-04** |
| Calendar ID | **Unchanged, exactly** | Constraint |
| `form_embed.js` | **Unchanged.** Do **not** standardise the host in Stage B — L-07 requires GHL confirmation first (decision 21) | L-07 |

### 10.3 Per-page application

| Page | Calendar ID | Has `min-height`? | Has heading? | Stage B work |
| --- | --- | --- | --- | --- |
| `private-corporate.html` | `gVxSS7k0YEJNYBFPQILA` | **No** | **No** | Full wrapper |
| `festivals-tours.html` | `X56pKuTIpw1vu5xdOVpX` | **No** | **No** | Full wrapper |
| `residencies.html` | `6tuaToT0K8aZFMLYJ2VU` | **No** | **No** | Full wrapper. Note it loads `form_embed.js` from `api.leadconnectorhq.com` (`:42`) — leave as-is |
| `brand-activations.html` | `Fwzuvt3S944xnibxng7O` | **No** | **No** | Full wrapper. Same host note (`:42`) |
| `collab.html` | `4Zwyq5uTC8G7JdZW4ltW` | **Yes** (`:104`) | Yes (`:89-94`) | Add `title`, `referrerpolicy`, privacy link, fallback contact. Promote `<h2>` (`:90`) to `<h1>`. Also flag the `myplaylist` placeholder at `:52` for copy approval |

---

## 11. Privacy and consent remediation plan

**No legal text is drafted or rewritten in this plan.** Everything below is either a
structural link change or an item routed to the operator and counsel.

### 11.1 Repository-side — footer legal links (M-05)

Add `privacy.html` and `submission-terms.html` to `footer.html:16-35`. One edit to
one shared fragment covers all 18 pages. This is the highest value-to-risk change in
the entire plan: additive, cannot break an embed, and closes the gap where five
pages collect a name, email and phone with no reachable privacy notice.

### 11.2 Repository-side — privacy links near embeds

| Location | Change | Note |
| --- | --- | --- |
| 5 calendar pages | Privacy link + one line naming GoHighLevel as processor, in static markup | Stage B, part of §10.2 |
| `submit.html` | **Already correct** — `:350-354` links `submission-terms.html` and `privacy.html` immediately below the form. Preserve this placement through Stage C | Verify, do not add |

### 11.3 Repository-side — processor and ownership clarity

| Item | Current state | Change | Approval |
| --- | --- | --- | --- |
| External processor named | `privacy.html:71-75` names GHL/LeadConnector, YouTube, Spotify — **accurate and specific** | Add the same one-line disclosure to the 5 calendar pages | Copy |
| Collected-fields list | `privacy.html:85-88` lists name, email, phone, track link. `README.md:98-108` records the live form asking for **ten** fields including first/last name and official release date | **Correct the list to match the live form** — after decision 7 confirms what the form actually collects | **Counsel** |
| Ownership / placement | `submission-terms.html:61-65`, `:92-97`; `submit.html:348`; `footer.html:55` — clear and repeated three times | **No change.** Preserve adjacency to the form through Stage C | — |
| Data retention | Not stated anywhere (L-10) | Add a retention or criteria statement | **Counsel** + decision 11 |
| Contact channel | SMS/phone only; no email anywhere (L-08) | Publish an email or GHL contact form for privacy requests | **Counsel** + decision 6 |

### 11.4 The non-affiliation disclosure — a sequencing trap

`footer.html:66-70` names "Suno Vibez" **sitewide, on all 18 pages**. Today that is
correct and legally protective. But if a second campaign ever becomes featured, a
global footer asserting facts about Suno Vibez would be wrong on every page.

Correct handling, and the order matters:

1. **Stage C: leave `footer.html:66-70` exactly as it is.** Removing or narrowing it
   while Suno Vibez is the live campaign would be a legal regression.
2. Additionally surface `campaign.disclaimer` in the campaign section of
   `submit.html`, so the disclosure sits next to the offer it describes.
3. Only when a second campaign is actually activated does the footer version become
   a candidate for change — and that is a **counsel decision at that time**, not now.

`submission-terms.html:53` carries the same clause and is **unchanged**.

### 11.5 GHL-side operator checklist

Repository changes cannot touch any of these. All require operator action inside
GoHighLevel; items 1–5 additionally warrant counsel.

| # | Item | Evidence | Approval |
| --- | --- | --- | --- |
| 1 | Replace `[BUSINESS NAME]` in the SMS consent text | `README.md:103` | **Counsel** |
| 2 | Replace `[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]` | `README.md:103` | **Counsel** |
| 3 | Rename the rights checkbox from "Option 1" to state the actual representation | `README.md:102` | **Counsel** |
| 4 | Confirm the rights checkbox is required and maps to `rights_confirmed` | `assets/suno-vibez-config.js:24` | **Counsel** |
| 5 | Separate transactional consent from marketing consent — an explicit, unchecked, declinable field | M-06; `submit.html:280`, `:426` | **Counsel** |
| 6 | Confirm the SMS consent language overall, or remove the SMS path if SMS marketing is not intended | M-06 | **Counsel** |
| 7 | **Set the post-submit redirect to `https://aguocha.com/thank-you.html`** | M-04; `assets/suno-vibez-config.js:29-31` | Operator |
| 8 | Confirm the thank-you destination resolves, and decide on `?track=` — **only after L-01 is fixed** (§9.6) | M-04, L-01 | Operator |
| 9 | Confirm form notifications route to a monitored destination | `SECURITY-REVIEW.md` §17 item 10 | Operator |
| 10 | Remove the duplicate `terms_and_conditions` field | `README.md:104` | Operator |
| 11 | Decide whether phone stays required | `README.md:99` | Operator |
| 12 | **Do not rename field keys** — `track_link`, `creator_name`, `email`, `genre`, `submission_notes`, `rights_confirmed` | `README.md:108` | Constraint |
| 13 | Confirm anti-spam on the public form — the site cannot rate-limit a third-party iframe | `SECURITY-REVIEW.md` §16 | Operator |

---

## 12. Missing asset plan

No artwork is created or selected in this plan.

| Item | Current state | Disposition | Stage | Note |
| --- | --- | --- | --- | --- |
| `img/agu-mask-portrait.jpg` | **Absent**; `og:image` on 11 pages (line 14 each) | **Change the reference** → `img/agu-logo.png`, which exists and is what the four newer pages already use | **A** | Reuses an existing asset, needs no artwork, fixes 11 broken previews immediately. The file is **not** created and **not** deleted from any reference until repointed |
| `img/agu-mask-portrait.jpg` (proper replacement) | — | **Receive a new approved asset**, optional | **D** | If the operator supplies a portrait at that exact path, the Stage A repoint can be reverted or left |
| `favicon.ico` | Present, **0 bytes**, referenced by all 18 pages | **Receive a new approved asset** | **D** | Removing the `<link rel="icon">` achieves nothing — browsers still request `/favicon.ico` implicitly and get the same empty file. Deleting the file is prohibited. The only real fix is a real icon. **Deferred** |
| `og:image` — 11 older pages | Broken | **Change the reference** (as above) | **A** | — |
| `og:image` — `submit.html:22` | `img/agu-logo.png`, exists but square, while `:23` declares `summary_large_image` | **Receive a new approved asset** — purpose-built 1200×630 | **D** | Already flagged in-file at `:19-21` |
| `og:image` — `privacy.html:15`, `submission-terms.html:15`, `thank-you.html:15` | `img/agu-logo.png`, works | **No change** | — | — |
| Apple touch icon | `img/agu-logo.png` on all pages, exists | **No change** | — | 223 KB is large for an icon but functional. Optional Stage D optimisation |
| `404.html` assets | `favicon.ico` + `img/agu-logo.png` via the fragments; `<base href="/">` correct | **No change** | — | Only page with no `og:` tags; it is `noindex`, so that is correct |
| 4 × `*-inquiry-1024-transp-web.png` | Present, referenced nowhere, ~1.9 MB | **Defer** — operator decision 14 | **D** | **No deletion proposed** |
| `img/private-corporate.png` | 2.45 MB, used at `book.html:53` with `loading="lazy"` | **Defer** — optional optimisation | **D** | Page weight only |
| `press/`, `rider/` | Present, **empty**; `README.md:125` describes assets that do not exist | **Defer** — operator decision 13 | **D** | No deletion proposed |

---

## 13. Repository hygiene plan

### 13.1 Context

There is **no `.gitignore`**. The only thing keeping `.claude/settings.local.json`
out of the repository is a *machine-local global* ignore at
`C:\Users\mintl/.config/git/ignore` (`SECURITY-REVIEW.md` §4.3, I-01). That
protection is not portable: on another machine, or for another contributor, local
agent config — and any future `.env` — would be committed and, because `.nojekyll`
is present, published.

### 13.2 Proposed `.gitignore` — necessary now

| Entry | Why now |
| --- | --- |
| `.claude/` | Currently protected only by one machine's global ignore |
| `.env` | The single highest-consequence accidental commit |
| `.env.*` | Covers `.env.local`, `.env.production` |
| `.DS_Store` | macOS; noise |
| `Thumbs.db`, `desktop.ini` | Windows; the active development platform |
| `.vscode/`, `.idea/` | Editor state |
| `*.log` | Log noise; may contain paths or diagnostics |
| `*.tmp`, `*.bak`, `*~` | Editor and tooling temporaries |

### 13.3 Necessary only if a build process is later introduced

| Entry | Trigger |
| --- | --- |
| `node_modules/` | Only once dependencies exist (Stage E) |
| `dist/`, `build/`, `.cache/` | Only once there is build output |
| `*.tsbuildinfo` | Only with TypeScript |
| `.parcel-cache/`, `.vite/` | Only with those tools |

**Do not pre-add these.** A `.gitignore` listing artefacts of tooling that does not
exist misleads readers about the project's shape. Add them in Stage E, in the same
commit that introduces the tooling. Note `package-lock.json` must **not** be
ignored when it eventually exists — it belongs in version control.

### 13.4 Out of scope

Adding `SECURITY.md` is recommended by `SECURITY-REVIEW.md` §15 but requires a
contact channel that does not yet exist (L-08). Deferred pending decision 6.

---

## 14. Tailwind decision

### 14.1 Options compared

| Criterion | **Keep the CDN temporarily** | **Replace during this project** | **Defer to a separate phase** |
| --- | --- | --- | --- |
| Scope | 0 files | **18 HTML files + new tooling** | 0 files now |
| Regression surface | None | **Every page, every breakpoint** | None now |
| Security benefit | None | Removes a third-party script executing on-origin | Same benefit, later |
| CSP benefit | None — a meaningful CSP is unachievable while the Play CDN is in use | **Unlocks a real CSP** | Unlocks it, later |
| Deployment complexity | Unchanged | Requires a build step and a regeneration discipline | Unchanged now |
| Maintenance impact | Unpinned: a future Tailwind major could change rendering with no commit | Every new utility class needs a rebuild | Unchanged now |
| Effect on the conversion objective | **None — it blocks nothing** | **Delays and obscures it**: an 18-file CSS diff would dominate review | None |
| Review quality | — | Poor: funnel changes buried in a stylesheet migration | Good: each project reviewable on its own terms |

### 14.2 Decision

**Defer replacement to a separate frontend modernization phase (Stage E).**

Reasoning against the evidence:

1. **M-07 is Medium, not High**, and explicitly so: high impact, low likelihood, and
   *no present defect*. Nothing is broken today.
2. **It blocks nothing.** No part of §6–§11 depends on how CSS is delivered.
3. **The regression surface is the whole site** — 18 pages across every breakpoint —
   against a funnel project whose surface is at most 18 files of targeted change.
   Mixing them makes both harder to verify and harder to roll back independently.
4. **The CSP benefit is real but sequenced behind it.** A CSP introduced today would
   need `script-src` for the Tailwind CDN plus both `form_embed.js` hosts plus
   `'unsafe-inline'`, and `style-src 'unsafe-inline'` is *mandatory* because the Play
   CDN injects styles at runtime. Such a policy blocks little. Self-hosting first is
   the prerequisite, not an alternative.
5. **No build tooling exists**, and adding it is explicitly prohibited in this
   project.

### 14.3 One optional hardening step, offered not recommended

Pinning the CDN to a version path (`https://cdn.tailwindcss.com/3.x.y`) addresses
the *unpinned* half of M-07 with no build step. It touches 18 files with an
identical one-line change each, so it is trivially reviewable — but it requires the
operator to select a version and visually verify all 18 pages, because the current
unversioned URL serves whatever the Play CDN's latest 3.x is. Offered as **optional
Stage A item A7**, gated on decision 22. It is not recommended as mandatory; it is a
reasonable low-cost risk reduction if the operator wants it.

---

## 15. Exact file change matrix

Risk is the risk of *making the change*, not the severity of the finding.
"Allowed" means allowed in the stage named, after that stage's gate.

| File | Current role | Proposed change | Reason | Finding | Risk | Copy approval | Legal approval | GHL confirm | Allowed in stage | Deferred |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `.gitignore` | **Absent** | Create, per §13.2 | Portable secret hygiene | I-01 | **Low** | No | No | No | **A** | Build entries → E |
| `footer.html` | Shared fragment | Add Privacy + Submission Terms links; relabel "Submit Song" → "Submit Music"; mirror nav changes | Policy links unreachable; identity rename | **M-05**, N1, N7 | **Low** | Yes | No | No | **A** (links), **C** (labels) | Disclaimer scoping → §11.4 |
| `header.html` | Shared fragment | Relabel to "Submit Music"; move Collab under Book; remove Tour from primary nav; static fallback nav | Identity; nav simplification; M-03 | N1–N3, N6, **M-03** | **Medium** — touches every page's nav | Yes | No | No | **C** | Static fallback nav → C, with the duplication trade-off in §19 |
| `submit.html` | Campaign landing → permanent Submit Music page | Static-first form iframe; identity/campaign split; campaign sections; permanent FAQ split; JSON-LD sync; trim internal spec comments | **M-01**; business objective; L-09 | **M-01**, L-09, §7 | **High** — the largest single change | **Yes** | Yes (disclosure adjacency) | **Yes** (form ID, prefill) | **C** | — |
| `assets/submit.js` | Form injection + page behaviour | Consume `campaigns`; enhance rather than create the iframe; validate curator URLs; preserve the two-list distinction | M-01; multi-campaign; L-02 | **M-01**, L-02, §7.4.1 | **High** | No | No | **Yes** | **C** | Identifier renames → deferred (§7.6) |
| `assets/suno-vibez-config.js` | Campaign configuration | Restructure to `site` + `campaigns` per §8. **Filename unchanged. Global name unchanged.** | Multi-campaign support | §7, §8 | **Medium** | Yes (campaign copy) | Yes (`disclaimer`) | **Yes** (form ID) | **C** | Filename + global rename → **deferred, see 7.6.1** |
| `assets/thank-you.js` | Confirmation behaviour | Constrain `?track=`; read campaign `thankYou.*` | **L-01**; campaign awareness | **L-01** | **Low** | No | No | Yes (redirect) | **C** | — |
| `thank-you.html` | Utility | Campaign-aware heading and metadata; "Submit Music" identity | Identity; M-04 readiness | §7.3, M-04 | **Low** | Yes | No | **Yes** | **C** | — |
| `assets/site.js` | Header/footer loader | Fix the stale comment at `:21` referencing the deleted `assets/suno-vibez.js`; support a static fallback nav | Factual error; M-03 | I-12, **M-03** | **Low** (comment) / **Medium** (fallback) | No | No | No | **A** (comment), **C** (fallback) | — |
| `assets/analytics.js` | Event surface | Update the header comment only | §7.6 | — | **Low** | No | No | No | **C** | Filename rename → deferred (I-09) |
| `suno-vibez.html` | Redirect stub | **None** | Backward compatibility | §7.5 | — | No | No | No | **None** | Permanently preserved |
| `suno-vibez/index.html` | Redirect stub | **None** | Backward compatibility | §7.5 | — | No | No | No | **None** | Permanently preserved |
| `privacy.html` | Legal | `og:image` already fine; relabel CTA; correct the collected-fields list; add retention | Identity; disclosure accuracy | §7.3, **L-10** | **Low** (label) / **Medium** (legal) | Yes | **Yes** | Yes (field list) | **C** (label), **D**/counsel (text) | Retention wording → counsel |
| `submission-terms.html` | Legal | Relabel CTA only. **Legal text unchanged**, including `:53` | Identity | §7.3 | **Low** | Yes | **Yes** if text changes | No | **C** | Counsel review → separate |
| `private-corporate.html` | Booking calendar | Stage B wrapper (§10.2). **Calendar ID unchanged** | **M-02**, M-05, L-03, L-04, I-06 | **M-02** | **Low** | Yes | No | No | **B** | Host standardisation → L-07 |
| `festivals-tours.html` | Booking calendar | Same | Same | **M-02** | **Low** | Yes | No | No | **B** | Same |
| `residencies.html` | Booking calendar | Same. Leave `form_embed.js` host as-is | Same + L-07 | **M-02**, L-07 | **Low** | Yes | No | **Yes** (host) | **B** | Host → deferred |
| `brand-activations.html` | Booking calendar | Same | Same | **M-02**, L-07 | **Low** | Yes | No | **Yes** (host) | **B** | Host → deferred |
| `collab.html` | Booking calendar (**reference pattern**) | `title`, `referrerpolicy`, privacy link, fallback contact; `<h2>`→`<h1>`; flag `myplaylist` at `:52` | L-03, L-04, M-05; placeholder copy | L-03, L-04, **M-05** | **Low** | Yes | No | No | **B** | Journey overlap → decision 18 |
| `media.html` | Primary nav | `og:image` repoint; optional Tour link | L-05; N3 | **L-05** | **Low** | Yes (link) | No | No | **A** (og), **C** (link) | `press/` → D |
| `music.html` | Primary nav | `og:image` repoint; iframe `title` + `referrerpolicy` (`:51`); add one CTA | L-05, L-03, L-04; 4.2 | **L-05**, L-03 | **Low** | Yes (CTA) | No | No | **A** (attrs), **C** (CTA) | — |
| `book.html` | Primary nav hub | `og:image` repoint; add `<h1>`; iframe `title`; CTA weighting | L-05, I-06, L-03; 4.3 | **L-05**, I-06 | **Low** | Yes | No | No | **A** (attrs), **C** (copy) | — |
| `index.html` | Homepage | `og:image` repoint; iframe `referrerpolicy`; fix the Upcoming Shows journey mismatch; add a Submit Music route | L-05, L-04; 4.1 | **L-05** | **Low** | **Yes** | No | No | **A** (attrs), **C** (copy) | — |
| `store.html`, `tour.html` | External wrappers | `og:image` repoint only | L-05 | **L-05** | **Low** | No | No | No | **A** | Nav/sitemap → decisions 15, 19 |
| `404.html` | Utility | Relabel "Submit Song to a Playlist" → "Submit Music" (`:62`) | Identity | §7.3 | **Low** | Yes | No | No | **C** | — |
| `sitemap.xml` | Deployment | **None in A–C.** Only if decision 19 removes `store.html` | — | I-07 | **Low** | No | No | No | **D** | Deferred to decision 19 |
| `robots.txt` | Deployment | **None** | Already correct | — | — | No | No | No | **None** | — |
| `favicon.ico` | Asset, **0 bytes** | Replace with an operator-supplied icon | **L-06** | **L-06** | **Low** | No | No | No | **D** | Awaiting asset |
| `img/agu-mask-portrait.jpg` | **Absent** | **No file created.** 11 references repointed to `img/agu-logo.png` in A; a real asset may be supplied in D | **L-05** | **L-05** | **Low** | No | No | No | **A** (repoint), **D** (asset) | Artwork → operator |
| `README.md` | Documentation | Correct the stale `assets/suno-vibez.js` reference (`:153`); update the structure diagram and Operator TODO to reflect Stages A–C | I-12, I-03 | — | **Low** | No | No | No | **C** | — |
| `scripts/check-links.mjs` | Validation tool | Extend to `<meta>` URLs and `assets/*.js` | I-03 | I-03 | **Low** | No | No | No | **D** | Optional |
| All 18 pages (Tailwind tag) | CDN dependency | Version-pin, **optional** | **M-07** | **M-07** | **Medium** — 18 files | No | No | No | **A7, optional** | Replacement → **E** |

---

## 16. Proposed implementation stages

Five gated stages. Each is a separate commit or short commit series. **No stage may
begin before its predecessor is merged and its own stop gate is cleared.**

### 16.1 Stage A — Repository hygiene and verified low-risk corrections

**Files allowed to change (20):** `.gitignore` (new); `footer.html` (legal links
only); `assets/site.js` (comment only); `index.html`, `music.html`, `book.html`,
`media.html`, `store.html`, `tour.html`, `collab.html`, `private-corporate.html`,
`festivals-tours.html`, `residencies.html`, `brand-activations.html` (`og:image`
repoint; iframe `title` and `referrerpolicy` where the tag already exists);
optionally the 18 Tailwind tags if A7 is approved.

**Files prohibited:** `submit.html`, `assets/submit.js`,
`assets/suno-vibez-config.js`, `assets/thank-you.js`, `thank-you.html`, both
`suno-vibez` stubs, `sitemap.xml`, `robots.txt`, any GHL identifier, any legal text.

**Required operator inputs:** approval of the footer link labels; decision 22 if A7
is included.

**Acceptance criteria**
1. `git diff` touches only the allowed files.
2. `node scripts/check-links.mjs` → 0 errors, 0 warnings.
3. Zero occurrences of `agu-mask-portrait` remain in any `.html`.
4. All 5 GHL calendar iframes and both Spotify iframes have a non-empty `title`.
5. Every calendar ID is byte-identical to the baseline (`git diff` shows no change
   inside any `src`).
6. `privacy.html` and `submission-terms.html` are reachable from the footer on every
   page.
7. If A7: all 18 pages render identically to baseline at 375 / 768 / 1024 / 1440 px.

**Tests:** run the link checker; `git diff --stat`; grep the diff for
`leadconnectorhq|msgsndr` and confirm zero changed lines; visual check of one
calendar page and the footer at two breakpoints.

**Rollback:** `git revert <sha>`. No stage-A change has a runtime dependency, so
revert is complete and immediate.

**Stop gate:** operator confirms the footer renders correctly on a live preview
before Stage B begins.

---

### 16.2 Stage B — Calendar resilience

**Files allowed (5):** `private-corporate.html`, `festivals-tours.html`,
`residencies.html`, `brand-activations.html`, `collab.html`.

**Files prohibited:** everything else. Explicitly: no calendar ID, no
`form_embed.js` `src`, no `assets/*.js`, no `submit.html`.

**Required operator inputs:** decision 20 (`min-height` per calendar); approval of
the heading and explanatory copy for five pages; approval of the processor
disclosure line.

**Acceptance criteria**
1. All five calendar IDs byte-identical to baseline.
2. All five `form_embed.js` script tags byte-identical, including the host split.
3. Each page has exactly one `<h1>`.
4. Each iframe has `title`, `referrerpolicy`, and a `min-height` floor.
5. `scrolling="no"` retained on all five.
6. With JavaScript disabled, each page still shows heading, explanation, fallback
   contact, and privacy link.
7. Simulating a `form_embed.js` failure (block the host in devtools) leaves a usable,
   scrollable-enough calendar — the M-02 regression test.
8. Link checker → 0 errors.

**Tests:** the M-02 simulation on all five pages; JS-disabled render; visual check at
375 / 768 / 1440 px; confirm no double scrollbar appears once the handshake succeeds.

**Rollback:** `git revert <sha>`. Markup-only; no shared dependency.

**Stop gate:** operator confirms all five calendars still book successfully — a real
booking flow check, not a page load — before Stage C.

---

### 16.3 Stage C — Submit Music consolidation

The largest stage. Recommend splitting into three reviewable commits: **C1**
static-first form (M-01) with no copy change; **C2** config restructure with no copy
change; **C3** identity, copy and campaign split.

**Files allowed (8):** `submit.html`, `assets/submit.js`,
`assets/suno-vibez-config.js`, `assets/thank-you.js`, `thank-you.html`,
`header.html`, `footer.html`, `assets/analytics.js` (comment) — plus label-only
edits to `404.html`, `privacy.html`, `submission-terms.html`, `index.html`,
`music.html`, `book.html`, `media.html`, and a `README.md` update.

**Files prohibited:** both `suno-vibez` stubs (§7.5); `sitemap.xml`; `robots.txt`;
the 5 calendar pages; every GHL identifier; every legal text block, including
`footer.html:66-70` and `submission-terms.html:53`.

**Required operator inputs:** decisions 1–12, 17, 18 answered; GHL redirect (§11.5
item 7) set; confirmation the form ID is unchanged.

**Acceptance criteria**
1. **M-01 closed:** with JavaScript fully disabled, `submit.html` renders a working
   GHL form iframe.
2. **M-01 closed, second mode:** with `assets/submit.js` blocked but JS enabled, the
   form still renders and is usable.
3. Prefill still works with JS enabled — a pasted link appears in the GHL form. This
   verifies the §9.3 ordering constraint.
4. The GHL form ID `hNlynM8h8zLs9jkDlTVW` and `prefillParam: "track_link"` are
   byte-identical to baseline.
5. `<h1>` is the page identity, not the campaign.
6. **`PLAYLIST_HOSTS` remains an exact-hostname allowlist.** Regression test: a
   config URL on a non-allowlisted host must be rejected, and a lookalike such as
   `open.spotify.com.evil.test` must be rejected.
7. **Lane detection still never blocks.** An unrecognised but valid URL still
   submits, showing only the nudge copy.
8. **L-02 closed:** curator `photo` and `links[].url` pass through `validUrl()`; a
   `javascript:` URL in either is rejected.
9. **L-01 closed:** `?track=` with a URL scheme or a long digit run falls back to
   "Your track" and is not rendered.
10. Visible FAQ and JSON-LD `FAQPage` contain the same question count and the same
    answer text — the I-08 drift check.
11. `/suno-vibez.html` and `/suno-vibez/` still forward to `submit.html`.
12. `privacy.html` and `submission-terms.html` links remain in **static** markup
    adjacent to the form.
13. `footer.html:66-70` and `submission-terms.html:53` unchanged.
14. Every user-visible "Submit Song" string now reads "Submit Music".
15. No `innerHTML` receives any config value; still exactly one `innerHTML` in the
    codebase.
16. Link checker → 0 errors.

**Tests:** JS-disabled render; `submit.js`-blocked render; prefill end-to-end **into
the form UI only — no submission**; the two allowlist regression cases; the
`javascript:` URL cases; `?track=` fuzzing with ~10 malformed values; both legacy
routes; FAQ/JSON-LD diff count; full-page visual check at four breakpoints.

**Rollback:** `git revert` each of C1–C3 independently, newest first. C1 is
independently revertible; C3 depends on C2, so revert C3 before C2.

**Stop gate:** operator performs **one real end-to-end submission** and confirms it
arrives in GHL and lands on `thank-you.html`. This is the only place in the plan
where a production submission is appropriate, and it is an **operator** action —
this plan performs none.

---

### 16.4 Stage D — Assets and SEO

**Files allowed (13):** `favicon.ico`; optionally `img/agu-mask-portrait.jpg` and a
new OG image; the `og:image` line in `submit.html`; `sitemap.xml` **only if**
decision 19 removes `store.html`; `scripts/check-links.mjs`; `README.md`.

**Files prohibited:** all JavaScript; `header.html`; `footer.html`; the 5 calendar
pages; both stubs; any GHL identifier.

**Required operator inputs:** approved favicon (decision 24); approved 1200×630 OG
image (decision 23); decisions 13, 14, 19.

**Acceptance criteria:** `favicon.ico` is non-zero and renders in Chrome, Firefox and
Safari; the OG image validates in a social preview debugger; sitemap remains
well-formed XML; link checker → 0 errors.

**Tests:** favicon in three browsers; OG debugger on `/submit`; XML validation.

**Rollback:** `git revert`. Asset-only.

**Stop gate:** operator confirms the preview cards render as intended.

---

### 16.5 Stage E — Tailwind modernization

**A separate project, not a stage of this one.** Requires its own explicit
authorisation and its own review.

**Files allowed:** all 18 HTML files; a new `assets/*.css`; possibly `package.json`,
a Tailwind config, a CI workflow, and `.gitignore` build entries.

**Files prohibited until authorised:** everything. This stage is not approved by
approving Stages A–D.

**Required operator inputs:** decision 25 (proceed or remain deferred); a decision on
self-hosted CSS versus a full build pipeline.

**Acceptance criteria:** all 18 pages pixel-equivalent to baseline at 375 / 768 /
1024 / 1440 px; no `cdn.tailwindcss.com` reference remains; a report-only CSP can be
authored without `style-src 'unsafe-inline'` — the actual measure of success.

**Tests:** full visual regression across 18 pages × 4 breakpoints; CSP report-only
soak.

**Rollback:** revert the branch. Because this touches every page, it must be a
single revertible unit, not a series.

**Stop gate:** explicit written authorisation before any file changes.

---

## 17. Acceptance criteria

Consolidated verification matrix. Per-stage criteria are in §16.

### 17.1 Invariants — must hold after every stage

| # | Invariant | Verification |
| --- | --- | --- |
| I1 | All 5 calendar IDs unchanged | `git diff` shows no change inside any calendar `src` |
| I2 | GHL form ID `hNlynM8h8zLs9jkDlTVW` unchanged | Grep the diff |
| I3 | GHL field keys and `prefillParam` unchanged | Grep `assets/suno-vibez-config.js` |
| I4 | `/submit`, `/submit.html`, `/suno-vibez.html`, `/suno-vibez/`, `/thank-you.html` all still resolve | Manual route check |
| I5 | Both redirect stubs still forward, with no loop | Manual |
| I6 | `CNAME`, `.nojekyll`, `robots.txt` untouched | `git diff --stat` |
| I7 | Design tokens unchanged | Grep `--brand:#D41414` in every page |
| I8 | `tel:` / `sms:+17622486242` present sitewide | Grep |
| I9 | Non-affiliation disclosure present sitewide | Grep `footer.html:66-70` |
| I10 | Exactly one `innerHTML` in the codebase, source still a hardcoded path | Grep `assets/*.js` |
| I11 | No secret, key, token, or private webhook introduced | Re-run the `SECURITY-REVIEW.md` §21 scans |
| I12 | `node scripts/check-links.mjs` → 0 errors | Command |

### 17.2 Finding closure

| Finding | Closed in | Test |
| --- | --- | --- |
| **M-01** | C1 | Form renders with JS disabled **and** with `submit.js` blocked |
| **M-02** | B | `form_embed.js` blocked → calendar still usable on all 5 pages |
| **M-03** | C (partial) | Static fallback nav present with JS disabled |
| **M-04** | GHL, verified in C | One real end-to-end submission reaches `thank-you.html` |
| **M-05** | A + B | Policy links reachable from the footer and from all 5 calendar pages |
| **M-06** | GHL + counsel | Operator checklist §11.5 items 1–6 signed off |
| **M-07** | **E** (deferred) | Out of scope for A–D |
| **L-01** | C | `?track=` fuzzing rejects scheme and digit-run payloads |
| **L-02** | C | `javascript:` in curator `photo` / `links[].url` rejected |
| **L-03** | A + B | Every iframe has a non-empty `title` |
| **L-04** | A + B | Every in-markup iframe has `referrerpolicy` |
| **L-05** | A | Zero `agu-mask-portrait` references remain |
| **L-06** | **D** | Non-zero `favicon.ico` renders |
| **L-07** | **Deferred** | Awaiting GHL confirmation, decision 21 |
| **L-08** | **Deferred** | Awaiting decision 6 |
| **L-09** | C | No page claim references a runtime-removed section |
| **L-10** | **Deferred** | Counsel, decision 11 |
| **I-01** | A | `.gitignore` present |
| **I-06** | A + B | Every full page has exactly one `<h1>` |
| **I-08** | C | FAQ and JSON-LD question counts and answers match |

---

## 18. Operator decisions required

**25 decisions.** None is made on the operator's behalf. Stage C cannot begin until
1–12, 17 and 18 are answered.

### Submit Music identity and content

1. **Final permanent Submit Music URL** — recommend `/submit` (served by
   `submit.html`), unchanged. Confirm or override.
2. **Is submission free, permanently?** `submit.html:186-190`, `:278` and `:366` all
   state it is. Confirm this is a permanent commitment or a campaign-specific one.
3. **Accepted listening platforms** — currently Suno, Spotify, Apple Music, Tidal,
   Deezer, YouTube Music (`assets/submit.js:59-66`). Confirm the permanent list
   versus the Suno Vibez list.
4. **Multiple-track policy** — currently one per creator per month
   (`assets/suno-vibez-config.js:97`, `submit.html:411`). Permanent or campaign?
5. **Unpublished-track policy** — currently accepted for Lane A
   (`submit.html:391`). Permanent or campaign?
6. **Fallback contact method** — SMS/phone only today, no email anywhere (L-08).
   Also: does `.../widget/form/hNlynM8h8zLs9jkDlTVW` render standalone outside an
   iframe? Needed for §9.5, and for `SECURITY.md`.
7. **Current Suno Vibez description and eligibility** — confirm the wording at
   `submit.html:121` and `:292-311` is current and accurate before it moves into
   config.
8. **Thank-you heading and share text** — confirm `assets/suno-vibez-config.js:106`
   and the `thank-you.html:43-45` heading.
9. **Response SLA** — 7 days is promised in six places. Confirm.
10. **Curator block** — `assets/suno-vibez-config.js:79-84` is empty, so "Who
    listens" is removed at runtime while FAQ 15 claims it exists (L-09). Populate,
    or approve softening the FAQ answer.
11. **Metrics** — `metrics.show:false` while FAQ 4 and the JSON-LD claim the
    acceptance rate is published (L-09). Populate, or approve softening. Also the
    data-retention statement (L-10) — **counsel**.
12. **Should future playlist cards be visible?** Recommend **no** while only one
    campaign exists — §8.1 forbids inventing inactive campaigns, and §8.3 rule 5
    makes the section opt-in.

### Assets and content

13. `press/` and `rider/` are empty while `README.md:125` describes assets. Supply,
    or approve leaving them empty?
14. The four unreferenced `*-inquiry-*.png` files (~1.9 MB) — obsolete or staged?
15. **Does Tour remain in primary navigation?** Recommend no (§5.3 N3).
16. **Does Collaboration remain in primary navigation?** Recommend moving it under
    Book (§5.3 N2).
17. **`index.html` Upcoming Shows** — approve resolving the journey mismatch at
    `:59-61` (4.1), and adding a homepage route to Submit Music.
18. **`collab.html` vs Submit Music** — are these distinct journeys? Also approve
    replacing the `myplaylist` placeholder at `:52`.
19. **`store.html`** — link it from navigation, or remove it from `sitemap.xml:15`?
20. **`min-height` per calendar** — `collab.html:104` uses 850px. Confirm per
    calendar, or approve 850px for all five.
21. **`form_embed.js` host** — which does GHL document as canonical (L-07)?
22. **Optional A7** — version-pin the Tailwind CDN? If yes, which version?
23. **Approved Open Graph image** — 1200×630 for `submit.html` (`:19-21`).
24. **Approved favicon** — replacing the 0-byte file (L-06).
25. **Tailwind modernization** — confirm it remains deferred to Stage E.

### GHL and legal

The 13 GHL items in §11.5 are additional operator actions; items 1–6 there require
counsel. They are not renumbered here to avoid two competing lists.

---

## 19. Explicitly deferred work

| Item | Why deferred | Revisit when |
| --- | --- | --- |
| Tailwind replacement (**M-07**) | 18-page regression surface; blocks nothing; would obscure the funnel diff | Stage E, decision 25 |
| Content-Security-Policy | Unachievable meaningfully while the Play CDN is in use | After Stage E |
| All other HTTP headers (HSTS, `X-Content-Type-Options`, `frame-ancestors`, COOP, CORP) | **GitHub Pages cannot set response headers.** No repository change can deliver them | Only if a proxy is adopted |
| Renaming `SUNO_VIBEZ_CONFIG` | Cosmetic; does not improve multi-campaign support (§7.6) | Optional tidy after C |
| Renaming `assets/suno-vibez-config.js` | Concrete cache-skew regression risk (§7.6.1) | Not recommended |
| Renaming `svTrack` / `sv_track_link` / `.sv-*` | Not user-visible; no capability gain | Not recommended |
| Renaming `assets/analytics.js` (I-09) | Ad-blocker naming hazard, but the guards already prevent breakage | Optional, before any destination is attached |
| `form_embed.js` host standardisation (**L-07**) | Requires GHL confirmation; changing a working embed carries risk | Decision 21 |
| Email contact channel (**L-08**) and `SECURITY.md` | Needs a mailbox or GHL form that does not yet exist | Decision 6 |
| Data-retention statement (**L-10**) | Counsel, and must match actual GHL retention | Decision 11 |
| CI running `check-links.mjs`; branch protection (I-02) | Prohibited in this project | Separate hosting task |
| Extending `check-links.mjs` (I-03) | Useful, not blocking | Stage D |
| Deleting or renaming any page | Prohibited, and unnecessary | Never in this plan |
| `sitemap.xml` changes | Only contingent on decision 19 | Stage D |
| Image weight optimisation | Cosmetic performance | Stage D |
| Footer disclaimer scoping (§11.4) | Would be a legal regression to change now | When a second campaign activates — counsel |

---

## 20. Risks and rollback

### 20.1 Principal risks

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | **Static-first form breaks the `form_embed.js` resize handshake.** The `data-*` contract at `assets/submit.js:281-294` is version-sensitive and fails *silently* | **Medium** | High — form renders but never resizes | Copy the `data-*` set verbatim; keep the 1342px floor so even total handshake failure leaves a usable form; test with the host blocked |
| R2 | **Prefill breaks through script-ordering error.** If `form_embed.js` executes before `submit.js` rewrites `src`, prefill fails intermittently with no error | **Medium** | Medium | §9.3 ordering constraint; C3 acceptance criterion 3 tests it explicitly |
| R3 | **Config restructure changes rendered output.** A missed field silently omits a block, per the existing omit-rather-than-shrink behaviour | Medium | Medium | Split C2 (structure, no copy change) from C3 (copy) so C2's diff should produce *zero* visual change; screenshot-compare before and after |
| R4 | **`PLAYLIST_HOSTS` weakened during the move to config** — turned into a substring or regex match | Low | **High** — weakens a verified control | §7.4.1; C acceptance criterion 6 with an explicit lookalike-hostname test |
| R5 | **Lane detection tightened into a blocker**, silently destroying valid submissions | Low | **High** | §7.4.1; C acceptance criterion 7 |
| R6 | **`header.html` change breaks navigation on all 18 pages** — it is a shared fragment | Low | High | Isolate the nav change in its own commit; test on three page types; revert is a single file |
| R7 | **Legal regression** — the footer disclaimer narrowed or a policy link lost | Low | **High** | Invariants I9 and I10; §11.4 explicitly freezes the disclaimer; legal text edits gated on counsel |
| R8 | **Calendar ID altered by copy-paste error** | Low | **High** — a booking page silently books the wrong calendar, or nothing | Invariant I1: grep every diff for `leadconnectorhq` and confirm zero changed lines inside any `src` |
| R9 | **Tailwind version pin (A7) changes rendering** | Medium if attempted | Medium | Optional and separately gated; 18 pages × 4 breakpoints verified before merge |
| R10 | **A real submission is made during testing** | Low | Low–medium — pollutes the queue | Only the operator performs the single end-to-end test, at Stage C's stop gate. Every other test stops at the form UI |

### 20.2 Rollback

Per-stage `git revert`. Properties that make this safe:

- **Stages A, B and D are markup- or asset-only** with no runtime dependency, so a
  revert is complete and immediate.
- **Stage C is split into C1–C3**, revertible newest-first. C1 (static-first form) is
  independently revertible and is the change most worth being able to undo alone.
- **Stage E must be a single revertible unit**, not a series, because it touches
  every page.
- Deployment is directly from `main` (`README.md:130`), so a revert commit is also
  the deploy. **There is no CI gate** (I-02) — the revert should therefore be
  verified on a preview or a local `python -m http.server` before it lands.

**Fastest full rollback to the verified baseline:** every change proposed here sits
on `feature/submit-music` above `7cc37a8`. Resetting the branch to that commit
returns the site to the exact state both audits describe.

### 20.3 Two risks with no repository-side mitigation

1. **The GHL form interior.** Nothing in this repository can fix the SMS consent
   placeholders, the "Option 1" checkbox, or consent bundling (M-06). If those are
   not corrected, the site will be structurally sound while the form remains
   defective.
2. **`thank-you.html` reachability.** Stage C can make the page campaign-aware and
   correct, but it stays unreachable until the operator sets the redirect (M-04).

---

## 21. Files inspected

No file was modified.

**Read in full across Stages 1–3 (26):** `404.html`, `book.html`,
`brand-activations.html`, `collab.html`, `festivals-tours.html`, `footer.html`,
`header.html`, `index.html`, `media.html`, `music.html`, `privacy.html`,
`private-corporate.html`, `residencies.html`, `store.html`,
`submission-terms.html`, `submit.html`, `suno-vibez.html`, `suno-vibez/index.html`,
`thank-you.html`, `tour.html`, `assets/analytics.js`, `assets/site.js`,
`assets/submit.js`, `assets/suno-vibez-config.js`, `assets/thank-you.js`,
`scripts/check-links.mjs`.

**Configuration and documentation (5):** `CNAME`, `robots.txt`, `sitemap.xml`,
`.nojekyll`, `README.md`.

**Prior audit records relied on as authoritative (2):** `SITE-INVENTORY.md`,
`SECURITY-REVIEW.md`.

**Re-examined in this stage:** all 12 files containing the 62 Suno/Vibez references,
for classification in §7.

**Metadata only (10):** the nine PNGs in `img/` and `favicon.ico`.

---

## 22. Commands run

Read-only. **No network request, no production endpoint contacted, no file
modified, no test data submitted.**

| Purpose | Command | Result |
| --- | --- | --- |
| Recovery check 1 — branch | `git rev-parse --abbrev-ref HEAD` | `feature/submit-music` ✔ |
| Recovery check 2 — HEAD | `git rev-parse HEAD` | `ef0255ec…` ✔ |
| Recovery check 3 — clean tree | `git status --porcelain` | empty ✔ |
| Recovery check 4 — partial document | `Test-Path REMEDIATION-PLAN.md` | **Does not exist** — nothing to recover |
| Recovery check 5 — uncommitted output | `git ls-files --others --exclude-standard` | empty ✔ |
| Recovery check 6 — website files unmodified | `git diff --stat` | empty ✔ |
| Prior-doc presence | `Test-Path SITE-INVENTORY.md`, `SECURITY-REVIEW.md` | 53,753 B and 133,082 B ✔ |
| Commit ancestry | `git log --oneline -3` | `ef0255e`, `a45dab5`, `7cc37a8` ✔ |
| Reference enumeration (previous session) | `Select-String` over all `.html`/`.js`/`.xml`/`.txt` for `suno\|vibez`, case-insensitive, excluding the two audit documents | **62 references across 12 files** — classified in §7 |
| Post-authoring verification | `git status --porcelain`; `git diff --stat` | Reported in the completion summary |

---

## 23. Limitations

1. **This is a plan, not an implementation.** No change here has been executed or
   tested. Every acceptance criterion in §16 and §17 is a *proposed* test, not a
   passing one.
2. **The GoHighLevel account interior remains invisible.** Form fields, consent
   strings, the redirect setting, workflows, notification routing, retention, and
   anti-spam are all unverified. §11.5 and decisions 6–11 depend on operator
   confirmation, and `README.md:98-108` — the basis for M-06 — may be stale.
3. **Two failure modes are reasoned, not reproduced.** M-01 and M-02 were derived
   from markup and the documented resize contract, not observed in a browser. The
   §9 and §10 designs address the reasoned failure; Stage B and C tests are
   specified precisely so they can be confirmed empirically before merge.
4. **`form_embed.js` is third-party and opaque.** R1 and R2 exist because its
   handshake is undocumented outside the comments at `assets/submit.js:275-294`. A
   static-first form is the right design, but its interaction with `form_embed.js`
   must be verified in a browser, not assumed.
5. **No legal assessment.** Consent, rights, retention, and disclosure items are
   routed to counsel. No language is drafted, and §11 must not be read as legal
   advice.
6. **Extension-less routing is still inferred**, not verified. `/submit`,
   `/thank-you` and `/suno-vibez` depend on GitHub Pages behaviour untestable from
   the working tree.
7. **Multi-campaign support will be untested until a second campaign exists.** §8's
   model is designed for it, but with exactly one campaign configured, the
   generalisation is unexercised. Recommend that the first additional campaign be
   treated as a verification exercise, not a routine content change.
8. **Effort is not estimated.** Stage sequencing reflects risk and dependency order,
   not duration.
9. **Conversion recommendations are reasoned from structure, not measured.** There is
   no analytics destination attached (`assets/analytics.js` sends nothing), so no
   funnel data exists. §4.1, 4.2 and 4.3 are judgements about journey coherence, not
   findings from data — and they are labelled as requiring copy approval for exactly
   that reason.
10. **`.gitignore` content is proposed, not created.** §13 is a specification; the
    file is a Stage A deliverable.

---

*End of Stage 3 plan. No production file was modified. No implementation was
performed. Awaiting operator approval of the stage sequence and the 25 decisions in
§18.*

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
