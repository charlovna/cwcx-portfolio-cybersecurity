# Portfolio design system (Carbon-based type and palette)

Handoff spec for the Astro repo. Source of truth for values: `tokens.json` in this canvas. Visual reference: the three boards in this canvas (wordmark and palette, typography, landing).

Provenance: palette, scale and sharp-corner stance follow IBM Carbon (Apache 2.0). No IBM logos, marks or brand assets. Check hex values against `@carbon/colors` before shipping.

Scope of this revamp: typography and palette only. Layout, copy and content structure are out of scope.

## Rules

- All colors come from the CSS custom properties below. No hex values outside `src/styles/tokens.css`.
- Corners are 0px. Exceptions: tags and inline code 2px, monogram tile 12.5% of its size.
- One primary (blue fill) button per view. Tertiary is a 1.5px blue outline.
- `display` once per page (landing hero). `heading-1` once per inner page. Section headings are `heading-2`. Never use a larger heading style for a section to get more emphasis.
- Body text 16px minimum. Overlines are sentence case, never uppercase.
- Red is for errors only. Never the only signal.
- Focus: 2px outline, 2px offset, `--focus`; inside bands use `--focus-on-dark`.
- Touch targets 44px minimum. Respect `prefers-reduced-motion`.
- Input text on a band uses `--field-ink`, never `--ink` (it inverts in dark).

## Fonts (self-host, no Google Fonts request)

```
npm i @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
```

Import weights 300, 400, 600 for Sans and 400, 500 for Mono in the base layout. Fallbacks: `'Helvetica Neue', Arial, sans-serif` and `ui-monospace, Menlo, Consolas, monospace`.

## tokens.css

```css
:root {
  --font-sans: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;

  --surface: #FFFFFF;
  --surface-raised: #F4F4F4;
  --ink: #161616;
  --ink-muted: #525252;
  --line: #E0E0E0;
  --line-strong: #161616;
  --border-control: #8D8D8D;
  --accent: #0F62FE;
  --accent-hover: #0353E9;
  --on-accent: #FFFFFF;
  --accent-text: #0F62FE;
  --accent-text-hover: #0043CE;
  --accent-tint: #EDF5FF;
  --danger-text: #DA1E28;
  --success-text: #198038;
  --warning: #F1C21B;
  --on-warning: #161616;
  --band: #161616;
  --on-band: #F4F4F4;
  --on-band-muted: #C6C6C6;
  --band-line: #393939;
  --band-accent: #78A9FF;
  --field-bg: #F4F4F4;
  --field-ink: #161616;
  --code-surface: #161616;
  --code-ink: #F4F4F4;
  --code-comment: #A8A8A8;
  --code-keyword: #78A9FF;
  --code-string: #42BE65;
  --focus: #0F62FE;
  --focus-on-dark: #FFFFFF;
}

:root[data-theme='dark'] {
  --surface: #161616;
  --surface-raised: #262626;
  --ink: #F4F4F4;
  --ink-muted: #C6C6C6;
  --line: #393939;
  --line-strong: #F4F4F4;
  --accent-text: #78A9FF;
  --accent-text-hover: #A6C8FF;
  --accent-tint: #001D6C;
  --danger-text: #FF8389;
  --success-text: #42BE65;
  --band: #262626;
  --band-line: #525252;
  --code-surface: #000000;
  --focus: #FFFFFF;
}
```

Ship light first. Wire dark through `data-theme` on `<html>` only after the light pass is reviewed.

## Type scale

| Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| display | 60 / 70 (fluid 2.5 to 3.75rem at 1.17) | 300 Sans | 0 | Landing hero, once |
| heading-1 | 42 / 50 | 300 Sans | 0 | Inner-page title, once |
| heading-2 | 32 / 40 (fluid 1.75 to 2rem) | 400 Sans | 0 | Section headings, metrics |
| heading-3 | 28 / 36 (fluid 1.5 to 1.75rem) | 400 Sans | 0 | Row titles, pull quotes |
| heading-4 | 20 / 28 | 600 Sans | 0 | Step and card titles |
| body-lg | 20 / 28 | 400 Sans | 0 | Lead paragraphs |
| body | 16 / 24 | 400 Sans | 0.16px | Default, max 65ch |
| body-sm | 14 / 20 | 400 Sans | 0.16px | Tables, helper text, ink-muted |
| label | 14 / 18 | 400 Sans | 0.16px | Nav, buttons, form labels (table headers 600) |
| overline | 12 / 16 | 600 Sans | 0.32px | Meta lines, accent-text |
| caption | 12 / 16 | 400 Sans | 0.32px | ink-muted, never critical info |
| code | 14 / 20 | 400 Mono | 0.32px | Code and terminals |
| tag | 12 / 16 | 400 Mono | 0.32px | Stack tags, IDs |

## Wordmark

"Mint" Plex Sans 600 in `--accent-text`, "Development" Plex Sans 300 in `--ink`, 0.3em apart, tracking -0.01em. Reversed on a band: "Mint" in `--band-accent`, "Development" in `--on-band`. Reversed on blue: both white. Monogram: white "M" plus a cursor bar on an `--accent` tile.

## Build order

1. `tokens.css`, fonts, global base styles (body, headings, links, focus, reduced motion).
2. Layout shell: header with wordmark and nav, footer, section bands.
3. Shared components: buttons (primary, tertiary), chips, tags, table, code panel, form field, case row.
4. Pages. Then the residue audit and the acceptance checks below.

## Residue audit (must return nothing)

```
grep -rEn "#D1372F|#F8DA25|#047565|#0A5B3E|#E1D5B7|#F4F1E8|#4B5151|#22272D|#E6F2EE|#8FD8C3|#9AA3A3" src public
grep -rEin "archivo|jetbrains|inter\b|orbitron|neon|glitch|scanline|glow|text-shadow" src public
grep -rEn "#[0-9a-fA-F]{3,8}\b" src --include=*.astro --include=*.css --include=*.ts --include=*.tsx --include=*.md --include=*.mdx | grep -v "src/styles/tokens.css"
```

Review each hit of the last command by hand: content in markdown (for example a hex value quoted in a writeup) is fine.

## Acceptance checks

- Every text and UI pair meets the ratios in `tokens.json`. Thin margins to watch: accent-text on surface-raised 4.55:1, border-control on surface-raised 3.02:1.
- Keyboard: every control reachable, focus visible on surface, band and accent sections.
- 320px width: no horizontal scroll except inside tables and code blocks.
- Lighthouse accessibility 100, performance not worse than the current site.
- OG image and favicon use the new wordmark and monogram.

## Hosting note

GitHub Pages cannot set response headers. For a security portfolio, host on Cloudflare Pages or Netlify and ship a `_headers` file with at least a Content-Security-Policy, `X-Content-Type-Options`, a `Referrer-Policy`, and `Permissions-Policy`. Self-hosting the fonts keeps the CSP tight.
