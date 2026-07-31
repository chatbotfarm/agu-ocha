# Agu Ocha Static Site

This repository contains static, Tailwind-powered HTML pages for Agu Ocha’s official site. It is designed for GitHub Pages hosting: every file that is served is committed, and GitHub Pages runs no build of its own.

There is exactly one build step, and it is local and optional: the Tailwind stylesheet is compiled ahead of time and its output is committed. See [Building the CSS](#building-the-css). If you are only editing copy, you do not need it.

## Structure

```
├── index.html
├── music.html
├── book.html
├── collab.html
├── media.html
├── tour.html
├── store.html
├── private-corporate.html · festivals-tours.html · residencies.html · brand-activations.html
├── submit.html                # Suno Vibez landing page — canonical route /submit
├── suno-vibez.html            # redirect stub → submit.html (legacy route)
├── suno-vibez/index.html      # redirect stub → ../submit.html (legacy route)
├── submission-terms.html · privacy.html · thank-you.html
├── 404.html
├── header.html · footer.html  # shared fragments, fetched at runtime
├── assets/
│   ├── tailwind-input.css     # Tailwind source (3 @tailwind directives) — edit this
│   ├── tailwind.css           # COMPILED OUTPUT, committed — do not hand-edit
│   ├── site.css               # hand-written project CSS (embeds, nav, CTAs)
│   ├── site.js                # shared loader + nav behavior (all pages)
│   ├── suno-vibez-config.js   # every external URL and toggle /submit needs
│   ├── analytics.js           # event surface, no vendor, no network, no cookies
│   ├── submit.js              # /submit behavior: paste, lanes, embeds, accordion
│   └── thank-you.js           # confirmation page: reply-by date, follow, share
├── scripts/check-links.mjs
├── package.json · package-lock.json · tailwind.config.js
├── docs/
│   ├── SUBMIT_MUSIC_CONVERSION_AUDIT.md      # what the funnel did before this branch
│   └── GHL_SUBMIT_MUSIC_FORM_REBUILD.md      # handover: the form is not in this repo
├── img/agu-logo.png
├── img/submit-music-og.png    # 1200×630 social preview for /submit
├── favicon.ico
├── sitemap.xml · robots.txt
├── press/
├── rider/
└── .nojekyll
```

All pages share a consistent header, footer, and CTA patterns.

## Building the CSS

Every page loads `assets/tailwind.css`, a **compiled, committed** stylesheet. Earlier revisions loaded `https://cdn.tailwindcss.com` instead. That CDN is the Tailwind **Play CDN**, which its own documentation marks as development-only: it ships a full JIT compiler to every visitor, generates styles in the browser, and makes the entire site depend on a third-party host being reachable and on JavaScript being enabled just to look styled.

### Requirements

Node.js 18 or newer, and npm. Both are needed only to *build*; neither is needed to serve or view the site.

### Install and build

```bash
npm install          # restores node_modules/ (ignored by git)
npm run build:css    # assets/tailwind-input.css -> assets/tailwind.css (minified)
npm run watch:css    # same, rebuilding on change, for local work
```

### The rules that keep this working

- **Edit `assets/tailwind-input.css`, never `assets/tailwind.css`.** The latter is generated and will be overwritten by the next build without warning.
- **Commit `assets/tailwind.css` with the change that caused it.** GitHub Pages serves committed files and runs no build. A change to markup that adds a utility class, committed without a rebuilt stylesheet, ships an unstyled element to production.
- **Tailwind is pinned to v3.** This is deliberate, not neglect. The Play CDN this replaced was v3, and v4 changes enough defaults that upgrading in the same step would have been an unannounced redesign rather than a build change. Upgrading is a separate, deliberate piece of work.
- **New content locations must be added to `content` in `tailwind.config.js`.** Tailwind only emits classes it can see in the files it scans. It currently scans root `*.html` (which includes the `header.html` / `footer.html` fragments), `suno-vibez/*.html`, and `assets/**/*.js`. A class in a file outside those globs compiles to nothing and fails silently — the page just renders wrong.
- **A class assembled at runtime is invisible to the scanner.** Tailwind matches literal strings, so `"text-" + color` never resolves. Write the whole class name out, or add it to `safelist` in `tailwind.config.js` — that is what the existing safelist entries are for: they name classes that only ever appear from JavaScript.

### Shared header and footer

`header.html` and `footer.html` are HTML **fragments**, fetched at runtime and injected into `#site-header` / `#site-footer` by `assets/site.js`. Every page loads it with a single tag:

```html
<script src="assets/site.js" defer></script>
```

Two things follow from this and are easy to get wrong:

- **A `<script>` inside an injected fragment never executes.** All nav behavior is therefore delegated from `document` in `assets/site.js`, wired up through the `data-nav-toggle` / `data-nav-close` attributes in `header.html`. Do not add inline `onclick` handlers to the fragments — they will not survive review and are unnecessary.
- **Anything that reads the injected DOM must chain off the load promise**, not `DOMContentLoaded`, which fires long before the fetch resolves. The footer copyright year is set this way.

The navigation collapses to the mobile menu below `lg` (1024px). It is not `md`: at 768px the root font size is 17px, which leaves only ~734px of usable width — not enough for the full nav plus the Submit Song CTA.

## Suno Vibez — the submission funnel

Built to the Suno Vibez landing page specification. The canonical route is **`/submit`** (spec §11.3), served by `submit.html`; GitHub Pages resolves the extension-less path. Internal links point at `submit.html` so they resolve under any host, including a local `python -m http.server`, and the canonical tag consolidates both onto `/submit`.

The earlier routes still work and are kept deliberately: `/suno-vibez.html`, `/suno-vibez/`, and `/suno-vibez` are `noindex, follow` stubs that forward to `submit.html`.

`suno-vibez-config.js` / `SUNO_VIBEZ_CONFIG` remain **internal identifiers**, unchanged for integration stability. "Suno Vibez" *is* the visible brand on `/submit`; what never appears is a Suno logo, wordmark, brand colour, or any claim of partnership. The sitewide footer carries the non-affiliation line.

### Script order

`submit.html` loads four deferred scripts, and the order is load-bearing:

```html
<script src="assets/suno-vibez-config.js" defer></script>
<script src="assets/analytics.js" defer></script>
<script src="assets/site.js" defer></script>
<script src="assets/submit.js" defer></script>
```

`defer` preserves document order and runs after parsing, so the config always exists by the time anything reads it. Do **not** inline any of them: an inline script runs during parse, before the deferred config is defined, and would always fall through to the fallback state.

### How the page behaves

- **Two-stage reveal (§7.2).** The hero holds one field. What you paste is written to `sessionStorage` and forwarded to the GHL form as the `track_link` query parameter, so nobody retypes it.
- **Lane routing (§7.6).** The pasted URL selects Lane A (Suno, any tier) or Lane B (released track) and changes the helper copy only. It **never blocks submission** — an unrecognised link shows a nudge and still goes through. A regex that rejects a valid-but-unanticipated URL silently destroys submissions.
- **Lazy third parties (§6.2, §10.2).** The playlist renders as a lightweight facade and only loads the Spotify iframe on click. The GHL form renders when it comes within 400px of the viewport. Neither competes with LCP.
- **Graceful empty states.** Every config-driven block validates its URL (`https:` + exact host allowlist) and builds DOM with `createElement`/`setAttribute`. No config value ever passes through `innerHTML`. Missing curator, missing metrics, missing community link, and missing playlist are each *omitted* rather than shown half-filled — per §6.5.3, "omit rather than shrink."

### Events (§13.3)

`assets/analytics.js` is **not** an analytics vendor. It makes no network request, sets no cookie, and loads no third-party script — it queues events on `window.svEvents` and dispatches `sv:track` on `document`. Wiring the events now means the field-level drop-off data exists from day one; retrofitting always loses it.

Emitted:

| Event | Fires when |
|---|---|
| `hero_link_paste` | a link is pasted into the hero field |
| `form_start` | the GHL form is first interacted with |
| `field_complete` | a tracked field is completed (hero link field only — see the limit below) |
| `form_abandon` | the page is left after starting, with the last field touched |
| `playlist_play` | the playlist facade is clicked and the Spotify iframe loads |
| `faq_open` | an FAQ item is expanded |
| `submit_cta_click` | any Submit CTA is clicked, labelled by position (`hero`, `sticky`, …) |
| `curator_profile_click` | a curator profile link is followed |
| `terms_click` | the submission terms are opened from `/submit` |
| `form_load_success` | the GHL iframe fires `load` before the timeout |
| `form_load_timeout` | it does not, and the failure panel is shown (`reason` distinguishes `timeout` from `unconfigured`) |

The last two are worth wiring up first if a listener is ever attached. They are the only signal that would reveal the form silently failing to load for a share of visitors — which is invisible in submission counts, because a visitor who never sees a form never shows up as a drop-off.

To start collecting, attach one listener — **and update `privacy.html` in the same change**:

```js
document.addEventListener("sv:track", (e) => { /* forward e.detail */ });
```

Known limit: the GHL form is a cross-origin iframe, so per-field events inside it are not observable from the parent. `field_complete` currently covers the hero link field only. Real per-field data requires either GHL's own form analytics or a natively-hosted form.

### Operator TODO

1. **Rebuild the GoHighLevel form.** This is now the largest remaining conversion cost in the funnel, and it is the one thing no change to this repository can fix — the form lives in GoHighLevel, inside a cross-origin iframe. `ghlFormUrl` points at the live "playlist submission Form" (`hNlynM8h8zLs9jkDlTVW`) and it works, but it asks for far more than the six approved fields, including a **required phone number**, split first/last name, an official release date, a rights checkbox still labelled **"Option 1"**, and SMS consent text containing unfilled `[BUSINESS NAME]` placeholders that real submitters currently see.

   Full specification, including what to remove and why, proposed consent wording, and a verification checklist: **[`docs/GHL_SUBMIT_MUSIC_FORM_REBUILD.md`](docs/GHL_SUBMIT_MUSIC_FORM_REBUILD.md)**.

   Field keys are correct and must not be renamed: `track_link`, `creator_name`, `email`, `genre`, `submission_notes`, `rights_confirmed` (§12.1). Renaming `track_link` in particular silently breaks the hero prefill.
2. **Set the post-submit redirect** in GoHighLevel to `https://aguocha.com/thank-you.html`, or the confirmation page is unreachable. Append `?track=<title>` if you want the page to name the track back.
3. **Flip `ghlFormSimplified` to `true`** — but only after item 1 is done *and verified in the live form*. It controls a factual claim about how long the form takes to fill in, so it has to follow the form rather than lead it.
4. **Add `lanes.a.playlistUrl`** once the Suno-hosted playlist exists, and confirm `lanes.b` points at the right Spotify playlist.
5. **Flip `metrics.show` to `true`** after the first monthly cycle, once the numbers are real.
6. **Replace the curator photo.** `curator` is populated, but `photo` points at the logo because no curator photograph exists in the repository. A square portrait, 512×512 or larger, committed to `img/`, is a one-line change from there. `assets/submit.js` restricts `photo` to a first-party `img/` path, so it cannot be pointed at a remote URL.
7. **Have `submission-terms.html` reviewed by counsel.** A careful draft, not vetted legal advice. The same applies to the consent wording proposed in the GHL rebuild document.

Never put API keys, tokens, or private webhook URLs in `assets/` — those files are public.

## Replacing Placeholders

- **Social preview images**: every `og:image` now points at a file that exists — `img/submit-music-og.png` (1200×630) on `/submit`, and `img/agu-logo.png` everywhere else. The earlier reference to a non-existent `img/agu-mask-portrait.jpg` is gone. The logo is square, so it is a working preview rather than a good one: a 1200×630 image per page section would be better, and adding one is a drop-in change to that page's `og:image`.
- **Logo mark**: Swap `img/agu-logo.png` if a different brand mark is preferred. Update the favicon if needed.
- **Music embeds**: Search for `VIDEO_ID_`, `PLAYLIST_ID`, `TRACK_ID_`, and `PROFILE` within the HTML files and replace each placeholder with the correct YouTube, Spotify, or SoundCloud IDs.
- **GHL forms**: Replace the `<!-- GHL_*_FORM_LINK -->` comments with live form URLs for private events, festivals, residencies, brand activations, collaborations, and media inquiries.
- **Store links**: If the commerce domain changes, update the `https://store.aguocha.com` references across the pages.
- **Press assets**: Upload files into the `press/` folder and uncomment the placeholder links in `media.html` when they are ready.

## GitHub Pages Deployment

1. Push the repository to GitHub.
2. In the repository settings, open **Pages** and choose the `main` branch with the `/root` directory.
3. Save the configuration. GitHub Pages will serve the site at `https://<username>.github.io/<repo>/` (or via a custom domain if configured).
4. Because `.nojekyll` is present, GitHub Pages will serve the files without Jekyll processing.

## Optional: Custom Domain (CNAME)

1. Create a `CNAME` file at the repository root containing your domain (for example, `aguocha.com`).
2. Configure the domain’s DNS with an `ALIAS`/`ANAME`/`A` record pointing to GitHub Pages and set the required `AAAA` or `CNAME` records as documented by GitHub.
3. Add the domain in the GitHub Pages settings to finalize the connection.

## Analytics & Widgets

The site currently runs **no analytics, trackers, marketing pixels, or first-party cookies**, and `privacy.html` states that. If any are added later, update `privacy.html` in the same change.

(Earlier revisions of this README described `<!-- GHL chat/voice widget -->` and `<!-- Analytics (GA4/Meta) -->` comment placeholders before each `</body>`. Those placeholders were never actually present in the HTML.)

## Validation

From the repository root:

```bash
node --check assets/site.js
node --check assets/suno-vibez-config.js
node --check assets/submit.js
node --check assets/thank-you.js
node scripts/check-links.mjs     # internal links, fragments, http://, target=_blank rel, inline handlers
npm run build:css                # then `git diff --stat assets/tailwind.css` must be empty
```

That last line is the one people forget. If rebuilding the stylesheet produces a diff, the committed CSS is stale and production is serving classes that no longer match the markup.

To preview, serve over HTTP — `file://` blocks `fetch`, so the header and footer render blank and the result is easy to misread:

```bash
python -m http.server 8000       # then open http://localhost:8000/
```

## Support

For copy and content changes, modify the HTML files directly and commit the updates — no compilation or dependency installation is necessary.

If your change adds, removes, or renames a Tailwind utility class anywhere, run `npm run build:css` and commit `assets/tailwind.css` alongside it.