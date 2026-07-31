# GoHighLevel — Outstanding Operator Actions

Last updated: 2026-07-30
Branch: `rebuild/high-conversion-site`

This file tracks GoHighLevel work that **cannot be done from this repository**.

## Form configuration status

| Funnel | Form ID | Form URL | Repository status |
| --- | --- | --- | --- |
| Tour Updates | `VH5umJecHaUdTesROA21` | `https://api.leadconnectorhq.com/widget/form/VH5umJecHaUdTesROA21` | **Configured** |
| Media Request | `jqVlv3qxUCz06vUEHVMk` | `https://api.leadconnectorhq.com/widget/form/jqVlv3qxUCz06vUEHVMk` | **Configured** |

Both values live in `assets/site-config.js` and were supplied by the operator on
2026-07-30.

> **"Configured" means the repository points at the right URL and the embed
> renders.** It is *not* confirmation that the form's fields, consent text,
> workflows, notifications, tags or post-submit redirect are correct. None of
> that is visible from this repository and none of it has been tested. The
> recommended field sets below remain **operator confirmations**.

---

## 1. Tour Updates form — **CONFIGURED**

| | |
| --- | --- |
| Repository status | **Configured** |
| Form ID | `VH5umJecHaUdTesROA21` |
| URL | `https://api.leadconnectorhq.com/widget/form/VH5umJecHaUdTesROA21` |
| Set in | `assets/site-config.js` → `tourUpdatesFormUrl` |
| Renders on | `tour.html`, section `#tour-updates` |
| Iframe title | `DJ Agu Ocha tour updates signup form` |
| If it ever fails | Loading line is removed and the static "Prefer to reach out directly?" panel (Text / Call / Privacy Notice) remains the working route |

`assets/forms.js` validates the URL on every page load — https, an allowlisted
LeadConnector host, a `/widget/form/` path, a non-empty form id. A
`/widget/booking/` URL is a **calendar** and is rejected on purpose.

### Recommended fields — **still requires operator confirmation in GoHighLevel**

| Field | Required |
| --- | --- |
| First name | Required |
| Email | Required |
| Mobile phone | Optional |
| City | Required |
| State or region | Optional |
| Country | Optional |
| Preferred notification — Email / Text / Both | Recommended |
| Consent fields | Configure in GHL per your SMS and email consent policy |

Recommended tag: `Agu Ocha - Tour Updates`

---

## 2. Media Request form — **CONFIGURED**

| | |
| --- | --- |
| Repository status | **Configured** |
| Form ID | `jqVlv3qxUCz06vUEHVMk` |
| URL | `https://api.leadconnectorhq.com/widget/form/jqVlv3qxUCz06vUEHVMk` |
| Set in | `assets/site-config.js` → `mediaRequestFormUrl` |
| Renders on | `media.html`, section `#media-request` |
| Iframe title | `DJ Agu Ocha media and press request form` |
| If it ever fails | Loading line is removed and the static "Send a request directly" panel (Text a Media Request / Call / Privacy Notice) remains the working route |

### Recommended fields — **still requires operator confirmation in GoHighLevel**

**Required**

- Full name
- Work email
- Publication, company or platform
- Request type
- Requested deadline
- Intended use

**Optional**

- Project or article description
- Website or publication URL
- Requested assets
- Consent to be contacted

**Suggested request types:** Interview · Podcast appearance · Radio appearance ·
Article or editorial feature · Event coverage · Press photos · Artist biography
or fast facts · Music or video assets · Other media inquiry

> Keep the form short. **Do not make phone number required** unless you decide it
> is operationally necessary — it is the highest-friction field on a press form.

---

## 3. `tour.aguocha.com` — retired from the site, DNS still unresolved

| | |
| --- | --- |
| Status | **Operator action required (DNS or GoHighLevel)** |
| Repository status | **Resolved.** No public page links to it any more |

`tour.aguocha.com` does not resolve (DNS NXDOMAIN, verified 2026-07-29). It was
the primary call to action on `tour.html`. That link has been removed and
replaced with an on-site signup section, so no visitor is sent to a dead host.

The subdomain itself is still unconfigured. If you want it to keep working for
previously shared links, point it at `https://aguocha.com/tour.html` via DNS or
a GoHighLevel redirect. **No DNS change was made from this repository.**

---

## 4. `app.aguocha.com/media-request-form` — retired from the site

| | |
| --- | --- |
| Status | **Operator decision** |
| Repository status | **Resolved.** No public page links to it any more |

That URL 301-redirected to `https://app.aguocha.com/home` ("Agu Ocha — Booking
Portal"), not to a media request form (verified 2026-07-29). The link has been
removed from `media.html`; media requests are now handled in-page at
`media.html#media-request`.

If the funnel still exists in GoHighLevel you may either restore it or leave it
retired — the site no longer depends on it either way.

---

## 5. Previously recorded, still open

Carried forward from `SECURITY-REVIEW.md` and `STAGE-E-VALIDATION.md`:

- **Post-submit redirect** for the Submit Music form — confirm it points at
  `https://aguocha.com/thank-you.html`, or `thank-you.html` stays unreachable.
- **Submit Music form fields and consent strings** — the repository cannot see
  inside form `hNlynM8h8zLs9jkDlTVW`. Confirm the consent text contains no
  unfilled placeholders and that the rights checkbox states the representation.
- **`form_embed.js` host split** — three embeds load it from `link.msgsndr.com`
  and two from `api.leadconnectorhq.com`. Inherited, preserved deliberately, and
  still awaiting confirmation of which host GoHighLevel considers canonical.
- **Anti-spam** on the public Submit Music form — the site cannot rate-limit a
  third-party iframe.

---

## Assets that must not change

These are wired and verified. Do not alter the ID, the widget type, or the
embed script that accompanies each one.

| Purpose | Type | ID |
| --- | --- | --- |
| Submit Music | **form** | `hNlynM8h8zLs9jkDlTVW` |
| Private or Corporate Event | **calendar** | `gVxSS7k0YEJNYBFPQILA` |
| Festival or Public Event | **calendar** | `X56pKuTIpw1vu5xdOVpX` |
| Club or Residency | **calendar** | `6tuaToT0K8aZFMLYJ2VU` |
| Brand Collaboration | **calendar** | `Fwzuvt3S944xnibxng7O` |
| Collaboration chat | **calendar** | `4Zwyq5uTC8G7JdZW4ltW` |

Note that `4Zwyq5uTC8G7JdZW4ltW` is a **booking calendar**, not a form, despite
sometimes being described as either.

---

## Never commit to this repository

`assets/` is served publicly, verbatim. Never place any of the following in it:

API keys · Private Integration tokens · agency or location API credentials ·
private webhook URLs · SMTP or Twilio credentials · GitHub tokens · exported
submitter data · authenticated GHL admin URLs.

Only public embed URLs and display values belong in `assets/site-config.js`.
