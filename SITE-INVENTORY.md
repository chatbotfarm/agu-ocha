# Site Inventory — aguocha.com

Read-only inventory of the repository as it stands. Nothing in this document
changes the site; no existing file was edited to produce it.

- Repository: `chatbotfarm/agu-ocha`
- Branch inspected: `feature/submit-music`, created from `main` at `7cc37a85ea9b6f971d793d19a24e69f0677d11d4`
- Working tree at start: clean (no modified, staged, or untracked files)
- Date of inventory: 2026-07-29
- Method: full file read of every HTML, JS, and configuration file in the repo,
  plus one run of the repo's own `node scripts/check-links.mjs` (read-only).

Evidence labels used throughout:

| Label | Meaning |
| --- | --- |
| **V** | Verified — read directly out of the file at the cited line |
| **I** | Inferred — a reasonable reading of the file, not stated in it |
| **U** | Unknown — cannot be determined from repository contents |
| **OC** | Requires operator confirmation |

---

## 1. Repository structure

### 1.1 Complete top-level listing (**V**)

```
.claude/                       local Claude Code settings (not a website file)
assets/                        JavaScript
img/                           images
press/                         EMPTY directory (0 entries)
rider/                         EMPTY directory (0 entries)
scripts/                       build-free tooling
suno-vibez/                    legacy redirect route
.nojekyll                      0 bytes
404.html
book.html
brand-activations.html
CNAME
collab.html
favicon.ico                    0 bytes
festivals-tours.html
footer.html
header.html
index.html
media.html
music.html
privacy.html
private-corporate.html
README.md
residencies.html
robots.txt
sitemap.xml
store.html
submission-terms.html
submit.html
suno-vibez.html
thank-you.html
tour.html
```

`press/` and `rider/` exist and are tracked as directory names but contain zero
files (**V**). `README.md:32-33` lists both in the structure diagram.

### 1.2 Complete list of HTML pages (**V**)

20 `.html` files total — 18 full documents and 2 fragments.

Full page documents (18):

| Path | Size |
| --- | --- |
| `404.html` | 3,761 B |
| `book.html` | 6,643 B |
| `brand-activations.html` | 2,561 B |
| `collab.html` | 4,600 B |
| `festivals-tours.html` | 2,479 B |
| `index.html` | 3,627 B |
| `media.html` | 3,485 B |
| `music.html` | 4,171 B |
| `privacy.html` | 6,383 B |
| `private-corporate.html` | 2,512 B |
| `residencies.html` | 2,469 B |
| `store.html` | 2,346 B |
| `submission-terms.html` | 7,564 B |
| `submit.html` | 33,331 B |
| `suno-vibez.html` | 1,527 B |
| `suno-vibez/index.html` | 1,540 B |
| `thank-you.html` | 4,873 B |
| `tour.html` | 2,422 B |

### 1.3 Shared HTML fragments (**V**)

| Path | Size | Injected into | By |
| --- | --- | --- | --- |
| `header.html` | 5,342 B | `#site-header` | `assets/site.js:109` |
| `footer.html` | 3,574 B | `#site-footer` | `assets/site.js:110` |

Both are fetched at runtime with `fetch()` and assigned via `innerHTML`
(`assets/site.js:28-31`). `header.html:1-16` documents the consequence: a
`<script>` inside an injected fragment never executes, so all nav behavior is
delegated from `assets/site.js`; a `<style>` element does apply, and the shared
header/footer focus styles live at `header.html:8-16`.

### 1.4 CSS files (**V**)

**There are no `.css` files in the repository.** All styling is either:

- Tailwind utility classes served from `https://cdn.tailwindcss.com` (18 pages), or
- a per-page inline `<style>` block that redeclares the same design tokens
  (`--jet`, `--ink`, `--leopard`, `--steel`, `--brand`) and the same
  `.btn` / `.btn-primary` / `.card` / `.section` / `.container` rules.

The token block is duplicated in every full page — e.g. `index.html:17-31`,
`music.html:17-31`, `book.html:17-34`, `submit.html:26-101`. There is no
Tailwind config file and no `tailwind.config` object declared inline in any page
(**V** — grep found none).

### 1.5 JavaScript files (**V**)

| Path | Size | Loaded by |
| --- | --- | --- |
| `assets/site.js` | 3,298 B | all 18 full pages except `suno-vibez.html` and `suno-vibez/index.html` |
| `assets/suno-vibez-config.js` | 4,874 B | `submit.html:498`, `thank-you.html:103` |
| `assets/analytics.js` | 2,914 B | `submit.html:499` |
| `assets/submit.js` | 16,622 B | `submit.html:501` |
| `assets/thank-you.js` | 4,186 B | `thank-you.html:105` |
| `scripts/check-links.mjs` | 4,266 B | not loaded by any page; CLI only |

Two inline `<script>` blocks exist in page bodies: `suno-vibez.html:34` and
`suno-vibez/index.html:34`, each a single `location.replace(...)` call. One
inline `application/ld+json` block at `submit.html:473-495`.

### 1.6 Image and media folders (**V**)

`img/` — 9 PNG files, no other media directories:

| File | Size | Referenced at |
| --- | --- | --- |
| `img/agu-logo.png` | 223,542 B | `header.html:22`, `footer.html:6`, `apple-touch-icon` on all pages, `og:image` on `privacy.html:15`, `submission-terms.html:15`, `thank-you.html:15`, `submit.html:22` |
| `img/private-corporate.png` | 2,567,324 B | `book.html:53` |
| `img/festivals-tours.png` | 727,950 B | `book.html:70` |
| `img/residencies.png` | 512,011 B | `book.html:87` |
| `img/brand-activation.png` | 642,226 B | `book.html:104` |
| `img/brand-activation-inquiry-1024-transp-web.png` | 466,413 B | **no reference found in any file** |
| `img/festival-tour-booking-inquiry-1024-transp-web.png` | 475,421 B | **no reference found in any file** |
| `img/private-corporate-event-inquiry-1024-transp-web.png` | 478,504 B | **no reference found in any file** |
| `img/venue-club-residency-inquiry-1024-transp-web.png` | 494,903 B | **no reference found in any file** |

`favicon.ico` exists at the root and is **0 bytes** (**V**), while every full
page references it via `<link rel="icon" href="favicon.ico">`.

`press/` and `rider/` are empty — no press or rider assets are present.

### 1.7 Configuration files (**V**)

| File | Present | Contents / note |
| --- | --- | --- |
| `CNAME` | yes | `aguocha.com` (single line, 11 bytes) |
| `robots.txt` | yes | `User-agent: *` / `Allow: /` / `Sitemap: https://aguocha.com/sitemap.xml` |
| `sitemap.xml` | yes | 14 `<url>` entries |
| `.nojekyll` | yes | 0 bytes |
| `README.md` | yes | 12,039 B |
| `.claude/settings.local.json` | yes | Claude Code permission allowlist; not served |
| `package.json` | **absent** | |
| `package-lock.json` | **absent** | |
| Tailwind config (`.js`/`.cjs`/`.ts`) | **absent** | |
| `.gitignore` | **absent** | |
| `_config.yml` | **absent** | |
| `LICENSE` | **absent** | |
| `CLAUDE.md` | **absent** | |
| `node_modules/` | **absent** | |

### 1.8 GitHub Pages / deployment files (**V**)

