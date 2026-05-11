/* ============================================================
   Shared markup partials — navbar + footer
   Injected at page load so we don't duplicate across files.
   ============================================================ */

const NAV_HTML = `
<nav class="navbar">
  <div class="nav-inner">
    <a class="nav-logo" href="index.html">CW://</a>
    <div class="nav-links">
      <a href="about.html"           data-nav-page="about">/about</a>
      <a href="write-ups.html"        data-nav-page="writeups">/write-ups</a>
      <a href="experience.html"      data-nav-page="experience">/experience</a>
      <a href="certifications.html"  data-nav-page="certifications">/certifications</a>
      <a href="skills.html"           data-nav-page="skills">/skills</a>
      <a href="contact.html"          data-nav-page="contact">/contact</a>
    </div>
    <div class="nav-hamburger" aria-label="menu">
      <span></span><span></span><span></span>
    </div>
  </div>
</nav>
<div class="mobile-drawer">
  <a href="about.html"          data-nav-page="about">/about</a>
  <a href="write-ups.html"       data-nav-page="writeups">/write-ups</a>
  <a href="experience.html"     data-nav-page="experience">/experience</a>
  <a href="certifications.html" data-nav-page="certifications">/certifications</a>
  <a href="skills.html"          data-nav-page="skills">/skills</a>
  <a href="contact.html"         data-nav-page="contact">/contact</a>
</div>
`;

const FOOTER_HTML = `
<footer>
  <div class="footer-inner">
    <div><span class="logo">CW://</span> CHARLES WYATT &copy; 2025</div>
    <div class="footer-right">SECURED BY DEFAULT // AI-ASSISTED ANALYSIS</div>
  </div>
</footer>
`;

document.addEventListener('DOMContentLoaded', () => {
  const base = document.body.dataset.base || '';
  const navMount = document.getElementById('nav-mount');
  if (navMount) navMount.innerHTML = NAV_HTML;
  const footMount = document.getElementById('footer-mount');
  if (footMount) footMount.innerHTML = FOOTER_HTML;

  if (base) {
    document.querySelectorAll('#nav-mount a, .mobile-drawer a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !/^(https?:|#|\/|\.\.\/)/.test(href)) {
        a.setAttribute('href', base + href);
      }
    });
  }

  // Active nav for the current page
  const page = document.body.dataset.page;
  document.querySelectorAll('[data-nav-page]').forEach((l) => {
    if (l.dataset.navPage === page) l.classList.add('active');
  });
});
