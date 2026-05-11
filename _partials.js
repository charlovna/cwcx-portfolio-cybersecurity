/* ============================================================
   Shared markup partials — navbar + footer
   Injected at page load so we don't duplicate across files.
   ============================================================ */

const NAV_HTML = `
<nav class="navbar">
  <div class="nav-inner">
    <a class="nav-logo" href="#home">cwcx://</a>
    <div class="nav-links">
      <a href="#about"          data-nav-anchor="about">./about</a>
      <a href="#write-ups"      data-nav-anchor="write-ups">./write-ups</a>
      <a href="#experience"     data-nav-anchor="experience">./experience</a>
      <a href="#certifications" data-nav-anchor="certifications">./certifications</a>
      <a href="#skills"         data-nav-anchor="skills">./skills</a>
      <a href="#contact"        data-nav-anchor="contact">./contact</a>
    </div>
    <div class="nav-hamburger" aria-label="menu">
      <span></span><span></span><span></span>
    </div>
  </div>
</nav>
<div class="mobile-drawer">
  <a href="#about"          data-nav-anchor="about">./about</a>
  <a href="#write-ups"      data-nav-anchor="write-ups">./write-ups</a>
  <a href="#experience"     data-nav-anchor="experience">./experience</a>
  <a href="#certifications" data-nav-anchor="certifications">./certifications</a>
  <a href="#skills"         data-nav-anchor="skills">./skills</a>
  <a href="#contact"        data-nav-anchor="contact">./contact</a>
</div>
`;

const FOOTER_HTML = `
<footer>
  <div class="footer-inner">
    <div><span class="logo">cwcx://</span> CHARLES WYATT &copy; 2025</div>
    <div class="footer-right">SECURED BY DEFAULT // AI-ASSISTED ANALYSIS</div>
  </div>
</footer>
`;

document.addEventListener('DOMContentLoaded', () => {
  const navMount = document.getElementById('nav-mount');
  if (navMount) navMount.innerHTML = NAV_HTML;
  const footMount = document.getElementById('footer-mount');
  if (footMount) footMount.innerHTML = FOOTER_HTML;
});
