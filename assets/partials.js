(function () {
  const includeAttr = 'include';
  const includeSelector = `[data-${includeAttr}]`;
  
  // Calculate relative path to root
  const depth = window.location.pathname.split('/').length - 2;
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

      el.innerHTML =html;
      if (target === 'header') {
        markActiveNav(el);
      }
    } catch (error) {
      console.error(error);
      el.innerHTML = `<div class="include-error">Unable to load ${target}.</div>`;
    }
  }

  async function processPartials() {
    const nodes = document.querySelectorAll(includeSelector);
    await Promise.all(Array.from(nodes, injectPartial));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processPartials);
  } else {
    processPartials();
  }
})();