- `.nojekyll` (0 bytes) — disables Jekyll processing.
- `CNAME` — `aguocha.com`.
- `robots.txt`, `sitemap.xml`.
- **No `.github/` directory exists.** There are no GitHub Actions workflows.
- Deployment procedure is documented only as prose in `README.md:127-138`
  (`main` branch, `/root` directory, Pages settings). Whether Pages is actually
  configured that way is **U / OC** — repository settings are not visible from
  the working tree.

---

## 2. Page inventory

Nav columns below mean: does the page's own URL appear as a link target in
`header.html`'s desktop nav, `header.html`'s mobile nav, or `footer.html`.

### 2.1 Summary matrix (**V**)

| Page | In desktop nav | In mobile nav | In footer | In sitemap.xml |
| --- | --- | --- | --- | --- |
| `index.html` | logo link only (`header.html:21`) | no | no | yes (as `/`) |
| `music.html` | yes (`:28`) | yes (`:94`) | yes (`:19`) | yes |
| `book.html` | yes (`:33`) | yes (`:97`) | yes (`:21`) | yes |
| `private-corporate.html` | yes (`:48`) | yes (`:99`) | yes (`:23`) | yes |
| `festivals-tours.html` | yes (`:51`) | yes (`:100`) | yes (`:24`) | yes |
| `residencies.html` | yes (`:54`) | yes (`:101`) | yes (`:25`) | yes |
| `brand-activations.html` | yes (`:57`) | yes (`:102`) | yes (`:26`) | yes |
| `collab.html` | yes (`:63`) | yes (`:105`) | yes (`:29`) | yes |
| `media.html` | yes (`:64`) | yes (`:106`) | yes (`:30`) | yes |
| `tour.html` | yes (`:65`) | yes (`:107`) | yes (`:31`) | yes |
| `store.html` | **no** | **no** | **no** | yes |
| `submit.html` | yes (`:71`) | yes (`:109`) | yes (`:33`, `:53`) | yes (as `/submit`) |
| `privacy.html` | no | no | **no** | yes |
| `submission-terms.html` | no | no | **no** | yes |
| `thank-you.html` | no | no | no | no (noindex) |
| `404.html` | no | no | no | no (noindex) |
| `suno-vibez.html` | no | no | no | no (noindex stub) |
| `suno-vibez/index.html` | no | no | no | no (noindex stub) |

Two observations, stated factually, not as recommendations:

- The **Store** nav entries point at the external `https://store.aguocha.com`
  (`header.html:66`, `header.html:108`, `footer.html:32`), not at the local
  `store.html`. `store.html` is therefore in `sitemap.xml:15` but reachable from
  no site navigation (**V**).
- `privacy.html` and `submission-terms.html` are **not linked from
  `footer.html`** (**V**). They are reached only from body links on
  `submit.html:352-353`, `privacy.html:119`, `submission-terms.html:143`, and
  `thank-you.html:93`.

### 2.2 `index.html`

| Field | Value |
| --- | --- |
| Title | `Agu Ocha — Official Site` (`:6`) |
| Main heading | `<h1>Agu Ocha</h1>` (`:42`) |
| Secondary heading | `<h2>Upcoming Shows.</h2>` (`:59`) |
| Apparent purpose | Site homepage: identity statement + routing to Book / Music / Media (**I**) |
| Primary CTA | `Book` → `book.html`, styled `btn-primary` (`:45`) |
| Internal links | `book.html` (`:45`, `:61`), `music.html` (`:46`), `media.html` (`:47`) |
| External links | none in body |
| Scripts loaded | `https://cdn.tailwindcss.com` (`:15`); `assets/site.js` defer (`:70`) |
| Iframes | 1 — YouTube `rCBM8kuzI3U` (`:51`) |
| GHL embed | none |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — file absent from repo |

Body copy at `:60` states booking requires **1-month notice**.

### 2.3 `music.html`

| Field | Value |
| --- | --- |
| Title | `Music — Agu Ocha` (`:6`) |
| Main heading | `<h1>Music</h1>` (`:40`) |
| Sub-headings | `Listen on Spotify` (`:47`), `Official Video` (`:65`), `Live / Alternate Cut` (`:78`) |
| Apparent purpose | Catalog / listening page (**I**) |
| Primary CTA | No button CTA on the page; the Spotify artist embed is the primary action surface (**V** — no `.btn` element exists in `<main>`) |
| Internal links | none in body |
| External links | none as `<a>`; all external assets are iframes |
| Scripts loaded | Tailwind CDN (`:15`); `assets/site.js` (`:96`) |
| Iframes | 3 — Spotify artist `5ymz8gAPHU5sgDUhdhVqzh` (`:54`); YouTube `rCBM8kuzI3U` (`:69`); YouTube `1JGjYV1WcHE` (`:82`) |
| GHL embed | none |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

### 2.4 `book.html`

| Field | Value |
| --- | --- |
| Title | `Book Agu Ocha` (`:6`) |
| Main heading | **No `<h1>` exists on this page.** The first heading is `<h2>Private & Corporate</h2>` (`:50`) (**V**) |
| Sub-headings | 4 × `<h2>`: `:50`, `:67`, `:84`, `:101` |
| Apparent purpose | Hub page routing to the four booking-category pages (**I**) |
| Primary CTA | `Start Booking` → `private-corporate.html`, the only `btn-primary` of the four (`:60-61`) |
| Internal links | `private-corporate.html` (`:60`), `festivals-tours.html` (`:77`), `residencies.html` (`:94`), `brand-activations.html` (`:111`) |
| External links | none |
| Scripts loaded | Tailwind CDN (`:15`); `assets/site.js` (`:144`) |
| Iframes | 1 — YouTube `C_ynqwU8_74` (`:130`) |
| GHL embed | none directly; all four cards link to pages that carry one |
| Images | `img/private-corporate.png` (`:53`), `img/festivals-tours.png` (`:70`), `img/residencies.png` (`:87`), `img/brand-activation.png` (`:104`) — all present |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent. Stale comment at `:127` reads `Swap VIDEO_ID_1 with your actual video id` although a real ID is already in place at `:130` |

### 2.5 `private-corporate.html`

| Field | Value |
| --- | --- |
| Title | `Private & Corporate — Book Agu Ocha` (`:6`) |
| Main heading | **No heading element of any level exists in `<main>`** (**V**) |
| Apparent purpose | Booking-calendar page for private and corporate events (**I**, from title/meta) |
| Primary CTA | The GHL booking widget itself; no `<a>` CTA in `<main>` |
| Internal links | none in body |
| External links | none as `<a>` |
| Scripts loaded | Tailwind CDN (`:15`); `https://link.msgsndr.com/js/form_embed.js` (`:42`); `assets/site.js` (`:51`) |
| Iframes | 1 — GHL booking `gVxSS7k0YEJNYBFPQILA` (`:41`) |
| GHL embed | Calendar — see §3.1 |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

The booking iframe at `:41` carries no `min-height` (unlike `collab.html:104`).

### 2.6 `festivals-tours.html`

Structurally identical to `private-corporate.html`.

| Field | Value |
| --- | --- |
| Title | `Festivals & Tours — Book Agu Ocha` (`:6`) |
| Main heading | none in `<main>` (**V**) |
| Primary CTA | GHL booking widget |
| Scripts loaded | Tailwind CDN (`:15`); `link.msgsndr.com/js/form_embed.js` (`:43`); `assets/site.js` (`:52`) |
| Iframes | 1 — GHL booking `X56pKuTIpw1vu5xdOVpX` (`:42`) |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

