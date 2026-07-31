#!/usr/bin/env node
/*
 * Zero-dependency link checker for the Agu Ocha static site.
 *
 * Verifies that every internal href/src/link target actually resolves on disk,
 * and that in-page #fragment targets exist. External http(s) links are not
 * fetched - they are only checked for an insecure http:// scheme and for
 * target="_blank" without rel="noopener".
 *
 * Usage: node scripts/check-links.mjs
 * Exits 1 if any error is found.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve, relative, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", "node_modules", "scripts"]);

/** Recursively collect .html files under ROOT. */
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

const errors = [];
const warnings = [];
const files = htmlFiles();

// Collect id="..." per file so cross-page #fragments can be checked too.
const idsByFile = new Map();
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const ids = new Set();
  for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) ids.add(m[1]);
  idsByFile.set(file, ids);
}

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const hasBase = /<base\s+href\s*=\s*["']\/["']/i.test(html);
  // A <base href="/"> makes every relative URL resolve from the site root.
  const baseDir = hasBase ? ROOT : dirname(file);

  const attrs = [...html.matchAll(/\s(?:href|src)\s*=\s*["']([^"']*)["']/g)];

  for (const [, raw] of attrs) {
    const value = raw.trim();
    if (!value) continue;

    if (/^https:\/\//i.test(value)) continue;
    if (/^http:\/\//i.test(value)) {
      errors.push(`${rel}: insecure http:// resource -> ${value}`);
      continue;
    }
    if (/^(mailto:|tel:|sms:|data:|javascript:|#)/i.test(value)) {
      if (value.startsWith("#") && value.length > 1) {
        if (!idsByFile.get(file).has(value.slice(1))) {
          errors.push(`${rel}: fragment #${value.slice(1)} has no matching id`);
        }
      }
      if (/^javascript:/i.test(value)) errors.push(`${rel}: javascript: URL -> ${value}`);
      continue;
    }
    if (value.startsWith("//")) { errors.push(`${rel}: protocol-relative URL -> ${value}`); continue; }

    const [path, hash] = value.split("#");
    if (!path) continue;

    // A query string is not part of the file path. book.html?type=festival is
    // book.html with a parameter, not a file named "book.html?type=festival".
    // Strip it before touching the filesystem, or every parameterised internal
    // link is reported as broken.
    const filePath = path.split("?")[0];
    if (!filePath) continue;

    const target = filePath.startsWith("/")
      ? join(ROOT, filePath)
      : resolve(baseDir, filePath);

    let resolved = target;
    if (existsSync(target) && statSync(target).isDirectory()) {
      resolved = join(target, "index.html");
    }

    if (!existsSync(resolved)) {
      errors.push(`${rel}: broken link -> ${value}  (looked for ${posix.normalize(relative(ROOT, resolved).replace(/\\/g, "/"))})`);
      continue;
    }
    if (hash && resolved.endsWith(".html")) {
      const ids = idsByFile.get(resolved);
      if (ids && !ids.has(hash)) {
        errors.push(`${rel}: fragment #${hash} not found in ${relative(ROOT, resolved).replace(/\\/g, "/")}`);
      }
    }
  }

  // target="_blank" must carry rel="noopener" (or noreferrer).
  for (const [tag] of html.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/g)) {
    if (!/rel\s*=\s*["'][^"']*noopener|rel\s*=\s*["'][^"']*noreferrer/.test(tag)) {
      errors.push(`${rel}: target="_blank" without rel="noopener" -> ${tag.slice(0, 90)}`);
    }
  }

  // Inline event handlers.
  for (const [, attr] of html.matchAll(/\s(on[a-z]+)\s*=\s*["']/gi)) {
    warnings.push(`${rel}: inline ${attr} handler`);
  }
}

/* ------------------------------------------------------- clean-URL rules --
 * The site serves clean directory routes (/submit-music/). Each old .html path
 * survives only as a noindex redirect document. Two things can quietly undo
 * that, and neither shows up as a broken link, because the legacy files still
 * exist on disk:
 *
 *   1. a public page linking to a legacy .html route, which sends visitors
 *      through a pointless client-side hop and splits ranking signals;
 *   2. a redirect that points at itself or at another redirect, which is a
 *      loop or a chain no crawler should be asked to follow.
 */
function isRedirectDoc(html) {
  return /<meta\s+http-equiv=["']refresh["']/i.test(html);
}

const redirectTargets = new Map(); // file -> destination path

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const redirect = isRedirectDoc(html);

  if (redirect) {
    const m = html.match(/<meta\s+http-equiv=["']refresh["']\s+content=["'][^;]*;\s*url=([^"']+)["']/i);
    if (m) redirectTargets.set(rel, m[1].trim());
    continue; // a redirect document is allowed to name its own legacy siblings
  }

  // Public pages must not link to legacy .html routes.
  for (const [, raw] of html.matchAll(/\s(?:href)\s*=\s*["']([^"']*)["']/g)) {
    const value = raw.trim();
    if (/^(https?:|mailto:|tel:|sms:|data:|#)/i.test(value)) continue;
    const path = value.split("?")[0].split("#")[0];
    if (!path.endsWith(".html")) continue;
    // index.html inside a directory route is the file itself, not a legacy route.
    if (/(^|\/)index\.html$/.test(path)) continue;
    errors.push(`${rel}: links to legacy route -> ${value}  (use the clean directory URL)`);
  }
}

for (const [file, dest] of redirectTargets) {
  const self = "/" + file.replace(/index\.html$/, "");
  if (dest === self || dest === "/" + file) {
    errors.push(`${file}: redirect points at itself -> ${dest}`);
    continue;
  }
  // Resolve the destination and confirm it is a real page, not another redirect.
  const target = dest.startsWith("/") ? join(ROOT, dest) : resolve(dirname(join(ROOT, file)), dest);
  const resolved = existsSync(target) && statSync(target).isDirectory() ? join(target, "index.html") : target;
  if (!existsSync(resolved)) {
    errors.push(`${file}: redirect destination does not exist -> ${dest}`);
  } else if (isRedirectDoc(readFileSync(resolved, "utf8"))) {
    errors.push(`${file}: redirect chains into another redirect -> ${dest}`);
  }
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\nChecked ${files.length} HTML files: ${errors.length} error(s), ${warnings.length} warning(s).`
);
process.exit(errors.length ? 1 : 0);
