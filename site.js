/* ============================================================
   Charles Wyatt Portfolio | shared client JS
   ============================================================ */

// ---- Reveal on scroll ----
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
})();

// ---- Skill bars: fill on visibility ----
(function () {
  const fills = document.querySelectorAll('.skill-fill');
  if (!fills.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const lvl = e.target.dataset.level || '0';
        // small delay so it's noticed
        setTimeout(() => { e.target.style.width = lvl + '%'; }, 120);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  fills.forEach((f) => io.observe(f));
})();

// ---- Active nav link on scroll ----
(function () {
  const links = document.querySelectorAll('[data-nav-anchor]');
  if (!links.length) return;
  const sections = Array.from(links)
    .map((l) => document.getElementById(l.dataset.navAnchor))
    .filter(Boolean);
  if (!sections.length) return;

  const onScroll = () => {
    let active = sections[0]?.id;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= 120) active = s.id;
    }
    links.forEach((l) => {
      l.classList.toggle('active', l.dataset.navAnchor === active);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Mobile drawer ----
(function () {
  const burger = document.querySelector('.nav-hamburger');
  const drawer = document.querySelector('.mobile-drawer');
  if (!burger || !drawer) return;
  const toggle = () => {
    burger.classList.toggle('open');
    drawer.classList.toggle('open');
  };
  burger.addEventListener('click', toggle);
  drawer.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      drawer.classList.remove('open');
    })
  );
})();

// ---- Generic filter (data-filter-group on container, data-filter on btn, data-cat on items) ----
(function () {
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const target = document.querySelector(group.dataset.filterGroup);
    if (!target) return;
    const items = target.querySelectorAll('[data-cat]');
    group.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.filter;
        group.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
        items.forEach((it) => {
          const cats = (it.dataset.cat || '').split(' ');
          it.style.display = v === 'ALL' || cats.includes(v) ? '' : 'none';
        });
      });
    });
  });
})();

// ---- Contact form: simulated submit + toast ----
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const toast = document.getElementById('toast');
  const btn = form.querySelector('button[type="submit"]');
  const btnCmd = btn ? btn.querySelector('.cmd') : null;
  const btnArg = btn ? btn.querySelector('.arg') : null;
  const origCmd = btnCmd ? btnCmd.textContent : '';
  const origArg = btnArg ? btnArg.textContent : '';

  const showToast = (msg, kind) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('err');
    if (kind === 'err') toast.classList.add('err');
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2800);
  };

  const resetBtn = () => {
    if (btn) btn.disabled = false;
    if (btnCmd) btnCmd.textContent = origCmd;
    if (btnArg) btnArg.textContent = origArg;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (!fd.get('name') || !fd.get('email') || !fd.get('message')) {
      showToast('ERR: ALL FIELDS REQUIRED', 'err');
      return;
    }
    const key = fd.get('access_key');
    if (!key || String(key).startsWith('REPLACE_WITH_')) {
      showToast('ERR: FORM NOT CONFIGURED', 'err');
      return;
    }
    if (btn) btn.disabled = true;
    if (btnCmd) btnCmd.textContent = './sending';
    if (btnArg) btnArg.textContent = ' ...';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        form.reset();
        showToast('TRANSMISSION RECEIVED. STAND BY');
      } else {
        showToast('ERR: TRANSMISSION FAILED', 'err');
      }
    } catch {
      showToast('ERR: NETWORK UNREACHABLE', 'err');
    } finally {
      resetBtn();
    }
  });
})();