### 2.7 `residencies.html`

| Field | Value |
| --- | --- |
| Title | `Residencies — Book Agu Ocha` (`:6`) |
| Main heading | none in `<main>` (**V**) |
| Primary CTA | GHL booking widget |
| Scripts loaded | Tailwind CDN (`:15`); **`https://api.leadconnectorhq.com/js/form_embed.js`** (`:42`) — note the different host from `private-corporate.html` / `festivals-tours.html` / `collab.html`, which use `link.msgsndr.com` |
| Iframes | 1 — GHL booking `6tuaToT0K8aZFMLYJ2VU` (`:41`) |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

### 2.8 `brand-activations.html`

| Field | Value |
| --- | --- |
| Title | `Brand Activations — Book Agu Ocha` (`:6`) |
| Main heading | none in `<main>` (**V**) |
| Primary CTA | GHL booking widget |
| Scripts loaded | Tailwind CDN (`:15`); **`https://api.leadconnectorhq.com/js/form_embed.js`** (`:42`) |
| Iframes | 1 — GHL booking `Fwzuvt3S944xnibxng7O` (`:41`) |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

### 2.9 `collab.html`

| Field | Value |
| --- | --- |
| Title | `Collaborate with Agu Ocha` (`:6`) |
| Main heading | `<h1>Collaboration Opportunities.</h1>` (`:50`) |
| Sub-headings | `Spotify Collaboration` (`:70`), `Schedule a Virtual Meeting` (`:90`) |
| Apparent purpose | Artist/brand collaboration pitch + collab-call scheduling (**I**) |
| Primary CTA | The full-width GHL booking calendar (`:102-107`); the page has no `btn` element |
| Internal links | none in body |
| External links | none as `<a>` |
| Scripts loaded | Tailwind CDN (`:15`); `link.msgsndr.com/js/form_embed.js` (`:109`); `assets/site.js` (`:118`) |
| Iframes | 3 — YouTube `qIGUNEUQSFY` (`:61`); Spotify playlist `5UP8zLioz5jelEk4n5sFi8` (`:77`); GHL booking `4Zwyq5uTC8G7JdZW4ltW` (`:103`) |
| GHL embed | Calendar — see §3.1 |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent. Body copy at `:52` contains the literal placeholder text `<em>myplaylist</em>` |

`collab.html:77` embeds the **same Spotify playlist ID** as
`assets/suno-vibez-config.js:71-73` (`5UP8zLioz5jelEk4n5sFi8`) (**V**). Whether
one playlist is intended to serve both the collab pitch and Suno Vibez is
**OC**.

### 2.10 `media.html`

| Field | Value |
| --- | --- |
| Title | `Media — Agu Ocha` (`:6`) |
| Main heading | `<h1>Media</h1>` (`:41`) |
| Sub-heading | `Fast Facts` (`:45`) |
| Apparent purpose | Press facts and a media-request route (**I**) |
| Primary CTA | `Media Request Form` → `https://app.aguocha.com/media-request-form` (`:62`), `btn-primary`, `target="_blank" rel="noopener"` |
| Internal links | none in body |
| External links | `https://app.aguocha.com/media-request-form` (`:62`) |
| Other actions | `tel:+17622486242` (`:63`) |
| Scripts loaded | Tailwind CDN (`:15`); `assets/site.js` (`:75`) |
| Iframes | none |
| GHL embed | External GHL-domain page link only — see §3.1 |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

`README.md:125` says press assets should be uploaded to `press/` and
"uncomment the placeholder links in `media.html`". **No commented-out
placeholder links exist in `media.html`** (**V**), and `press/` is empty.

### 2.11 `tour.html`

| Field | Value |
| --- | --- |
| Title | `Tour — Agu Ocha` (`:6`) |
| Main heading | `<h1>Tour</h1>` (`:40`) |
| Apparent purpose | Tour-update signup routing (**I**) |
| Primary CTA | `Sign Up for Tour Updates` → `https://tour.aguocha.com` (`:43`), `target="_blank" rel="noopener"` |
| Internal links | none in body |
| External links | `https://tour.aguocha.com` (`:43`) |
| Scripts loaded | Tailwind CDN (`:15`); `assets/site.js` (`:55`) |
| Iframes | none |
| GHL embed | none in-page; the destination subdomain's platform is **U** |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

The page lists **no tour dates** — it is a signup redirect only (**V**).

### 2.12 `store.html`

| Field | Value |
| --- | --- |
| Title | `Store — Agu Ocha` (`:6`) |
| Main heading | `<h1>Store</h1>` (`:40`) |
| Apparent purpose | Interstitial that forwards to the external commerce domain (**I**) |
| Primary CTA | `Go to store.aguocha.com` → `https://store.aguocha.com` (`:43`) |
| Internal links | none in body |
| External links | `https://store.aguocha.com` (`:43`) — has `rel="noopener"` but no `target="_blank"` |
| Scripts loaded | Tailwind CDN (`:15`); `assets/site.js` (`:53`) |
| Iframes | none |
| GHL embed | none; commerce platform behind `store.aguocha.com` is **U** |
| Broken references | `og:image` → `img/agu-mask-portrait.jpg` (`:14`) — absent |

### 2.13 `submit.html` — the Suno Vibez landing page

| Field | Value |
| --- | --- |
| Title | `Submit a track to Suno Vibez — a free monthly playlist for music made with Suno` (`:10`) |
| Canonical | `https://aguocha.com/submit` (`:12`) |
| Main heading | `<h1>Made with Suno. Judged on the music.</h1>` (`:117-119`) |
| Section headings | `This month's playlist` (`:154`), `Why submit` (`:168`), `How it works` (`:205`), `Who listens` (`:263`), `What we don't do` (`:275`), `What we accept` (`:290`), `Submit your track` (`:335`), `Questions` (`:361`), `One track. One link. One minute.` (`:445`) |
| Apparent purpose | Playlist submission funnel: paste link → GHL form → `thank-you.html` (**V**, from `:126-149`, `:344`, and `assets/suno-vibez-config.js:29-31`) |
| Primary CTA | `Submit your track` → `#submit-form` (`:142-145`); repeated at `:195`, `:251`, `:450`, and in the sticky bar `:466` |
| Internal links | `submission-terms.html` (`:352`), `privacy.html` (`:353`), `#submit-form` (`:142`, `:195`, `:251`, `:450`, `:466`), `#faq` (`:316`) |
| External links | `data-playlist-link="b"` anchor at `:158` — `href="#"` in markup, rewritten at runtime to `https://open.spotify.com/playlist/5UP8zLioz5jelEk4n5sFi8` by `assets/submit.js:486-501`, or removed if the URL fails validation |
| Scripts loaded | Tailwind CDN (`:24`); inline JSON-LD `FAQPage` (`:473-495`); `assets/suno-vibez-config.js` (`:498`); `assets/analytics.js` (`:499`); `assets/site.js` (`:500`); `assets/submit.js` (`:501`) — all `defer`, order load-bearing |
| Iframes in markup | **none** |
| Iframes at runtime | 2, both injected: the Spotify playlist iframe into `#playlist-embed` on facade click (`assets/submit.js:173-187`), and the GHL form iframe into `#submission-form` when it comes within 400px of the viewport (`assets/submit.js:238-311`, `:317-337`) |
| GHL embed | Form `hNlynM8h8zLs9jkDlTVW`, injected — see §3.1 |
| Broken references | `og:image` → `img/agu-logo.png` (`:22`) — file exists, but it is square while `twitter:card` is `summary_large_image` (`:23`); flagged as an operator TODO in the file's own comment at `:19-21` |

