#!/usr/bin/env node
/* Static checks for the portfolio. No dependencies.
   Usage: node scripts/check.mjs [--net]
   --net also requests every CDN URL and expects HTTP 200. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'writeups/index.html', 'writeups/entra-iam-lab.html'];
const scripts = ['site.js'];
const errors = [];
const warnings = [];
const passes = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const pass = (m) => passes.push(m);

const read = (p) => readFileSync(join(root, p), 'utf8');
const ALLOWED_SCRIPT_HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com'];

/* 1. JS syntax */
for (const s of scripts) {
  try { execFileSync(process.execPath, ['--check', join(root, s)], { stdio: 'pipe' }); pass(`${s} parses`); }
  catch (e) { err(`${s} has a syntax error: ${e.stderr?.toString().trim()}`); }
}

/* 2. Per-page checks */
const idsByPage = {};
const cdnUrls = new Set();
for (const page of pages) {
  if (!existsSync(join(root, page))) { err(`missing page ${page}`); continue; }
  const html = read(page);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  idsByPage[page] = new Set(ids);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) err(`${page}: duplicate ids ${[...new Set(dupes)].join(', ')}`); else pass(`${page}: ids unique (${ids.length})`);

  if (!/<html lang="[a-z-]+"/.test(html)) err(`${page}: <html> missing lang`);
  if (!/<meta name="viewport"/.test(html)) err(`${page}: missing viewport meta`);
  if (!/<title>[^<]+<\/title>/.test(html)) err(`${page}: missing <title>`);
  if (!/<meta name="description"/.test(html)) warn(`${page}: missing meta description`);
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(`${page}: expected exactly one <h1>, found ${h1s}`); else pass(`${page}: one <h1>`);
  if (!/class="skip-link"/.test(html)) warn(`${page}: no skip link`);

  /* Inline hex colours are not allowed in markup (tokens only) */
  const styleHex = [...html.matchAll(/style="[^"]*#[0-9a-fA-F]{3,8}\b[^"]*"/g)];
  if (styleHex.length) err(`${page}: ${styleHex.length} inline style(s) with hex colours`);

  /* Buttons and links need an accessible name */
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!text && !/aria-label=/.test(m[1])) err(`${page}: button without a name`);
  }
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!text && !/aria-label=/.test(m[1])) err(`${page}: link without text (${m[1].trim().slice(0, 60)})`);
    if (/target="_blank"/.test(m[1]) && !/rel="[^"]*noopener/.test(m[1])) err(`${page}: target=_blank without rel=noopener`);
  }
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) if (!/\salt=/.test(m[1])) err(`${page}: <img> without alt`);

  /* Scripts: pinned versions from allowed CDNs */
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
    const src = m[1];
    if (/^https?:/.test(src)) {
      const host = new URL(src).host;
      if (!ALLOWED_SCRIPT_HOSTS.includes(host)) err(`${page}: script from unexpected host ${host}`);
      if (!/@\d+\.\d+\.\d+\//.test(src)) err(`${page}: script not pinned to an exact version: ${src}`);
      cdnUrls.add(src);
    }
  }
  for (const m of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="(https:[^"]+)"/g)) cdnUrls.add(m[1].replace(/&amp;/g, '&'));

  /* Placeholders still to fill */
  const ph = [...new Set([...html.matchAll(/\[(DATE|SCREENSHOT|ID|HANDLE|NEXT [A-Z ]+|START)\]/g)].map((m) => m[0]))];
  if (ph.length) warn(`${page}: placeholders left: ${ph.join(', ')}`);
}

/* 3. Internal links and anchors resolve */
let linkCount = 0;
for (const page of pages) {
  const html = read(page);
  const base = dirname(page);
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    linkCount++;
    const [pathPart, hash] = url.split('#');
    let target = page;
    if (pathPart) {
      target = join(base, pathPart).replace(/\\/g, '/');
      const abs = join(root, target);
      if (existsSync(abs) && statSync(abs).isDirectory()) target = join(target, 'index.html').replace(/\\/g, '/');
      if (!existsSync(join(root, target))) { err(`${page}: broken link ${url}`); continue; }
    }
    if (hash) {
      const ids = idsByPage[target] || new Set([...read(target).matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]));
      if (!ids.has(hash)) err(`${page}: anchor #${hash} not found in ${target}`);
    }
  }
}
pass(`internal links and anchors checked (${linkCount})`);

