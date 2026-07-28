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
├── suno-vibez.html            # "Submit Song to a Playlist" — canonical route
├── suno-vibez/index.html      # redirect stub → ../suno-vibez.html
├── submission-terms.html · privacy.html · thank-you.html
├── 404.html
├── header.html · footer.html  # shared fragments, fetched at runtime
├── assets/
│   ├── site.js                # shared loader + nav behavior (all pages)
│   ├── suno-vibez-config.js   # GoHighLevel embed URL
│   └── suno-vibez.js          # builds/validates the submission embed
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

## Song submission funnel

The canonical route is **`/suno-vibez.html`**. `/suno-vibez/` (and `/suno-vibez`, which GitHub Pages redirects to it) is a stub that forwards there, so older links keep working and there is only one canonical URL.

The `suno-vibez` / `SUNO_VIBEZ_CONFIG` names are **internal identifiers only**, kept for URL and integration stability. No visitor-facing text uses them — the user-facing wording is "Submit Song" and "Submit Song to a Playlist" throughout.

`suno-vibez.html` loads three deferred scripts, and the order matters:

```html
<script src="assets/suno-vibez-config.js" defer></script>
<script src="assets/site.js" defer></script>
<script src="assets/suno-vibez.js" defer></script>
```

`defer` preserves document order and runs after parsing, so the config always exists by the time the builder reads it. Do **not** inline the builder: an inline script runs during parse, before the deferred config is defined, and would always fall through to the "unavailable" state.

`assets/suno-vibez.js` validates the configured URL (must be `https:` on `api.leadconnectorhq.com` or `link.msgsndr.com`) and builds the iframe with `createElement`/`setAttribute`. Config values are never passed through `innerHTML`. If the URL is missing or fails validation, the page renders an accessible "temporarily unavailable" panel with Call/Text fallbacks instead of a broken frame.

### Operator TODO

1. **Point `ghlEmbedUrl` at a real submission form.** It currently reuses the *booking calendar* that `collab.html` uses (`.../widget/booking/4Zwyq5uTC8G7JdZW4ltW`). That widget is a date/time slot picker with no track-link field, and because the calendar is shared, playlist submissions and collab inquiries are indistinguishable in the CRM. Replace it with a dedicated GoHighLevel form (`.../widget/form/<id>`) that has a required "track link" field, or at minimum a separate calendar. It is a one-line change in `assets/suno-vibez-config.js`.
2. **Set the post-submit redirect** in the GoHighLevel calendar/form settings to `https://aguocha.com/thank-you.html`. Until that is done, `thank-you.html` is unreachable.
3. **Have `submission-terms.html` reviewed by counsel.** It is a careful draft, not vetted legal advice.

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