Self-documented provisional content in this file (**V**):

- `:6-9` — title, meta description and heading tree are marked **PROVISIONAL**,
  written to spec intent because spec §11.3's exact wording was unavailable.
- `:336-339` — the spec line "Five fields. About a minute." is deliberately
  replaced with "Takes a minute or two." because the live GHL form asks for ten
  fields including a required phone number.
- `:266-267` — the "Who listens" block currently reads "Curator details are
  being added before launch," and `assets/submit.js:407-416` **removes the whole
  block at runtime** because `curator.name` is empty in the config.
- `:272` — `#metrics-block` is **removed at runtime** by
  `assets/submit.js:449-458` because `metrics.show` is `false`.

One internal inconsistency, stated as an observation only: FAQ answer 4
(`:381`) says "We publish our acceptance rate at the top of this page," and the
JSON-LD equivalent at `:481` says "We publish our acceptance rate." With
`metrics.show: false` (`assets/suno-vibez-config.js:88`) no acceptance rate is
rendered anywhere on the page (**V**).

### 2.14 `thank-you.html`

| Field | Value |
| --- | --- |
| Title | `Submission received | Suno Vibez` (`:6`) |
| Robots | `noindex` (`:8`) |
| Main heading | `<h1>Got it. <span id="track-name">Your track</span> is in the queue.</h1>` (`:43-45`) |
| Sub-headings | `Hear what you're submitting to` (`:59`), `Know someone else making tracks?` (`:79`) |
| Apparent purpose | Post-submission confirmation; sets a reply-by date and offers follow → community → share (**V**, `assets/thank-you.js:1-8`) |
| Primary CTA | `Follow the playlist` (`:64-67`) — `href="#"` in markup, set at runtime by `assets/thank-you.js:59-73`, or removed if no valid playlist URL |
| Internal links | `submission-terms.html` (`:93`) |
| External links | none in markup; `#follow-playlist` and `#join-community` are populated at runtime |
| Other actions | `sms:+17622486242` (`:92`) |
| Scripts loaded | Tailwind CDN (`:16`); `assets/suno-vibez-config.js` (`:103`); `assets/site.js` (`:104`); `assets/thank-you.js` (`:105`) |
| Iframes | none |
| GHL embed | none. It is the **redirect target** the GHL form must be configured to use |
| Broken references | none found |

`#join-community` (`:72`) is **removed at runtime** because `communityUrl` is
empty (`assets/suno-vibez-config.js:102`, `assets/thank-you.js:75-87`) (**V**).

Reachability: this page is in no navigation and no sitemap. It is only reachable
if the post-submit redirect is set inside GoHighLevel — which
`assets/suno-vibez-config.js:29-31` and `README.md:109` both record as **not yet
done**. **OC.**

### 2.15 `privacy.html`

| Field | Value |
| --- | --- |
| Title | `Privacy Notice | Agu Ocha` (`:6`) |
| Canonical | `https://aguocha.com/privacy.html` (`:8`) |
| Main heading | `<h1>Privacy Notice</h1>` (`:42`) |
| Sub-headings | `What this site collects directly` (`:50`), `What embedded services collect` (`:64`), `What you send us` (`:83`), `Hosting` (`:98`), `Access, correction, and deletion` (`:107`) |
| Apparent purpose | Privacy notice (**V**) |
| Primary CTA | `Submit Song` → `submit.html` (`:118`) |
| Internal links | `submission-terms.html` (`:92`, `:119`), `submit.html` (`:118`) |
| External links | none |
| Other actions | `sms:+17622486242` (`:110`), `tel:+17622486242` (`:112`) |
| Scripts loaded | Tailwind CDN (`:16`); `assets/site.js` (`:128`) |
| Iframes | none |
| Broken references | none found |

Named third-party embed providers (`:71-75`): GoHighLevel / LeadConnector,
YouTube (Google), Spotify. The page states at `:44-46` that the site runs no
analytics, advertising trackers, or marketing pixels and sets no first-party
cookies — consistent with what is in the repository (**V**, §4.2).

### 2.16 `submission-terms.html`

| Field | Value |
| --- | --- |
| Title | `Song Submission Terms | Agu Ocha` (`:6`) |
| Canonical | `https://aguocha.com/submission-terms.html` (`:8`) |
| Main heading | `<h1>Song Submission Terms</h1>` (`:42`) |
| Sub-headings | 8 numbered `<h2>` sections (`:61`, `:69`, `:78`, `:92`, `:105`, `:115`, `:124`, `:133`) |
| Apparent purpose | Submission terms: ownership, limited license, no placement guarantee, withdrawal (**V**) |
| Primary CTA | `Submit Song` → `submit.html` (`:142`) |
| Internal links | `submit.html` (`:142`), `privacy.html` (`:143`) |
| External links | none |
| Other actions | `sms:+17622486242` (`:108`) |
| Scripts loaded | Tailwind CDN (`:16`); `assets/site.js` (`:152`) |
| Iframes | none |
| Broken references | none found |

Carries a non-affiliation statement re: Suno at `:50-56`. `README.md:114`
records that this document has **not been reviewed by counsel** — **OC**.

### 2.17 `404.html`

| Field | Value |
| --- | --- |
| Title | `Page Not Found | Agu Ocha` (`:11`) |
| Robots | `noindex` (`:13`) |
| Main heading | `<h1>That page does not exist.</h1>` (`:43`) |
| Apparent purpose | GitHub Pages 404 handler (**V**) |
| Primary CTA | `Call` → `tel:+17622486242` (`:68`), the only `btn-primary` |
| Internal links | `index.html` (`:49`), `music.html` (`:53`), `book.html` (`:57`), `submit.html` (`:61`) |
| External links | none |
| Scripts loaded | Tailwind CDN (`:16`); `assets/site.js` (`:78`) |
| Iframes | none |
| Broken references | none found |

`:8` declares `<base href="/">`, with `:4-7` explaining that GitHub Pages serves
this file for unmatched paths at any depth, so relative URLs — including the
header/footer fetch — would otherwise resolve against the wrong directory.
`scripts/check-links.mjs:50-52` accounts for this `<base>` when resolving links
(**V**).

### 2.18 `suno-vibez.html` (legacy redirect stub)

| Field | Value |
| --- | --- |
| Title | `Suno Vibez — submit a track` (`:6`) |
| Robots | `noindex, follow` (`:11`) |
| Canonical | `https://aguocha.com/submit` (`:12`) |
| Main heading | `<h1>Suno Vibez</h1>` (`:26`) |
| Apparent purpose | Backward-compatible redirect to `submit.html` (**V**, `:7-9`) |
| Redirect mechanism | `<meta http-equiv="refresh" content="0; url=submit.html">` (`:10`) **and** inline `location.replace("submit.html")` (`:34`) |
| Primary CTA | `Submit your track` → `submit.html` (`:29`) — the no-JS fallback |
| Scripts loaded | Tailwind CDN (`:14`); one inline script (`:34`). **Does not load `assets/site.js`**, so it has no header or footer (**V**) |
| Iframes | none |
| Broken references | none found. Note it references `favicon.ico` (`:13`) but no `apple-touch-icon` |

