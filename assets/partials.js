(function () {
  const includeAttr = 'include';
  const includeSelector = `[data-${includeAttr}]`;
  
  // Calculate relative path to root
  const segments = window.location.pathname.split('/').filter(Boolean);
  const lastSeg = segments[segments.length - 1] || '';
  const depth = lastSeg.includes('.') ? Math.max(0, segments.length - 1) : segments.length;
  const rootPath = depth > 0 ? '../'.repeat(depth) : '';
  const partialsDir = `${rootPath}partials/`;

  function normalisePath(path) {
    if (!path) return '';
    const file = path.split('#')[0];
    return file === '' ? 'index.html' : file;
  }

  function markActiveNav(root) {
    if (!root) return;
    const current = normalisePath(window.location.pathname.split('/').pop() || 'index.html');
    root.querySelectorAll('a[href]').forEach((link) => {
      const href = normalisePath(link.getAttribute('href'));
      if (href && href === current) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  async function injectPartial(el) {
    const target = el.dataset[includeAttr];
    if (!target) return;
    const url = `${partialsDir}${target}.html`;

    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.status}`);
      }
      let html = await response.text();
      
      // Rewrite links in partial to be relative to current page
      if (depth > 0) {
        html = html.replace(/(href|src)="([^"]*)"/g, (match, attr, path) => {
          // Skip absolute links, hashes, and root-relative links
          if (path.startsWith('http') || path.startsWith('#') || path.startsWith('/')) {
            return match;
          }
          return `${attr}="${rootPath}${path}"`;
        });
      }

      el.innerHTML = html;
      if (target === 'header') {
        markActiveNav(el);
      }
    } catch (error) {
      console.error(error);
      el.innerHTML = `<div class="include-error">Unable to load ${target}.</div>`;
    }
  }

  function ensureNGSSHelperLoaded() {
    if (window.NGSSHelper) return;
    const script = document.createElement('script');
    script.src = `${rootPath}assets/ngss-helper.js`;
    document.head.appendChild(script);
  }

  // Seasonal theme: only loaded in October (preview any time with ?halloween=on)
  function ensureHalloweenLoaded() {
    if (window.HalloweenPhysics) return;
    if (window.self !== window.top) return;
    const preview = new URLSearchParams(window.location.search).get('halloween');
    const inSeason = preview === 'on' || (preview !== 'off' && new Date().getMonth() === 9);
    if (!inSeason) return;
    if (!document.querySelector('link[href*="halloween.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${rootPath}assets/halloween.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = `${rootPath}assets/halloween.js`;
    script.defer = true;
    document.body.appendChild(script);
  }

  async function processPartials() {
    const nodes = document.querySelectorAll(includeSelector);
    await Promise.all(Array.from(nodes, injectPartial));
    ensureNGSSHelperLoaded();
    ensureHalloweenLoaded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processPartials);
  } else {
    processPartials();
  }
})();
