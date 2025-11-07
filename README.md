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
├── img/
│   ├── agu-logo.png
│   └── agu-mask-portrait.jpg
├── favicon.ico
├── press/
├── rider/
└── .nojekyll
```

All pages share a consistent header, footer, and CTA patterns. Tailwind CSS is loaded via CDN and configured inline according to the Agu Ocha design system.

## Replacing Placeholders

- **Hero image**: Replace `img/agu-mask-portrait.jpg` with a 1200×1500+ portrait of Agu Ocha. Keep the same file name for automatic updates.
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

Comment placeholders are already included before each closing `</body>` tag:

- `<!-- GHL chat/voice widget -->`
- `<!-- Analytics (GA4/Meta) -->`

Insert the respective scripts between these comments when ready.

## Support

For additional adjustments, modify the HTML files directly and commit the updates. No compilation or dependency installation is necessary.