### 2.19 `suno-vibez/index.html` (legacy redirect stub)

Same as §2.18 with directory-relative paths.

| Field | Value |
| --- | --- |
| Title | `Suno Vibez — submit a track` (`:6`) |
| Robots | `noindex, follow` (`:11`) |
| Canonical | `https://aguocha.com/submit` (`:12`) |
| Redirect mechanism | `meta refresh` → `../submit.html` (`:10`); `location.replace("../submit.html")` (`:34`) |
| Primary CTA | `Submit your track` → `../submit.html` (`:29`) |
| Scripts loaded | Tailwind CDN (`:14`); one inline script (`:34`). No `assets/site.js` |
| Broken references | none found; `../favicon.ico` (`:13`) resolves |

### 2.20 `header.html` (fragment)

| Field | Value |
| --- | --- |
| Purpose | Sticky site header: logo, desktop nav with a Book dropdown, contact buttons, mobile nav |
| Headings | none (fragment) |
| Internal links | `index.html` (`:21`), `music.html` (`:28`, `:94`), `book.html` (`:33`, `:97`), `private-corporate.html` (`:48`, `:99`), `festivals-tours.html` (`:51`, `:100`), `residencies.html` (`:54`, `:101`), `brand-activations.html` (`:57`, `:102`), `collab.html` (`:63`, `:105`), `media.html` (`:64`, `:106`), `tour.html` (`:65`, `:107`), `submit.html` (`:71`, `:109`) |
| External links | `https://store.aguocha.com` (`:66`, `:108`) |
| Other actions | `tel:+17622486242` (`:75`, `:113`), `sms:+17622486242` (`:76`, `:114`) |
| Images | `img/agu-logo.png` (`:22`) |
| Scripts | none — by design (`:1-7`) |
| Iframes | none |
| Broken references | none found |

Breakpoint: nav collapses below `lg` (1024px) — `:27`, `:70`, `:82`, `:92`.
`README.md:52` records the reason for `lg` rather than `md`.

### 2.21 `footer.html` (fragment)

| Field | Value |
| --- | --- |
| Purpose | Four-column footer: brand, navigation, contact, submission CTA, plus a bottom legal bar |
| Headings | none (uses `<div class="font-semibold">` labels at `:17`, `:39`, `:48`) |
| Internal links | `music.html` (`:19`), `book.html` (`:21`), `private-corporate.html` (`:23`), `festivals-tours.html` (`:24`), `residencies.html` (`:25`), `brand-activations.html` (`:26`), `collab.html` (`:29`), `media.html` (`:30`), `tour.html` (`:31`), `submit.html` (`:33`, `:53`) |
| External links | `https://store.aguocha.com` (`:32`), `https://chatbotfarm.ai` (`:64`, `target="_blank" rel="noopener"`) |
| Other actions | `tel:+17622486242` (`:41`), `sms:+17622486242` (`:42`) |
| Images | `img/agu-logo.png` (`:6`) |
| Scripts | none |
| Iframes | none |
| Broken references | none found |

`:63` hardcodes `2025` inside `<span id="current-year">` as a no-JS fallback;
`assets/site.js:104-110` overwrites it with the live year after the fragment
lands. Non-affiliation notice re: Suno at `:66-70`. Footer CTA at `:55` states
"Submission does not guarantee playlist placement."

### 2.22 Broken references — consolidated (**V**)

`node scripts/check-links.mjs` reports **0 errors, 0 warnings across 20 HTML
files**. That checker inspects `href` and `src` attributes only; it does not
inspect `<meta property="og:image">`. Direct grep found the following:

| Reference | Files and lines | Status |
| --- | --- | --- |
| `img/agu-mask-portrait.jpg` | `index.html:14`, `music.html:14`, `book.html:14`, `private-corporate.html:14`, `festivals-tours.html:14`, `residencies.html:14`, `brand-activations.html:14`, `collab.html:14`, `media.html:14`, `tour.html:14`, `store.html:14` — **11 pages** | **File does not exist in `img/`.** Already documented at `README.md:120` |
| `favicon.ico` | referenced by all 18 full pages | File exists but is **0 bytes** |
| `assets/suno-vibez.js` | `README.md:153`, `assets/site.js:21` | **File does not exist.** Documentation/comment reference only; nothing loads it |
| `press/` press assets | `README.md:125` | Directory is empty; the "placeholder links" it says to uncomment are not present in `media.html` |
| `rider/` | `README.md:33` | Directory is empty; no page references it |
| `VIDEO_ID_1` comment | `book.html:127` | Stale comment; a real video ID is present at `:130` |
| `myplaylist` | `collab.html:52` | Literal placeholder text in visible body copy |
| 4 × `*-inquiry-1024-transp-web.png` | none | Present in `img/` but referenced by no file |

---

## 3. GoHighLevel / LeadConnector inventory

### 3.1 Complete item list (**V** unless marked)

| # | File | Lines | Type | Public URL / identifier | Page section | Appears active | Credential exposure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `private-corporate.html` | 41 | Calendar (booking widget iframe) | `https://api.leadconnectorhq.com/widget/booking/gVxSS7k0YEJNYBFPQILA` | sole content of `<main>` | Yes — hardcoded in markup, loads on page load | Public widget ID only |
| 2 | `private-corporate.html` | 42 | GHL embed helper script | `https://link.msgsndr.com/js/form_embed.js` | after the iframe | Yes | None |
| 3 | `festivals-tours.html` | 42 | Calendar | `https://api.leadconnectorhq.com/widget/booking/X56pKuTIpw1vu5xdOVpX` | sole content of `<main>` | Yes | Public widget ID only |
| 4 | `festivals-tours.html` | 43 | GHL embed helper script | `https://link.msgsndr.com/js/form_embed.js` | after the iframe | Yes | None |
| 5 | `residencies.html` | 41 | Calendar | `https://api.leadconnectorhq.com/widget/booking/6tuaToT0K8aZFMLYJ2VU` | sole content of `<main>` | Yes | Public widget ID only |
| 6 | `residencies.html` | 42 | GHL embed helper script | `https://api.leadconnectorhq.com/js/form_embed.js` | after the iframe | Yes | None |
| 7 | `brand-activations.html` | 41 | Calendar | `https://api.leadconnectorhq.com/widget/booking/Fwzuvt3S944xnibxng7O` | sole content of `<main>` | Yes | Public widget ID only |
| 8 | `brand-activations.html` | 42 | GHL embed helper script | `https://api.leadconnectorhq.com/js/form_embed.js` | after the iframe | Yes | None |
| 9 | `collab.html` | 102–107 | Calendar (full-bleed) | `https://api.leadconnectorhq.com/widget/booking/4Zwyq5uTC8G7JdZW4ltW` | "Schedule a Virtual Meeting" section, below the title card at `:89-94` | Yes | Public widget ID only |
| 10 | `collab.html` | 109 | GHL embed helper script | `https://link.msgsndr.com/js/form_embed.js` | inside the calendar section | Yes | None |
| 11 | `assets/suno-vibez-config.js` | 51 | Form URL (config value) | `https://api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW` | config, consumed by `submit.html` §7 form section | Yes — `README.md:98` records prefill and resize as confirmed working | Public form ID only |
| 12 | `assets/suno-vibez-config.js` | 52–59 | Form metadata | `ghlFormTitle`, `ghlFormMinHeight: 1342`, `ghlFormName: "playlist submission Form"`, `prefillParam: "track_link"` | config | Yes | None |
| 13 | `assets/submit.js` | 238–311 | Form iframe injection | builds an iframe from item 11 into `#submission-form` (`submit.html:344`) | §7 "Submit your track" | Yes — triggered when the mount is within 400px of viewport (`:317-337`) | None |
| 14 | `assets/submit.js` | 20, 303–308 | GHL embed helper script | `https://link.msgsndr.com/js/form_embed.js` | appended to `document.body` after the form frame renders | Yes | None |
| 15 | `assets/submit.js` | 18 | Host allowlist | `["api.leadconnectorhq.com", "link.msgsndr.com"]` | validation guard in `validUrl` (`:25-37`) | Yes | None |
| 16 | `media.html` | 62 | External GHL-domain page link | `https://app.aguocha.com/media-request-form` | "Fast Facts" card CTA | Link is live in markup; the destination page is **U** | None; path only |
| 17 | `assets/suno-vibez-config.js` | 29–31 | Documented redirect target | `https://aguocha.com/thank-you.html` | comment block | **Not set** — must be configured inside GHL. **OC** | None |

