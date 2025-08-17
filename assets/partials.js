document.addEventListener('DOMContentLoaded', () => {
  const includes = document.querySelectorAll('[data-include]');
  includes.forEach(el => {
    const name = el.getAttribute('data-include');
    fetch(`partials/${name}.html`)
      .then(resp => resp.text())
      .then(html => {
        el.outerHTML = html;
        if (name === 'header') {
          const current = window.location.pathname.split('/').pop() || 'index.html';
          document.querySelectorAll('.menu a').forEach(link => {
            if (link.getAttribute('href') === current) {
              link.classList.add('active');
            }
          });
        }
      })
      .catch(err => console.error('Error loading partial', name, err));
  });
});

