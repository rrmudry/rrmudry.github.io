(function () {
  const includeAttr = 'include';
  const includeSelector = `[data-${includeAttr}]`;
  const basePath = 'partials/';

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
    const url = `${basePath}${target}.html`;

    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.status}`);
      }
      const html = await response.text();
      el.innerHTML = html;
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