### 3.2 Calendar / form summary

Five GHL calendars, one GHL form, one external GHL-domain page link:

| Purpose | Type | Identifier | Host page |
| --- | --- | --- | --- |
| Private & corporate booking | Calendar | `gVxSS7k0YEJNYBFPQILA` | `private-corporate.html` |
| Festivals & tours booking | Calendar | `X56pKuTIpw1vu5xdOVpX` | `festivals-tours.html` |
| Residency booking | Calendar | `6tuaToT0K8aZFMLYJ2VU` | `residencies.html` |
| Brand activation booking | Calendar | `Fwzuvt3S944xnibxng7O` | `brand-activations.html` |
| Collab virtual meeting | Calendar | `4Zwyq5uTC8G7JdZW4ltW` | `collab.html` |
| Playlist submission | Form | `hNlynM8h8zLs9jkDlTVW` | `submit.html` (injected) |
| Media request | External page | `app.aguocha.com/media-request-form` | `media.html` |

### 3.3 Asset types explicitly searched for and NOT found (**V**)

| Asset type | Result |
| --- | --- |
| GHL **survey** embeds (`/widget/survey/`) | none |
| GHL **chat / voice widgets** | none. `README.md:144` states earlier revisions of the README described `<!-- GHL chat/voice widget -->` placeholders and that those placeholders "were never actually present in the HTML" — grep confirms none exist |
| GHL **tracking / attribution scripts** | none. The only GHL scripts are the four in-markup `form_embed.js` tags and the one injected by `assets/submit.js` |
| `sites.ludicrous.cloud` | **zero occurrences in any file** |
| `store.aguocha.com` as a GHL asset | 4 references (`header.html:66`, `header.html:108`, `footer.html:32`, `store.html:43`). Whether the domain is served by GHL or another commerce platform is **U / OC** |
| `tour.aguocha.com` | 1 reference (`tour.html:43`). Platform **U / OC** |
| API keys, tokens, private webhook URLs | **none found.** Every GHL identifier in the repo is a public widget/form ID designed to appear in client-side markup. `assets/suno-vibez-config.js:5-6` states the file is public and must never hold keys; `README.md:116` repeats it |

### 3.4 Inconsistency observed within the GHL embeds (**V**)

Two different hosts serve the same helper script across the four booking pages:

- `link.msgsndr.com/js/form_embed.js` — `private-corporate.html:42`,
  `festivals-tours.html:43`, `collab.html:109`, and `assets/submit.js:20`
- `api.leadconnectorhq.com/js/form_embed.js` — `residencies.html:42`,
  `brand-activations.html:42`

Whether both hosts are currently equivalent is **U / OC**. Recorded as an
inventory fact, not as a defect.

Also: `collab.html:104` sets `min-height:850px` on its booking iframe, while the
four category-page booking iframes set no minimum height at all
(`private-corporate.html:41`, `festivals-tours.html:42`, `residencies.html:41`,
`brand-activations.html:41`).

---

## 4. External dependency inventory

### 4.1 All external references (**V**)

| Domain | Kind | Purpose | File : line |
| --- | --- | --- | --- |
| `cdn.tailwindcss.com` | Script | Tailwind CSS, runtime JIT from CDN — the only stylesheet source on the site | `404.html:16`, `book.html:15`, `brand-activations.html:15`, `collab.html:15`, `festivals-tours.html:15`, `index.html:15`, `media.html:15`, `music.html:15`, `privacy.html:16`, `private-corporate.html:15`, `residencies.html:15`, `store.html:15`, `submission-terms.html:16`, `submit.html:24`, `suno-vibez.html:14`, `suno-vibez/index.html:14`, `thank-you.html:16`, `tour.html:15` — **18 files** |
| `www.youtube.com` | Iframe | Video embeds | `index.html:51` (`rCBM8kuzI3U`), `music.html:69` (`rCBM8kuzI3U`), `music.html:82` (`1JGjYV1WcHE`), `book.html:130` (`C_ynqwU8_74`), `collab.html:61` (`qIGUNEUQSFY`) |
| `open.spotify.com` | Iframe | Artist and playlist players | `music.html:54` (artist `5ymz8gAPHU5sgDUhdhVqzh`), `collab.html:77` (playlist `5UP8zLioz5jelEk4n5sFi8`), `assets/suno-vibez-config.js:73` (playlist embed, injected into `submit.html`) |
| `open.spotify.com` | Link | "Follow the playlist" | `assets/suno-vibez-config.js:71`, rendered at `submit.html:158` and `thank-you.html:64` |
| `api.leadconnectorhq.com` | Iframe | 5 GHL booking calendars | `private-corporate.html:41`, `festivals-tours.html:42`, `residencies.html:41`, `brand-activations.html:41`, `collab.html:103` |
| `api.leadconnectorhq.com` | Iframe (injected) | GHL submission form | `assets/suno-vibez-config.js:51` → `assets/submit.js:264-300` |
| `api.leadconnectorhq.com` | Script | GHL `form_embed.js` | `residencies.html:42`, `brand-activations.html:42` |
| `link.msgsndr.com` | Script | GHL `form_embed.js` | `private-corporate.html:42`, `festivals-tours.html:43`, `collab.html:109`, `assets/submit.js:20` (injected at `:303-308`) |
| `app.aguocha.com` | Link | Media request form page | `media.html:62` |
| `tour.aguocha.com` | Link | Tour-update signup | `tour.html:43` |
| `store.aguocha.com` | Link | Merch / commerce | `header.html:66`, `header.html:108`, `footer.html:32`, `store.html:43` |
| `chatbotfarm.ai` | Link | "powered by" credit in the footer bar | `footer.html:64` |
| `schema.org` | JSON-LD context | `FAQPage` structured data vocabulary — **no network request** | `submit.html:475` |
| `aguocha.com` | Self-referential | canonical / `og:url` / share URL | canonical: `privacy.html:8`, `submission-terms.html:8`, `submit.html:12`, `suno-vibez.html:12`, `suno-vibez/index.html:12`; `og:url` on all full pages; `assets/suno-vibez-config.js:104` (`shareUrl`) |

