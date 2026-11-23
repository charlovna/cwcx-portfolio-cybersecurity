/* ============================================================
   Charles Wyatt Portfolio | site behaviour and scroll story
   - Filters, menu and copy work without GSAP.
   - Motion runs only when GSAP + ScrollTrigger loaded and the
     viewer has not asked for reduced motion. Otherwise every
     element stays in its final, visible state.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* Height of the fixed header on phone and tablet (0 on desktop, where it scrolls away) */
  function headerOffset() {
    var h = $('[data-header]');
    return h && getComputedStyle(h).position === 'fixed' ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || h.offsetHeight : 0;
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var btn = $('[data-menu-btn]');
    var header = $('[data-header]');
    if (!btn || !header) return;
    var close = function () {
      header.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'menu';
    };
    btn.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'close' : 'menu';
    });
    $$('#site-nav a').forEach(function (a) { a.addEventListener('click', close); });
    /* The bar now floats over content, so an open menu also closes on Escape or a tap outside */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { close(); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('is-open') && !header.contains(e.target)) close();
    });
  }

  /* ---------- Filter groups (write-ups, certs, index) ---------- */
  function initFilters() {
    $$('[data-filter-group]').forEach(function (group) {
      var name = group.getAttribute('data-filter-group');
      var buttons = $$('button[data-filter]', group);
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var value = btn.getAttribute('data-filter');
          buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
          applyFilter(name, value, group);
        });
      });
    });
  }

  var filterState = {};

  function applyFilter(name, value, group) {
    var items;
    var target = group && group.getAttribute('data-filter-for');
    if (target) {
      /* Multi-dimension filters on one list (write-ups index: category + level) */
      var attr = group.getAttribute('data-filter-attr') || 'cat';
      filterState[target] = filterState[target] || {};
      filterState[target][attr] = value;
      var rowsShown = 0;
      $$('[data-filter-target="' + target + '"] [data-cat]').forEach(function (el) {
        var ok = Object.keys(filterState[target]).every(function (k) {
          var v = filterState[target][k];
          return v === 'all' || el.getAttribute('data-' + k) === v;
        });
        el.hidden = !ok;
        if (ok) rowsShown++;
      });
      var empty = $('[data-filter-empty="' + target + '"]');
      if (empty) empty.hidden = rowsShown > 0;
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      return;
    }
    if (name === 'writeups') {
      items = $$('.wu-group[data-cat]');
      var queued = $('[data-queued]');
      if (queued) queued.hidden = value !== 'all';
    } else if (name === 'certs') {
      items = $$('[data-cert-list] .cert-row');
    } else {
      items = $$('[data-filter-target="' + name + '"] [data-cat]');
    }
    var shown = 0;
    items.forEach(function (el) {
      var match = value === 'all' || el.getAttribute('data-cat') === value;
      el.hidden = !match;
      if (match) shown++;
    });
    if (name === 'certs') {
      var counter = $('[data-counter]');
      if (counter) counter.textContent = pad(shown);
      var status = $('[data-cert-status]');
      if (status) status.textContent = 'Showing ' + shown + ' certifications';
    }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- Copy email ---------- */
  function initCopy() {
    $$('[data-copy]').forEach(function (btn) {
      var label = btn.textContent;
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function () {
          btn.textContent = 'copied ✓';
          var status = $('[data-copy-status]');
          if (status) status.textContent = 'Email address copied';
          setTimeout(function () { btn.textContent = label; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy this address:', text); });
        } else {
          window.prompt('Copy this address:', text);
        }
      });
    });
  }

  /* ---------- Rail: active section (works without GSAP) ---------- */
  function initRail() {
    var rail = $('[data-rail]');
    if (!rail || !('IntersectionObserver' in window)) return;
    var links = $$('[data-rail-link]', rail);
    var setActive = function (id, theme) {
      links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-rail-link') === id); });
      rail.classList.toggle('on-dark', theme === 'dark');
      rail.classList.toggle('on-mustard', theme === 'mustard');
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.getAttribute('data-section'), e.target.getAttribute('data-theme'));
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    $$('[data-section]').forEach(function (s) { io.observe(s); });
    setActive('evt-00', 'light');
  }

  /* ---------- Motion ---------- */
  function initMotion() {
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    if (reduceMotion || !gsap || !ScrollTrigger) {
      root.classList.remove('motion-pending');
      root.classList.add('motion-off');
      return null;
    }
    gsap.registerPlugin(ScrollTrigger);

    /* Hand initial states from CSS to GSAP, then drop the CSS gate */
    var has = function (sel) { return !!document.querySelector(sel); };
    if (has('[data-hero-rise], [data-stat]')) gsap.set('[data-hero-rise], [data-stat]', { y: 0, yPercent: 110 });
    /* split typed text into hidden characters before the gate lifts, so nothing flashes */
    var heroTyped = $$('[data-type]').map(splitChars);
    var headTyped = $$('[data-type-head]').map(splitChars);
    if (has('[data-hero-fade], [data-print]')) gsap.set('[data-hero-fade], [data-print]', { opacity: 0 });
    root.classList.remove('motion-pending');
    root.classList.add('motion-ready');

    var ease = 'expo.out';

    /* Lenis smooth scroll, driven by the GSAP ticker */
    var lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      root.classList.add('lenis-on');
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var target = document.getElementById(id.slice(1));
          if (!target) return;
          ev.preventDefault();
          /* scale with distance: short hops feel instant, long jumps still read as travel */
          var dist = Math.abs(target.getBoundingClientRect().top - headerOffset());
          lenis.scrollTo(target, { offset: -headerOffset(), duration: Math.min(1, Math.max(0.45, dist / 4000)) });
          history.replaceState(null, '', id);
        });
      });
    }

    /* EVT 00: hero load */
    if (has('[data-hero-rise]')) {
      var heroTl = gsap.timeline({ defaults: { ease: ease } })
        .to('[data-hero-rise]', { yPercent: 0, duration: 0.9, stagger: 0.07 }, 0.15)
        .to('[data-hero-fade]', { opacity: 1, duration: 0.6, stagger: 0.08 }, 0.1)
        .to('[data-print]', { opacity: 1, duration: 0.01, stagger: 0.09 }, 0.6);
      /* stats settle in after the buttons: rule draws left to right, number rises under it */
      if (has('.stats .stat')) {
        heroTl.call(function () { $('.stats').classList.add('is-drawn'); }, null, 0.75)
              .to('[data-stat]', { yPercent: 0, duration: 0.8, stagger: 0.08 }, 0.85);
      }
      heroTl.call(function () { loopType(heroTyped); }, null, '>-0.2');
    }

    /* Typewriter helpers. Text is split into per-character spans that start hidden
       but keep their space, so typing never shifts the layout. A screen-reader copy
       keeps the full text where the line isn't already labelled. */
    function splitChars(el) {
      var full = el.textContent;
      el.setAttribute('data-full', full);
      if (el.hasAttribute('data-type')) {
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = full;
        el.parentNode.insertBefore(sr, el);
        el.setAttribute('aria-hidden', 'true');
      }
      var chars = [];
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split('').forEach(function (ch) {
              var c = document.createElement('span');
              c.className = 'tw-ch';
              c.textContent = ch;
              frag.appendChild(c);
              chars.push(c);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      };
      walk(el);
      return { el: el, chars: chars };
    }
    function makeCursor(existing) {
      var c = existing || document.createElement('span');
      c.className = 'cursor';
      c.setAttribute('aria-hidden', 'true');
      return c;
    }
    function placeCursor(cursor, line, n) {
      var ref = line.chars[n - 1];
      if (ref) ref.parentNode.insertBefore(cursor, ref.nextSibling);
      else line.el.insertBefore(cursor, line.el.firstChild);
    }

    /* "next big thing": types line 1, then line 2, holds, erases, repeats */
    function loopType(lines) {
      if (!lines.length) return;
      var cursor = makeCursor($('[data-type-cursor]'));
      var heroEl = $('.hero');
      var onScreen = true;
      if ('IntersectionObserver' in window && heroEl) {
        new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; }).observe(heroEl);
      }
      /* A held (pinned/sticky) hero still "intersects" while the band covers it,
         so also pause once the band is past mid-screen. */
      var covered = false;
      if ($('#evt-01')) ScrollTrigger.create({ trigger: '#evt-01', start: 'top 50%',
        onEnter: function () { covered = true; }, onLeaveBack: function () { covered = false; } });
      var TYPE = 55, HOLD = 2200, BETWEEN = 450;
      var li = 0, n = 0, mode = 'type';
      var tick = function () {
        if (!onScreen || covered || document.hidden) { setTimeout(tick, 400); return; }
        var line = lines[li];
        if (mode === 'type') {
          cursor.classList.add('is-typing');
          line.chars[n].classList.add('on');
          n++;
          placeCursor(cursor, line, n);
          if (n < line.chars.length) { setTimeout(tick, TYPE + Math.random() * 35); return; }
          cursor.classList.remove('is-typing');
          if (li < lines.length - 1) { li++; n = 0; placeCursor(cursor, lines[li], 0); setTimeout(tick, BETWEEN); return; }
          mode = 'erase';
          setTimeout(tick, HOLD);
          return;
        }
        /* erase from the last line back to the first */
        cursor.classList.add('is-typing');
        n--;
        line.chars[n].classList.remove('on');
        placeCursor(cursor, line, n);
        if (n > 0) { setTimeout(tick, TYPE + Math.random() * 35); return; }
        if (li > 0) { li--; n = lines[li].chars.length; placeCursor(cursor, lines[li], n); setTimeout(tick, 120); return; }
        mode = 'type';
        cursor.classList.remove('is-typing');
        setTimeout(tick, 700);
      };
      placeCursor(cursor, lines[0], 0);
      setTimeout(tick, 300);
    }

    /* EVT 06 headline: types once when the section arrives */
    function typeOnce(lines) {
      var cursor = makeCursor();
      var li = 0, n = 0;
      placeCursor(cursor, lines[0], 0);
      var tick = function () {
        var line = lines[li];
        cursor.classList.add('is-typing');
        line.chars[n].classList.add('on');
        n++;
        placeCursor(cursor, line, n);
        if (n < line.chars.length) { setTimeout(tick, 60 + Math.random() * 40); return; }
        if (li < lines.length - 1) { li++; n = 0; placeCursor(cursor, lines[li], 0); setTimeout(tick, 260); return; }
        cursor.classList.remove('is-typing');
      };
      setTimeout(tick, 200);
    }

    /* EVT 00 to 01: hero holds while the mustard band slides over it */
    var hero = $('.hero');
    /* Desktop only: below 1001px the header is position: fixed inside the hero, and the
       transform ScrollTrigger leaves on a pinned element would carry the header away with it. */
    if (hero && window.innerWidth > 1000) {
      ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
    } else if (hero) {
      /* Phone/tablet: CSS sticky does the hold. A sticky hero is its own stacking context,
         so the fixed header must live outside it or the mustard band would cover it. */
      var header = $('[data-header]', hero);
      if (header) hero.parentNode.parentNode.insertBefore(header, hero.parentNode);
      var setStick = function () { root.style.setProperty('--hero-stick', Math.min(0, window.innerHeight - hero.offsetHeight) + 'px'); };
      setStick();
      window.addEventListener('resize', setStick);
      ScrollTrigger.addEventListener('refreshInit', setStick);
      root.classList.add('hero-hold');
      /* The pinned EVT 01 strip hands off to the rising band: its label fades over the
         strip's own height so the band never slices through the text. */
      var peekLabel = $('.band-peek .wrap', hero);
      var band = $('#evt-01');
      if (peekLabel && band) {
        gsap.to(peekLabel, { opacity: 0, ease: 'none',
          scrollTrigger: { trigger: band, start: 'top bottom', end: 'top bottom-=56', scrub: true } });
      }
    }

    /* EVT 01: manifesto stays static by design (no scroll effect on the text) */

    /* Generic staggers */
    $$('[data-stagger]').forEach(function (group) {
      gsap.from(group.children, {
        opacity: 0, y: 24, duration: 0.7, stagger: 0.07, ease: ease,
        scrollTrigger: { trigger: group, start: 'top 82%', once: true }
      });
    });

    /* EVT 02: write-up feature and rows */
    if (has('.feature')) gsap.from('.feature', { opacity: 0, y: 32, duration: 0.8, ease: ease, scrollTrigger: { trigger: '.feature', start: 'top 85%', once: true } });
    $$('.wu-rows li').forEach(function (li) {
      gsap.from(li, { opacity: 0, x: -24, duration: 0.6, ease: ease, scrollTrigger: { trigger: li, start: 'top 90%', once: true } });
    });

    /* EVT 03: rows slide in; the big count stays as written */
    $$('[data-cert-list] .cert-row').forEach(function (row) {
      gsap.from(row, { opacity: 0, x: -24, duration: 0.5, ease: ease, scrollTrigger: { trigger: row, start: 'top 88%', once: true } });
    });

    /* EVT 05: skill lines drift with scroll, alternating direction (all widths).
       Preferred path is the CSS scroll-driven animation in styles.css (compositor, locked to
       native scroll); JS only measures each line's travel. Older browsers get GSAP with a
       direct scrub (no smoothing lag). */
    var drifts = $$('[data-drift]');
    var driftDistance = function (line) { return Math.max(0, line.scrollWidth - line.parentElement.clientWidth) + 24; };
    if (window.CSS && CSS.supports('animation-timeline: view()')) {
      var setDrift = function () { drifts.forEach(function (line) { line.style.setProperty('--drift', driftDistance(line) + 'px'); }); };
      setDrift();
      window.addEventListener('resize', setDrift);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(setDrift);
    } else {
      drifts.forEach(function (line) {
        var dir = line.getAttribute('data-drift');
        gsap.fromTo(line,
          { x: function () { return dir === 'left' ? 0 : -driftDistance(line); } },
          { x: function () { return dir === 'left' ? -driftDistance(line) : 0; }, ease: 'none',
            scrollTrigger: { trigger: line.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
      });
    }

    /* EVT 05: timeline rule draws; entries light as it reaches them */
    var timeline = $('[data-timeline]');
    if (timeline) {
      var fill = $('[data-timeline-fill]');
      var entries = $$('[data-entry]', timeline);
      entries.forEach(function (e, i) { if (i > 0) e.classList.add('is-dim'); });
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: timeline, start: 'top 65%', end: 'bottom 65%', scrub: true }
      });
      entries.forEach(function (e) {
        ScrollTrigger.create({
          trigger: e, start: 'top 65%',
          onEnter: function () { e.classList.remove('is-dim'); },
          onLeaveBack: function () { if (e !== entries[0]) e.classList.add('is-dim'); }
        });
      });
    }

    /* EVT 06: heading types, profiles print */
    if ($('.contact')) {
      if (headTyped.length) ScrollTrigger.create({ trigger: '.contact', start: 'top 60%', once: true, onEnter: function () { typeOnce(headTyped); } });
      gsap.from('[data-profiles] .profile', { opacity: 0, x: -16, duration: 0.5, stagger: 0.08, ease: ease, scrollTrigger: { trigger: '[data-profiles]', start: 'top 80%', once: true } });
    }

    /* Buttons: a short magnetic pull toward the pointer, label leads slightly,
       arrow nudges right; press scales down. Fine pointers only. */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.btn').forEach(function (btn) {
        var label = $('.btn-label', btn);
        var arrow = $('.btn-arrow', btn);
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
        var lx = label ? gsap.quickTo(label, 'x', { duration: 0.4, ease: 'power3.out' }) : null;
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          xTo(dx * 0.12); yTo(dy * 0.22);
          if (lx) lx(dx * 0.06);
        });
        btn.addEventListener('pointerenter', function () { if (arrow) gsap.to(arrow, { x: 4, duration: 0.25, ease: 'power3.out' }); });
        btn.addEventListener('pointerleave', function () {
          xTo(0); yTo(0); if (lx) lx(0);
          if (arrow) gsap.to(arrow, { x: 0, duration: 0.3, ease: 'power3.out' });
          gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power3.out' });
        });
        btn.addEventListener('pointerdown', function () { gsap.to(btn, { scale: 0.96, duration: 0.12, ease: 'power2.out' }); });
        btn.addEventListener('pointerup', function () { gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power3.out' }); });
      });
    }

    /* Touch screens have no hover, so the main CTA (one per view) gets a short nudge
       when it scrolls into view: a small lift, the arrow slides out and back, twice.
       It replays each time the button comes back into view and stops when tapped. */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.btn-primary, .contact .btn-mustard').forEach(function (btn) {
        var arrow = $('.btn-arrow', btn);
        var tl = gsap.timeline({ paused: true, delay: 0.5, repeat: 1, repeatDelay: 1.4 })
          .to(btn, { scale: 1.04, duration: 0.18, ease: 'power2.out' })
          .to(btn, { scale: 1, duration: 0.5, ease: 'power3.out' });
        if (arrow) {
          tl.to(arrow, { x: 6, duration: 0.18, ease: 'power2.out' }, 0)
            .to(arrow, { x: 0, duration: 0.5, ease: 'power3.out' }, 0.18);
        }
        /* once per page view: a cue, not a nag */
        ScrollTrigger.create({ trigger: btn, start: 'top 90%', once: true, onEnter: function () { tl.restart(true); } });
        /* press feedback (CSS :active can't apply once GSAP owns the transform) */
        btn.addEventListener('pointerdown', function () {
          tl.progress(1).pause();
          gsap.to(btn, { scale: 0.97, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
        });
        var release = function () { gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power3.out', overwrite: 'auto' }); };
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
      });
    }

    /* Write-up pages: reading progress, build timeline, sections */
    var progress = $('[data-progress]');
    if (progress) {
      gsap.to(progress, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true } });
    }
    var stepsLine = $('[data-steps-line]');
    if (stepsLine) {
      gsap.fromTo(stepsLine, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: stepsLine.parentElement, start: 'top 70%', end: 'bottom 60%', scrub: true } });
    }
    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 24, duration: 0.7, ease: ease, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    /* Arriving with a hash (e.g. back from a write-up to #evt-02): the browser jumps
       before pins exist, so re-scroll once ScrollTrigger has measured the page. */
    var settleHash = function () {
      ScrollTrigger.refresh();
      if (!location.hash || location.hash.length < 2) return;
      var t = document.getElementById(location.hash.slice(1));
      if (!t) return;
      if (lenis) lenis.scrollTo(t, { immediate: true, force: true, offset: -headerOffset() });
      else t.scrollIntoView();
    };
    window.addEventListener('load', settleHash);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    /* Back/forward cache restores keep stale measurements; refresh them. */
    window.addEventListener('pageshow', function (e) { if (e.persisted) settleHash(); });

    window.__portfolio = { lenis: lenis, triggers: function () { return ScrollTrigger.getAll().length; } };
    return lenis;
  }

  function start() {
    initMenu();
    initFilters();
    initCopy();
    initRail();
    initMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
