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

    const target = path.startsWith("/")
      ? join(ROOT, path)
      : resolve(baseDir, path);

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

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\nChecked ${files.length} HTML files: ${errors.length} error(s), ${warnings.length} warning(s).`
);
process.exit(errors.length ? 1 : 0);
