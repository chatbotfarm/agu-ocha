# Agu Ocha Static Site

This repository contains static, Tailwind-powered HTML pages for Agu Ocha’s official site. The project is designed for GitHub Pages hosting with no build step required.

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
│   ├── site.js                # shared loader + nav behavior (all pages)
│   ├── suno-vibez-config.js   # every external URL and toggle /submit needs
│   ├── analytics.js           # event surface, no vendor, no network, no cookies
│   ├── submit.js              # /submit behavior: paste, lanes, embeds, accordion
│   └── thank-you.js           # confirmation page: reply-by date, follow, share
├── scripts/check-links.mjs
├── img/agu-logo.png
├── favicon.ico
├── sitemap.xml · robots.txt
├── press/
├── rider/
└── .nojekyll
```

All pages share a consistent header, footer, and CTA patterns. Tailwind CSS is loaded via CDN and configured inline according to the Agu Ocha design system.

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

Emitted: `hero_link_paste`, `form_start`, `field_complete`, `form_abandon` (with last field touched), `playlist_play`, `faq_open`.

To start collecting, attach one listener — **and update `privacy.html` in the same change**:

```js
document.addEventListener("sv:track", (e) => { /* forward e.detail */ });
```

Known limit: the GHL form is a cross-origin iframe, so per-field events inside it are not observable from the parent. `field_complete` currently covers the hero link field only. Real per-field data requires either GHL's own form analytics or a natively-hosted form.

### Operator TODO

1. **Set `ghlFormUrl`.** It is empty, so the form area shows a Text/Email fallback instead. Paste the GoHighLevel **form** URL (`.../widget/form/<id>`). The form must write to the exact field keys in §12.1 — `track_link`, `creator_name`, `email`, `genre`, `submission_notes`, `rights_confirmed` — because renaming them later means re-keying every downstream workflow.
2. **Set the post-submit redirect** in GoHighLevel to `https://aguocha.com/thank-you.html`, or the confirmation page is unreachable. Append `?track=<title>` if you want the page to name the track back.
3. **Fill in `curator`.** Real name, photograph, and profile links (§6.5.1). While `name` is empty the whole "Who listens" block is removed — a half-filled curator block is worse than none, and an anonymous curator is indistinguishable from a fake-playlist operator.
4. **Add `lanes.a.playlistUrl`** once the Suno-hosted playlist exists, and confirm `lanes.b` points at the right Spotify playlist.
5. **Flip `metrics.show` to `true`** after the first monthly cycle, once the numbers are real.
6. **Add a 1200×630 OG image** and point `og:image` on `submit.html` at it.
7. **Have `submission-terms.html` reviewed by counsel.** A careful draft, not vetted legal advice.

Never put API keys, tokens, or private webhook URLs in `assets/` — those files are public.

## Replacing Placeholders

- **Hero image**: `img/agu-mask-portrait.jpg` is referenced as the `og:image` on the eleven original pages but **does not exist in the repo**, so social previews on those pages are currently broken. Either add a 1200×1500+ portrait at that exact path, or repoint those tags at `img/agu-logo.png` (which is what the newer pages use).
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

No build step and no dependencies. From the repository root:

```bash
node --check assets/site.js
node --check assets/suno-vibez-config.js
node --check assets/suno-vibez.js
node scripts/check-links.mjs     # internal links, fragments, http://, target=_blank rel, inline handlers
```

To preview, serve over HTTP — `file://` blocks `fetch`, so the header and footer render blank and the result is easy to misread:

```bash
python -m http.server 8000       # then open http://localhost:8000/
```

## Support

For additional adjustments, modify the HTML files directly and commit the updates. No compilation or dependency installation is necessary.