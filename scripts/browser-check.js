/* In-browser runtime checks. Paste into DevTools, or with the local server running:
     await (await fetch('/scripts/browser-check.js')).text().then(eval)
   Returns { pass, failures, details } for the current page and viewport. */
(async () => {
  await new Promise((r) => setTimeout(r, 2500));
  const failures = [];
  const vw = document.documentElement.clientWidth;
  const details = { page: location.pathname, vw };

  /* No horizontal page scroll */
  details.docOverflow = document.documentElement.scrollWidth - vw;
  if (details.docOverflow > 0) failures.push(`page scrolls sideways by ${details.docOverflow}px`);

  /* Elements poking past the viewport that no ancestor clips */
  const offenders = [...document.querySelectorAll('body *')].filter((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || getComputedStyle(el).position === 'fixed') return false;
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (p !== el && /(hidden|auto|scroll|clip)/.test(cs.overflowX)) return false;
      /* skip elements waiting to animate in (offset by a transform) */
      if (cs.transform !== 'none' && cs.transform !== 'matrix(1, 0, 0, 1, 0, 0)') return false;
    }
    return r.right > vw + 1 || r.left < -1;
  });
  if (offenders.length) failures.push(`${offenders.length} element(s) wider than the viewport, first: ${offenders[0].tagName}.${offenders[0].className}`);

  /* Text that should never wrap must fit its box */
  const noWrap = ['.hero h1', '.hero-intro', '.contact h2'];
  for (const sel of noWrap) {
    const el = document.querySelector(sel);
    if (el && el.scrollWidth > el.clientWidth + 1) failures.push(`${sel} is clipped (${el.scrollWidth} > ${el.clientWidth})`);
  }

  /* Two-line rule: each hero line is exactly one rendered line */
  const lineH = (el) => parseFloat(getComputedStyle(el).fontSize) * 1.2;
  document.querySelectorAll('.hero h1 .mask, .contact h2 .mask').forEach((m, i) => {
    if (m.getBoundingClientRect().height > lineH(m) * 1.5) failures.push(`headline line ${i + 1} wraps`);
  });
  const intro = document.querySelector('.hero-intro');
  if (intro) {
    const n = Math.round(intro.getBoundingClientRect().height / parseFloat(getComputedStyle(intro).lineHeight));
    if (n > 2) failures.push(`hero intro renders ${n} lines`);
  }

  /* Touch targets */
  const small = [...document.querySelectorAll('a.btn, button, .chip, .menu-btn')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width && r.height < 44;
  });
  if (small.length) failures.push(`${small.length} control(s) under 44px tall`);

  /* Motion wiring */
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  details.motion = html.classList.contains('motion-ready') ? 'on' : html.classList.contains('motion-off') ? 'off' : 'unknown';
  if (html.classList.contains('motion-pending')) failures.push('motion-pending never cleared: content may be hidden');
  if (!reduce && window.gsap && details.motion !== 'on') failures.push('GSAP loaded but motion did not start');
  if (reduce && details.motion === 'on') failures.push('motion ran despite reduced-motion preference');
  details.lenis = !!(window.__portfolio && window.__portfolio.lenis);
  details.triggers = window.__portfolio ? window.__portfolio.triggers() : 0;

  /* Animated elements end in their visible state */
  document.querySelectorAll('[data-hero-rise], [data-hero-fade], [data-print]').forEach((el) => {
    const cs = getComputedStyle(el);
    const m = cs.transform.match(/matrix\(([^)]+)\)/);
    const ty = m ? parseFloat(m[1].split(',')[5]) : 0;
    if (Math.abs(ty) > 1 || parseFloat(cs.opacity) < 0.99) failures.push(`animated element not settled: ${el.textContent.trim().slice(0, 24)}`);
  });

  /* Typewriter: full text kept for screen readers, layout never moves, and the hero loop is running */
  const typed = [...document.querySelectorAll('[data-type], [data-type-head]')];
  if (typed.length && details.motion === 'on') {
    typed.forEach((el) => {
      const full = el.getAttribute('data-full');
      if (!full) failures.push('typed line was not prepared');
      else if (el.textContent.replace(/\s+/g, ' ') !== full.replace(/\s+/g, ' ')) failures.push(`typed line lost text: ${full.slice(0, 30)}`);
    });
    const hero = [...document.querySelectorAll('[data-type]')];
    if (hero.length) {
      const box = hero[0].closest('pre');
      const h0 = box.getBoundingClientRect().height;
      const on = () => hero.reduce((n, el) => n + el.querySelectorAll('.tw-ch.on').length, 0);
      const a = on();
      await new Promise((r) => setTimeout(r, 1200));
      const b = on();
      if (a === b) failures.push('hero typewriter is not running');
      if (Math.abs(box.getBoundingClientRect().height - h0) > 1) failures.push('typing changed the terminal height');
      details.typedChars = [a, b];
    }
  }
  /* Cursor stays inline (no line of its own) */
  const cur = document.querySelector('.terminal .cursor');
  if (cur && cur.previousElementSibling && cur.previousElementSibling.classList.contains('tw-ch') && cur.getBoundingClientRect().left < cur.previousElementSibling.getBoundingClientRect().left) failures.push('cursor dropped to its own line');

  return { pass: failures.length === 0, failures, details };
})();
