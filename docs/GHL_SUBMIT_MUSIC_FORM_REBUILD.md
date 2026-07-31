# GoHighLevel — Submit Music form rebuild specification

**Audience:** whoever holds GoHighLevel admin access for the Agu Ocha account.
**Status:** specification only. Nothing in this document has been applied.
**Companion documents:** [`SUBMIT_MUSIC_CONVERSION_AUDIT.md`](SUBMIT_MUSIC_CONVERSION_AUDIT.md) (findings G1–G10), `../README.md` (operator TODO).

---

## 0. Why this document exists

The `/submit` page is a static file in this repository. The submission form is **not**. It is a
GoHighLevel form rendered inside a cross-origin iframe:

```
https://api.leadconnectorhq.com/widget/form/hNlynM8h8zLs9jkDlTVW
```

No change to this repository can add, remove, rename, or reorder a single field in that form. The
conversion work on the surrounding page has been completed and is as far as repository code can go.
Every remaining friction point in the funnel is inside GoHighLevel, and this document is the
handover for it.

### Verification status — read this before acting

**The author of this document does not have GoHighLevel admin access and has not authenticated to
GoHighLevel.** The form's field inventory below is transcribed from an earlier observation recorded
in this repository's `README.md` "Operator TODO" section. It has not been re-confirmed against the
live form.

Two further limits worth stating plainly:

- The form is cross-origin. The page cannot read inside the iframe, so nothing about the form's
  current contents can be confirmed from the browser either.
- **A form that renders is not a form that works.** Seeing the iframe appear proves the widget URL
  resolves. It proves nothing about whether the submission is stored, tagged, routed, or notified.
  Those are workflow questions and must be checked in GoHighLevel directly.

**Step 1 for the operator is therefore to open the form in GoHighLevel and reconcile the actual
field list against §2 below**, before changing anything.

---

## 1. Constraints that must hold

These are not preferences. Breaking any of them breaks the live site or the existing data.

| # | Constraint | Why |
|---|---|---|
| C1 | **Do not change the form ID.** It stays `hNlynM8h8zLs9jkDlTVW`. | The ID is hardcoded in `assets/suno-vibez-config.js`. Editing the existing form preserves it; "duplicate and replace" does not. |
| C2 | **Do not create a new form or reuse a different one.** Edit this form in place. | A new ID silently breaks `/submit` until the repository is updated and redeployed. |
| C3 | **Do not rename the field keys in §2.** | They are the contract between the form, the prefill parameter, and every downstream workflow and report. Renaming re-keys all of it. |
| C4 | **Keep the field key `track_link` exactly.** | `prefillParam` in `assets/suno-vibez-config.js` forwards the pasted link as `?track_link=…`. GoHighLevel silently ignores a prefill parameter that does not match a field key — it does not warn. |
| C5 | **Do not test with real personal information.** | Submissions land in the production contact database. Use an address you control and delete the contact afterwards. |

---

## 2. Target field set

Six fields. This is the whole form.

| Order | Label shown to the creator | Field key | Type | Required |
|---|---|---|---|---|
| 1 | Link to your track | `track_link` | URL | Yes |
| 2 | How you want to be credited | `creator_name` | Single-line text | Yes |
| 3 | Email | `email` | Email | Yes |
| 4 | Genre | `genre` | Dropdown | Yes |
| 5 | Anything we should know? (optional) | `submission_notes` | Textarea, 300 characters | No |
| 6 | Rights confirmation | `rights_confirmed` | Checkbox | Yes |

### Notes per field

**1. `track_link`** — first field, because the page has usually already filled it in. Placeholder:
`https://suno.com/song/… or a Spotify/YouTube link`. Do not validate against a Suno-only pattern: a
regex that rejects a valid-but-unanticipated URL destroys submissions silently, and both AI-generated
and released tracks are accepted.

**2. `creator_name`** — one field, not two. See §3 on why first/last name is being removed.

**3. `email`** — the only contact channel the funnel needs.

**4. `genre`** — dropdown. Suggested options, ordered by expected frequency, with a catch-all so no
one is blocked: Afrohouse · House · Amapiano · Afrobeats · Electronic · Hip-Hop / R&B · Other.

**5. `submission_notes`** — optional and visibly labelled optional. An unlabelled optional field is
read as required and adds friction for nothing.

**6. `rights_confirmed`** — see §4. The label carries legal weight and must state the representation.

---

## 3. Fields to remove, and the reasoning

Each of these is a live conversion cost. The reasoning is recorded so the decision can be revisited
on its merits rather than re-litigated from scratch.

| Field | Action | Reasoning |
|---|---|---|
| **Phone** (currently required) | **Remove** | The single highest-friction field in a music submission form, and required in the current build. Nothing in the review workflow uses a phone number — selected creators are contacted by email. Requiring a phone number to submit a song is the largest identified drop-off cause on the page. |
| **First Name** | **Remove** | Duplicates `creator_name`. Creators submit under an artist name, not a legal name. |
| **Last Name** | **Remove** | As above. |
| **Official Release Date** | **Remove** | Meaningless for an unreleased or AI-generated track, which is most of the intended intake. It reads as a professional-infrastructure requirement and signals "this is not for you" to exactly the creators the playlist is for. |
| **Second SMS-marketing checkbox** | **Remove** | Two SMS consent checkboxes appear on the form. At most one consent control belongs here, and with phone collection removed, none is needed. |
| **Duplicate `terms_and_conditions` field** | **Remove the duplicate** | The field appears twice. Keep one. |