/* 4. Design-system rules in CSS */
const css = read('styles.css');
const cssHex = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/#[0-9a-fA-F]{3,8}\b/g)];
if (cssHex.length) err(`styles.css: ${cssHex.length} hex colour(s); use tokens.css variables`); else pass('styles.css uses tokens only');
const radius = [...css.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim()).filter((v) => !/^(0|var\(--radius-(none|sm)\))$/.test(v));
if (radius.length) err(`styles.css: non-token border-radius values: ${radius.join(', ')}`); else pass('corners follow radius tokens');
if (/linear-gradient|radial-gradient/.test(css)) err('styles.css: gradients are not allowed by the design system');
if (!/prefers-reduced-motion/.test(css) || !/prefers-reduced-motion/.test(read('site.js'))) err('reduced-motion handling missing'); else pass('reduced-motion handled in CSS and JS');

const tokensCss = read('tokens.css');
const usedVars = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
for (const page of pages) for (const m of read(page).matchAll(/var\((--[a-z0-9-]+)/g)) usedVars.add(m[1]);
const missingVars = [...usedVars].filter((v) => !tokensCss.includes(`${v}:`) && !css.includes(`${v}:`));
if (missingVars.length) err(`CSS variables used but not defined in tokens.css: ${missingVars.join(', ')}`); else pass(`all ${usedVars.size} CSS variables defined`);

/* 5. Hero rule: every hero line is a fixed line, two at most */
const index = read('index.html');
const heroH1 = index.match(/<h1[\s\S]*?<\/h1>/)?.[0] || '';
const heroLines = (heroH1.match(/class="mask"/g) || []).length;
if (heroLines !== 2) err(`hero headline should have 2 lines, has ${heroLines}`); else pass('hero headline is 2 lines');
const intro = index.match(/<p class="hero-intro[\s\S]*?<\/p>/)?.[0] || '';
const introLines = (intro.match(/<span/g) || []).length;
if (introLines > 2) err(`hero intro has ${introLines} lines`); else pass('hero intro is 2 lines');

/* 6. Write-up pages always offer a way back to the landing page */
for (const page of pages.filter((p) => p.startsWith('writeups/'))) {
  const html = read(page);
  if (!html.includes('href="../index.html#evt-02"')) err(`${page}: no link back to the landing page write-ups section`);
  else pass(`${page}: links back to the landing page`);
}

/* 7. Section order: Experience (EVT 04) comes before Skills (EVT 05) */
const iExp = index.indexOf('id="evt-04"'), iSkills = index.indexOf('id="evt-05"');
if (!(iExp > 0 && iSkills > iExp && index.slice(iExp, iExp + 400).includes('exp-title'))) err('Experience should be EVT 04, placed before Skills (EVT 05)');
else pass('Experience (EVT 04) precedes Skills (EVT 05)');

/* 8. Timeline is chronological (oldest first), open role last */
const whens = [...index.matchAll(/<span class="when">([^<]*)<\/span>/g)].map((m) => m[1]);
const yearOf = (w) => { const m = w.match(/(20\d\d)/); return m ? +m[1] : Infinity; };
const sorted = whens.every((w, i) => i === 0 || yearOf(w) >= yearOf(whens[i - 1]));
if (!sorted || whens[whens.length - 1] !== 'next') err(`timeline not chronological: ${whens.join(' | ')}`); else pass('timeline is oldest first, open role last');

/* 9. No certificate row left without a link */
if (/class="view muted">soon</.test(index)) err('certificate rows still show "soon"'); else pass('every certificate row links somewhere');

/* 10. Certificate count is static (no scroll counter) */
if (/counter\.textContent = '00'/.test(read('site.js'))) err('certificate count still animates on scroll'); else pass('certificate count is static');

/* 11. Contact headline: only "session." is mustard; "a" stays white */
if (!/data-type-head>a <span class="accent-line">session\.<\/span>/.test(index)) err('contact headline: "a" should sit outside the mustard accent'); else pass('contact headline keeps "a" white');

/* 12. Optional: CDN reachability */
if (process.argv.includes('--net')) {
  for (const url of cdnUrls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.status !== 200) err(`CDN ${res.status}: ${url}`); else pass(`CDN 200: ${url.replace(/\?.*/, '')}`);
    } catch (e) { err(`CDN unreachable: ${url} (${e.message})`); }
  }
}

/* Report */
for (const p of passes) console.log(`  ok    ${p}`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);
console.log(`\n${passes.length} passed, ${warnings.length} warnings, ${errors.length} failed`);
process.exit(errors.length ? 1 : 0);