### 4.2 Categories explicitly searched for and NOT found (**V**)

| Category | Result |
| --- | --- |
| **External fonts** | **None.** No Google Fonts, no `@font-face`, no font CDN. All type is the Tailwind default system stack |
| **External stylesheets** (`<link rel="stylesheet">`) | **None.** Zero `.css` files, zero external stylesheet links |
| **Analytics tools** | **None.** Grep for `gtag`, `google-analytics`, `googletagmanager`, `fbq`, `facebook`, `pixel` returned only two prose mentions: `privacy.html:45` and `README.md:142` |
| **Trackers / marketing pixels** | **None** |
| **First-party cookies** | **None set by repository code** |
| **CDNs** | One only: `cdn.tailwindcss.com` |
| **Video embeds** | YouTube only (5 iframes) |
| **Forms** | One external form (GHL `hNlynM8h8zLs9jkDlTVW`) plus one external form page (`app.aguocha.com/media-request-form`). No native `<form>` element exists anywhere in the repository — the hero field at `submit.html:130-139` is a bare `<input>`, not inside a form |
| **Calendars** | Five, all GHL — see §3.2 |

### 4.3 `assets/analytics.js` — classification (**V**)

Despite the filename, this file is **not** an analytics vendor integration. Read
directly:

- It makes no network request (**V** — no `fetch`, `XMLHttpRequest`,
  `sendBeacon`, `Image`, or script injection anywhere in the file).
- It sets no cookie and no persistent storage (**V**).
- It loads no third-party script (**V**).
- It pushes events onto `window.svEvents` and dispatches a `sv:track`
  `CustomEvent` on `document` (`:40-45`).
- Events emitted, per `:22-28` and the call sites: `hero_link_paste`,
  `form_start`, `field_complete`, `form_abandon`, `playlist_play`, `faq_open`.
- `:15-21` and `README.md:88` both state that attaching a destination listener
  requires updating `privacy.html` in the same change.

Loaded only by `submit.html:499`.

### 4.4 Client-side storage in use (**V**)

| Mechanism | Key | File : line | Lifetime |
| --- | --- | --- | --- |
| `sessionStorage` | `sv_track_link` | written `assets/submit.js:105`, `:123`; read `:253` | Tab session; cleared on tab close |
| In-memory only | `window.svEvents` array | `assets/analytics.js:33` | Page lifetime |

Both are described to visitors at `privacy.html:54-60`. No `localStorage`, no
`document.cookie` anywhere in the repository (**V**).

### 4.5 URL validation present in the JS (**V**)

`assets/submit.js:25-37` and `assets/thank-you.js:16-28` each implement a
`validUrl` guard requiring `https:`, an exact-hostname allowlist match, and no
embedded credentials. Allowlists:

- `assets/submit.js:18` — `FORM_HOSTS = ["api.leadconnectorhq.com", "link.msgsndr.com"]`
- `assets/submit.js:19`, `assets/thank-you.js:14` — `PLAYLIST_HOSTS = ["open.spotify.com", "suno.com", "www.suno.com"]`

All config-driven DOM is built with `createElement` / `setAttribute` /
`textContent`; no config value is routed through `innerHTML` (**V**, stated at
`assets/submit.js:8-11` and confirmed by reading the file). The only `innerHTML`
assignment in the repository is `assets/site.js:31`, whose input is a hardcoded
first-party fragment path (`:19-22`).

Per the session's scope, no judgement is offered here on whether these controls
are sufficient. Inventory only.

---

## 5. Required file verification

### 5.1 Website pages named in the brief (**V**)

| File | Exists | Documented in |
| --- | --- | --- |
| `index.html` | **Yes** | §2.2 |
| `music.html` | **Yes** | §2.3 |
| `book.html` | **Yes** | §2.4 |
| `private-corporate.html` | **Yes** | §2.5 |
| `festivals-tours.html` | **Yes** | §2.6 |
| `residencies.html` | **Yes** | §2.7 |
| `brand-activations.html` | **Yes** | §2.8 |
| `collab.html` | **Yes** | §2.9 |
| `media.html` | **Yes** | §2.10 |
| `tour.html` | **Yes** | §2.11 |
| `header.html` | **Yes** | §2.20 |
| `footer.html` | **Yes** | §2.21 |

### 5.2 Additional pages found beyond that list (**V**)

The brief's list was not complete. Six further HTML documents exist:

| File | Documented in |
| --- | --- |
| `store.html` | §2.12 |
| `submit.html` | §2.13 |
| `thank-you.html` | §2.14 |
| `submission-terms.html` | §2.16 |
| `suno-vibez.html` | §2.18 |
| `suno-vibez/index.html` | §2.19 |

Plus `privacy.html` and `404.html`, which the brief lists under policy and
infrastructure (§5.3).

### 5.3 Policy and infrastructure files (**V**)

| File | Exists | Note |
| --- | --- | --- |
| `privacy.html` | **Yes** | §2.15 |
| `terms.html` | **No** | Does not exist. `submission-terms.html` covers song submissions only — there is no general site terms-of-use page |
| `submission-terms.html` | **Yes** | §2.16 |
| `404.html` | **Yes** | §2.17 |
| `sitemap.xml` | **Yes** | 14 URLs; see §5.4 |
| `robots.txt` | **Yes** | `Allow: /` for all agents; declares the sitemap |
| `CNAME` | **Yes** | `aguocha.com` |
| `README.md` | **Yes** | 12,039 B; see §6 |
| `SECURITY.md` | **No** | Does not exist |
| `package.json` | **No** | Does not exist. `README.md:148` states "No build step and no dependencies" |
| Tailwind configuration | **No** | No config file, and no inline `tailwind.config` object in any page. Tailwind runs at its CDN defaults; the design tokens live in per-page `<style>` blocks instead |
| GitHub Actions workflows | **No** | No `.github/` directory exists |

### 5.4 `sitemap.xml` cross-check (**V**)

14 entries. Coverage against the 18 full pages:

- Listed and present: `/`, `music.html`, `book.html`, `private-corporate.html`,
  `festivals-tours.html`, `residencies.html`, `brand-activations.html`,
  `collab.html`, `/submit`, `media.html`, `tour.html`, `store.html`,
  `submission-terms.html`, `privacy.html`.
- Deliberately excluded, per the comment at `sitemap.xml:2`:
  `suno-vibez/` (stub), `thank-you.html` and `404.html` (both `noindex`).
- Also absent and **not** named in that comment: `suno-vibez.html`. It is
  `noindex, follow` (`suno-vibez.html:11`) so the exclusion is consistent with
  the others, but the comment lists only the directory form.
- `sitemap.xml:12` lists the extension-less `https://aguocha.com/submit`, which
  matches the canonical at `submit.html:12`. All other entries use `.html`.
  Resolution of `/submit` depends on GitHub Pages extension-less serving
  (**I** — asserted at `README.md:56`, not verifiable from the working tree).

---

## 6. Documentation-vs-code drift in `README.md` (**V**)

Recorded because `README.md` is the only written description of the site and
several statements no longer match the tree.