Removing Phone also removes the reason for any SMS consent control on this form. If SMS marketing
consent is wanted, it belongs on a separate opt-in — not attached to a song submission.

---

## 4. Consent and legal text

> **This section is drafted, not vetted. It has not been reviewed by a lawyer.** It is written to be
> more accurate than what is currently live, which is a low bar — see below. Treat it as a starting
> point for counsel, not as legal advice or as a reviewed document.

### 4.1 The rights checkbox

**Current state:** the checkbox is reportedly labelled **"Option 1"**. That is a default control
label that was never filled in. The consequence is not cosmetic: the creator is supposed to be making
a representation about rights, and a checkbox labelled "Option 1" states no representation at all. Of
everything in this document, this is the item with actual legal weight, and it is currently blank.

**Proposed label:**

> I own or control the rights to this track and can allow it to be reviewed and, if selected,
> featured in a playlist or DJ set under the [submission terms](https://aguocha.com/submission-terms.html).

Keep the link. It must point at `https://aguocha.com/submission-terms.html`, which states that the
creator keeps ownership and that placement is never guaranteed.

### 4.2 Template placeholders currently shown to submitters

The SMS consent text reportedly still contains **unfilled template placeholders**:

```
[BUSINESS NAME]
[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]
```

Real submitters are seeing these. If §3 is followed and SMS consent is removed along with the phone
field, this resolves itself. If any SMS consent control is retained for another reason, the
placeholders must be filled before it ships — an unfilled placeholder in a consent string is not a
typo, it means no consent was actually described.

---

## 5. Post-submit redirect

Set the form's post-submit action to redirect to:

```
https://aguocha.com/thank-you.html
```

Without this, `thank-you.html` is unreachable and the funnel ends on GoHighLevel's default
confirmation. The page is already built and handles the rest.

Optionally append `?track=<track title>` and the confirmation page will name the track back to the
creator. It is optional; the page renders correctly without it.

---

## 6. Response policy — what the form and workflows may promise

The site now states exactly one promise, in these words:

> If your track is selected, we'll contact you within seven days.

This is deliberately **not** a promise to answer every submission. Do not add a confirmation
workflow, autoresponder, or form-success message that says or implies every submitter will receive a
reply, unless a workflow that actually does so exists and has been verified.

The two claims are not interchangeable, and the second one is the kind of promise that generates
complaints when it turns out to be untrue. If a universal autoresponder *is* configured, tell the
repository maintainer — the page copy can then be updated to match, in that order. Copy follows
reality, not the other way round.

---

## 7. Workflow, routing, and data hygiene

Not conversion work, but the form is not finished without it. None of this is verifiable from the
repository — please confirm each item in GoHighLevel.

- [ ] Each of the six fields maps to a contact field or custom field, and the value is actually stored.
- [ ] Submissions are tagged so they can be segmented — e.g. `submission`, `suno-vibez`, and the month.
- [ ] A notification reaches whoever reviews submissions. A form that stores silently gets forgotten.
- [ ] Duplicate handling is defined: one track per creator per month is the stated policy on the page
      and in `submissionsPerCreatorPerMonth`. Decide whether a second submission updates the contact,
      creates a second record, or is rejected — and make sure the behaviour matches what the page says.
- [ ] Spam handling is on. A public URL field on a public page attracts bots.
- [ ] Submissions are retained and deleted consistently with `privacy.html`, which tells visitors they
      can have their data deleted on request. Make sure that request can actually be honoured.

---

## 8. Verification after the rebuild

Do these in order. Steps 1–4 are in GoHighLevel; steps 5–8 are on the live site.

1. Confirm the form ID is still `hNlynM8h8zLs9jkDlTVW`.
2. Confirm exactly six visible controls, with the keys in §2 spelled exactly as written.
3. Confirm the rights checkbox shows the §4.1 wording, not "Option 1".
4. Confirm no `[BUSINESS NAME]` or `[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]` string survives anywhere.
5. Open `https://aguocha.com/submit` and confirm the form renders.
6. Paste a track link into the hero field, continue to the form, and confirm **`track_link` is
   prefilled**. This is the step that silently breaks if a field key was renamed.
7. Submit once, using an email address you control and a real but disposable track link. **Do not
   enter anyone else's personal information.** Confirm:
   - the browser lands on `https://aguocha.com/thank-you.html`;
   - the contact appears in GoHighLevel with all six values stored;
   - the reviewer notification arrives.
8. Delete the test contact.

### 8.1 The one repository change that follows

`assets/suno-vibez-config.js` contains:

```js
ghlFormSimplified: false,
```

While it is `false`, the hero reads *"You keep ownership. No submission fee."*
When set to `true`, it reads *"Takes about 60 seconds. You keep ownership."*

**Leave it `false` until steps 1–8 have actually passed.** The 60-second claim is false against the
current form and must not be switched on in anticipation of an edit that has not happened yet. It is
a one-line change and it is the last step, not the first.

---

## 9. If something breaks

The repository side degrades safely and needs no emergency action:

- If the form URL stops resolving, `/submit` shows a failure panel with a retry control after ten
  seconds rather than an empty frame. The page does not appear broken.
- If the form ID changes by accident, restore it in GoHighLevel. Do **not** patch the repository to
  match a new ID as a first move — that ships a change to production to work around an edit that can
  be reverted at the source.

The page will keep working throughout. Nothing here is urgent enough to justify a rushed change to
the live site.
