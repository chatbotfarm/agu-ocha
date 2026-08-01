#!/usr/bin/env node
/*
 * Zero-dependency embed and URL-validator checks for the Agu Ocha static site.
 *
 * Companion to check-links.mjs, which answers "does this link resolve?". This
 * file answers "is this embed safe, and do the URL validators still hold?".
 *
 * It exists because two classes of regression are invisible to a link checker
 * and to review:
 *
 *   1. A new iframe added without `title` or `referrerpolicy`. Both are one
 *      attribute, easy to omit, and nothing breaks visibly when they are
 *      missing -- so nothing catches it. (SECURITY-HARDENING-REPORT.md L-02.)
 *   2. A third external script host appearing. Every <script src> on a page
 *      runs with full first-party privilege on aguocha.com, so the set of
 *      hosts allowed to do that is the site's most sensitive list. It is
 *      currently two, both GoHighLevel. (SECURITY-HARDENING-REPORT.md M-01.)
 *
 * It also re-runs the URL-validator assertions that found L-01, so the
 * traversal fix cannot silently regress.
 *
 * Deliberately NOT checked: iframe `sandbox`. A sandbox permissive enough to
 * keep GoHighLevel, Spotify and YouTube working grants back almost everything
 * the attribute removes, so requiring one would be false assurance.
 *
 * Usage: node scripts/check-embeds.mjs
 * Exits 1 if any error is found.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", "node_modules", "scripts"]);

/* Hosts allowed to serve an executable <script src> on this origin. Both are
 * GoHighLevel, serving the same form_embed.js from two hosts (L-04). Adding to
 * this list widens the set of third parties that can execute as aguocha.com --
 * that should be a deliberate, reviewed decision, which is the point of
 * failing here. */
const ALLOWED_SCRIPT_HOSTS = new Set([
  "link.msgsndr.com",
  "api.leadconnectorhq.com"
]);

/* Hosts allowed in an iframe. Cross-origin frames cannot script this page, so
 * this list is about knowing what is embedded, not about privilege. */
const ALLOWED_FRAME_HOSTS = new Set([
  "api.leadconnectorhq.com",
  "link.msgsndr.com",
  "open.spotify.com",
  "www.youtube.com"
]);

const errors = [];

function htmlFiles(dir = ROOT, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".nojekyll") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) htmlFiles(full, out);
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

const files = htmlFiles();
let iframeCount = 0;
let scriptCount = 0;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const lineOf = (index) => html.slice(0, index).split("\n").length;
  const attr = (tag, name) => {
    const m = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag);
    return m ? m[1] : null;
  };

  /* ----------------------------------------------------------- iframes -- */
  for (const m of html.matchAll(/<iframe\b[^>]*>/gis)) {
    const tag = m[0];
    const at = `${rel}:${lineOf(m.index)}`;
    const src = attr(tag, "src");
    if (!src) continue; // a JS-populated shell; assets/*.js owns its attributes
    iframeCount++;

    let host;
    try {
      host = new URL(src).hostname;
    } catch {
      errors.push(`${at}: iframe src is not an absolute URL -> ${src}`);
      continue;
    }

    if (!/^https:$/i.test(new URL(src).protocol)) {
      errors.push(`${at}: iframe src is not https -> ${src}`);
    }
    if (!ALLOWED_FRAME_HOSTS.has(host)) {
      errors.push(
        `${at}: iframe from an unreviewed host -> ${host}\n` +
          `        Add it to ALLOWED_FRAME_HOSTS only after reviewing what it embeds.`
      );
    }
    /* Screen-reader users get "iframe" and nothing else without this. */
    if (!attr(tag, "title")) {
      errors.push(`${at}: iframe has no title attribute -> ${src}`);
    }
    /* L-02. Without it, browsers that still default to
     * no-referrer-when-downgrade send the full URL, including the query, to
     * the third party. */
    if (attr(tag, "referrerpolicy") !== "strict-origin-when-cross-origin") {
      errors.push(
        `${at}: iframe needs referrerpolicy="strict-origin-when-cross-origin" -> ${src}`
      );
    }
  }

  /* ----------------------------------------------------------- scripts -- */
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*"([^"]*)"[^>]*>/gis)) {
    const src = m[1];
    const at = `${rel}:${lineOf(m.index)}`;
    if (!/^https?:\/\//i.test(src)) continue; // first-party, covered elsewhere
    scriptCount++;

    const url = new URL(src);
    if (url.protocol !== "https:") {
      errors.push(`${at}: external script over ${url.protocol} -> ${src}`);
    }
    if (!ALLOWED_SCRIPT_HOSTS.has(url.hostname)) {
      errors.push(
        `${at}: external script from an unapproved host -> ${url.hostname}\n` +
          `        This code would run with full first-party privilege on aguocha.com.\n` +
          `        See SECURITY-HARDENING-REPORT.md M-01 before adding it.`
      );
    }
  }
}

/* ------------------------------------------------- JS-injected embeds -- *
 * assets/forms.js, assets/submit.js and assets/booking.js each build an
 * iframe in code, so the markup scan above cannot see them. Assert the same
 * two attributes are set there. A string check is enough and keeps this file
 * dependency-free. */
for (const jsFile of ["assets/forms.js", "assets/submit.js", "assets/booking.js"]) {
  const abs = join(ROOT, jsFile);
  if (!existsSync(abs)) {
    errors.push(`${jsFile}: expected embedder file is missing`);
    continue;
  }
  const js = readFileSync(abs, "utf8");
  if (!js.includes('"referrerpolicy", "strict-origin-when-cross-origin"')) {
    errors.push(`${jsFile}: JS-built iframe does not set referrerpolicy (L-02)`);
  }
  if (!/setAttribute\("title"|"title",/.test(js)) {
    errors.push(`${jsFile}: JS-built iframe does not set a title`);
  }
}

/* ----------------------------------------------------- URL validators -- *
 * validPhotoPath is reproduced here from assets/submit.js. The site ships no
 * module system and no test runner, so a behavioural copy is the available
 * option; the guard below fails if the two drift apart. */
const submitJs = readFileSync(join(ROOT, "assets/submit.js"), "utf8");
if (!submitJs.includes('if (value.indexOf("..") !== -1) return null;')) {
  errors.push(
    "assets/submit.js: validPhotoPath traversal guard is missing (L-01 regression)"
  );
}

function validPhotoPath(raw) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.indexOf("..") !== -1) return null;
  return /^\/img\/[A-Za-z0-9._\-/]+$/.test(value) ? value : null;
}

/* [input, expected] -- null means "must be rejected". */
const PHOTO_CASES = [
  ["/img/agu-logo.png", "/img/agu-logo.png"], // the live production value
  ["/img/portraits/agu.jpg", "/img/portraits/agu.jpg"],
  ["/img/../../etc/passwd", null], // L-01
  ["/img/../secret.png", null], // L-01
  ["img/agu-logo.png", null], // resolves against the current directory
  ["https://evil.com/x.png", null],
  ["//evil.com/x.png", null],
  ["/IMG/agu-logo.png", null],
  ["/img/x.png?a=b", null],
  ["", null],
  [null, null]
];

for (const [input, expected] of PHOTO_CASES) {
  const actual = validPhotoPath(input);
  if (actual !== expected) {
    errors.push(
      `validPhotoPath(${JSON.stringify(input)}) returned ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`
    );
  }
}

for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\nChecked ${iframeCount} iframe(s) and ${scriptCount} external script(s) across ` +
    `${files.length} HTML files, plus ${PHOTO_CASES.length} validator cases: ` +
    `${errors.length} error(s).`
);
process.exit(errors.length ? 1 : 0);