| `README.md` line | Statement | Repository state |
| --- | --- | --- |
| 29 | Structure diagram lists `img/agu-logo.png` | `img/` holds **9** PNGs, not 1 |
| 32–33 | Lists `press/` and `rider/` | Both exist and are **empty** |
| 120 | `img/agu-mask-portrait.jpg` "does not exist in the repo" and is referenced on "the eleven original pages" | **Accurate.** Confirmed: absent, referenced on exactly 11 pages |
| 125 | "uncomment the placeholder links in `media.html`" | **No commented placeholder links exist** in `media.html` |
| 123 | "Replace the `<!-- GHL_*_FORM_LINK -->` comments with live form URLs" | **No such comments exist** in any file; the four booking pages already carry live calendars |
| 144 | States the GHL chat/voice and GA4/Meta comment placeholders "were never actually present in the HTML" | **Accurate.** Confirmed absent |
| 153 | `node --check assets/suno-vibez.js` | **`assets/suno-vibez.js` does not exist.** The equivalent file is `assets/submit.js`. `assets/site.js:21` carries the same stale name in a comment |
| 154 | `node scripts/check-links.mjs` | Present and runnable; produced 0 errors / 0 warnings |
| 98–114 | Seven-item Operator TODO list | Consistent with `assets/suno-vibez-config.js:8-44`; all seven still outstanding — see §7.4 |
| 130 | Pages served from `main` / `/root` | **U / OC** — repository settings not visible |
| 3, 37 | "Tailwind-powered", "configured inline according to the Agu Ocha design system" | Tailwind is CDN-loaded with **no** configuration; the design system lives in duplicated per-page `<style>` blocks |

---

## 7. Evidence discipline

### 7.1 Verified (**V**)

Every item in §1 through §6 marked **V** was read directly from the cited file
and line. In particular:

- The 20 HTML files, 5 `assets/*.js` files, `scripts/check-links.mjs`, `CNAME`,
  `robots.txt`, `sitemap.xml`, `README.md`, and
  `.claude/settings.local.json` were each read in full.
- 5 GHL calendars, 1 GHL form, 5 `form_embed.js` script tags (4 in markup, 1
  injected) — §3.1.
- 5 YouTube iframes, 3 Spotify iframes (2 in markup, 1 injected) — §4.1.
- Zero `.css` files, zero external fonts, zero external stylesheets, zero
  analytics or tracker scripts, zero cookies, zero `localStorage`, zero
  `sites.ludicrous.cloud` references, zero GHL survey or chat-widget embeds,
  zero native `<form>` elements, zero API keys or tokens.
- `press/` and `rider/` are empty; `.github/`, `package.json`, `terms.html`,
  `SECURITY.md`, and any Tailwind config are absent.
- `img/agu-mask-portrait.jpg` is referenced as `og:image` on exactly 11 pages
  and does not exist.
- `favicon.ico` and `.nojekyll` are both 0 bytes.
- `node scripts/check-links.mjs`: 0 errors, 0 warnings, 20 files.

### 7.2 Inferred (**I**)

| Inference | Basis |
| --- | --- |
| Each page's "apparent purpose" in §2 | Read from title, meta description, headings, and body copy. Not declared anywhere as a purpose statement |
| `store.aguocha.com` is a commerce destination | `store.html:41` copy and the "Store" link labels. The platform behind it is not identifiable from the repo |
| `tour.aguocha.com` collects tour-update signups | `tour.html:41-45` copy only |
| `app.aguocha.com` is a GoHighLevel-hosted domain | The `app.` prefix and the fact that all other lead capture on the site is GHL. **Not proven by any file** |
| `/submit` resolves without the `.html` extension | Asserted at `README.md:56` and relied on by `submit.html:12` and `sitemap.xml:12`. Depends on GitHub Pages behavior |
| The four booking pages are visually headless by design | They contain only a calendar iframe in `<main>`, with the title carried by `<title>` and the GHL widget's own internal heading |

### 7.3 Unknown (**U**)

Not determinable from repository contents:

1. Whether the five GHL calendars and the submission form are live, enabled, and
   routing to a monitored inbox in the GoHighLevel account.
2. What `app.aguocha.com/media-request-form` renders, and whether it is a GHL
   form, survey, or funnel page.
3. What platform serves `store.aguocha.com` and `tour.aguocha.com`.
4. Whether `api.leadconnectorhq.com/js/form_embed.js` and
   `link.msgsndr.com/js/form_embed.js` are currently equivalent (§3.4).
5. Whether GitHub Pages is actually configured for `main` / `/root`, and whether
   HTTPS enforcement and the custom domain are active.
6. The current DNS configuration for `aguocha.com` and its subdomains.
7. Whether the GHL submission form's post-submit redirect points at
   `thank-you.html`, making that page reachable at all.
8. Whether the live GHL form still asks for the ten fields described at
   `README.md:98-108`.
9. Whether the Spotify playlist `5UP8zLioz5jelEk4n5sFi8` — shared between
   `collab.html:77` and `assets/suno-vibez-config.js:71` — is the intended Suno
   Vibez playlist.
10. Whether the four unreferenced `*-inquiry-1024-transp-web.png` images in
    `img/` are obsolete or staged for future use.

### 7.4 Requires operator confirmation (**OC**)

1. **GHL post-submit redirect** → `https://aguocha.com/thank-you.html`.
   Outstanding per `assets/suno-vibez-config.js:29-31` and `README.md:109`.
   Until set, `thank-you.html` is unreachable.
2. **GHL form field set.** `README.md:98-108` records ten visible fields
   including a required phone number, duplicate `terms_and_conditions`, a rights
   checkbox labelled "Option 1", and unfilled SMS-consent placeholders
   (`[BUSINESS NAME]`, `[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]`). Whether that is
   still the live state must be confirmed in GHL — not from this repo, and not
   by test-submitting.
3. **`curator` block** — `assets/suno-vibez-config.js:79-84` is empty, so
   `submit.html`'s "Who listens" section is removed at runtime.
4. **`lanes.a.playlistUrl`** — empty (`assets/suno-vibez-config.js:66-67`).
5. **`metrics.show`** — `false` (`:88`), while FAQ copy at `submit.html:381` and
   JSON-LD at `:481` say the acceptance rate is published on the page.
6. **`communityUrl`** — empty (`:102`), so `thank-you.html`'s community CTA is
   removed at runtime.
7. **OG image** — `img/agu-mask-portrait.jpg` missing on 11 pages; `submit.html`
   still needs a purpose-built 1200×630 image (`submit.html:19-21`).
8. **`favicon.ico` is 0 bytes** — confirm whether a real icon is expected.
9. **`submission-terms.html` has not been reviewed by counsel**
   (`README.md:114`).
10. **`suno-vibez.html` omission from the `sitemap.xml:2` comment** — confirm the
    exclusion is intentional (its `noindex` tag suggests it is).
11. **Absent `terms.html`** — confirm whether a general site terms-of-use page is
    wanted, distinct from the song submission terms.
12. **`collab.html:52` placeholder copy** — the visible text still reads
    `<em>myplaylist</em>`.
13. **Empty `press/` and `rider/` directories** — confirm whether assets are
    coming or the directories should stay as placeholders.
14. **GitHub Pages, DNS, and subdomain ownership** for `app.`, `store.`, and
    `tour.aguocha.com`.

---

## 8. Scope statement

This document is inventory only. No condition recorded above is characterised as
a security vulnerability, a UX defect, or a bug, and no remediation is proposed.
No existing repository file was created, edited, renamed, or deleted to produce
it. No form was submitted, no calendar was opened, no GHL asset was tested, no
dependency was installed, and no navigation, copy, or embed was changed.
