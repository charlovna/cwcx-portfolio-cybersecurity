# Portfolio design notes

Built on the **Mint Development** design system (Swiss editorial pop). Values live in `tokens.json` and `tokens.css`; `styles.css` uses variables only.

## Rules

- No hex colours outside `tokens.css`. No gradients, no shadows, no left-border accents.
- Corners are 0. Only tags and inline code use `--radius-sm` (2px).
- Archivo (width 125) for display and section headings, Inter for reading, JetBrains Mono for tags, IDs and terminal output.
- One red primary button per view. On green bands the primary is mustard.
- Never red text on mustard.
- **Hero lines are two lines at most, strictly.** Headline and intro lines are fixed lines (`white-space: nowrap`) sized with `clamp()` so they never wrap.
- Touch targets 44px minimum. Focus outline 3px, offset 3px.

## Story structure (one page, seven events)

| Event | Section | Motion |
| --- | --- | --- |
| EVT 00 sign-in | Hero | Headline rises from masks, terminal prints, stat rules draw and numbers rise, "next big thing" lines type and erase on a loop (paused off-screen), hero holds while the mustard band slides over |
| EVT 01 profile | About | Manifesto is static (by request); bio and focus areas stagger |
| EVT 02 write-ups | Selector | Category filter; rows slide in; full reports on `/writeups/` pages |
| EVT 03 credentials | Certifications | Big count is static; rows slide in; filter All / Security / AI |
| EVT 04 history | Experience | Ink band; heading column sticks; oldest first, open role last; mustard timeline rule draws, entries light as it reaches them |
| EVT 05 capabilities | Skills | Tool lines drift sideways with scroll, alternating direction |
| EVT 06 session open | Contact | Headline types once ("a" white, "session." mustard), profile lines print |

## Motion

- GSAP 3.13.0 (ScrollTrigger) and Lenis 1.3.4 from jsDelivr, pinned versions.
- Lenis runs on the GSAP ticker and feeds `ScrollTrigger.update`.
- Ease-out `cubic-bezier(0.23, 1, 0.32, 1)` / `expo.out`. Transform and opacity only.
- Buttons (fine pointers only): short magnetic pull, label leads, arrow nudges 4px, press scales to 0.96.
- Touch screens: the main CTA in view (red, or mustard on green) lifts to 1.04 and its arrow slides out, twice, each time it scrolls into view; a tap stops it.
- Hero "Verify." is teal green (`--green`); red stays reserved for the primary CTA.
- Typewriters split text into hidden characters that keep their space, so typing never moves the layout; screen readers get the full text.
- Status pill dot blinks softly (CSS), stopped by reduced motion.
- An inline head script hides animated elements (`motion-pending`) until `site.js` hands them to GSAP, with a 3s safety timeout.
- `prefers-reduced-motion` or a failed CDN: no Lenis, no pins, everything shown in its final state; filters, menu and copy still work.

## Where to edit text

All copy is plain HTML. Search the file for the words you want to change and edit them in place.

| What | File | Look for |
| --- | --- | --- |
| Hero headline, intro, buttons, stats | `index.html` | `EVT 00 · Hero` |
| Terminal lines and "next big thing" | `index.html` | `session.log` (typed lines are the `data-type` spans) |
| Manifesto, bio, facts, focus areas | `index.html` | `EVT 01 · About` |
| Write-up selector, featured summary | `index.html` | `EVT 02 · Write-ups` |
| Certificates (dates, names, links) | `index.html` | `data-cert-list` (one `<li>` per cert; update the filter counts if you add one) |
| Experience timeline | `index.html` | `EVT 04 · Experience` (keep oldest first, `next` last) |
| Skills and tools | `index.html` | `EVT 05 · Skills` (update the "N items" label) |
| Contact text and profile links | `index.html` | `EVT 06 · Contact` |
| Write-ups list page | `writeups/index.html` | `data-filter-target="index"` |
| Entra report | `writeups/entra-iam-lab.html` | section comments `01` to `06` |
| Page titles and search descriptions | each page's `<head>` | `<title>`, `meta name="description"` |

Run `node scripts/check.mjs` after editing. Keep hero lines short: the check fails if a hero line would need a third line.

## Adding a write-up

1. Create `writeups/<slug>.html` from `writeups/entra-iam-lab.html`.
2. Add a row to `writeups/index.html` with `data-cat` and `data-level`, and update the filter counts.
3. On `index.html`, add the row to the matching `.wu-group` (or un-disable that category's chip and add a group), update counts, the hero stat and the footer line.

## Checks

```
node scripts/check.mjs          # static: links, anchors, ids, a11y basics, token-only CSS, hero rule
node scripts/check.mjs --net    # also confirms every CDN URL returns 200
node scripts/serve.mjs          # local server on http://127.0.0.1:4173
```

With the server running, paste this into the browser console on any page and width for runtime checks (sideways scroll, clipped hero lines, touch targets, motion state):

```
await (await fetch('/scripts/browser-check.js')).text().then(eval)
```
