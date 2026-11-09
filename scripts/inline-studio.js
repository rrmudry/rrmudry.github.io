#!/usr/bin/env node
// Builds a studio's index.html from its src.html by inlining local stylesheets and scripts.
// GitHub Pages sometimes 404s a studio's separate js/ files right after a deploy, which leaves students with a blank
// page, so the deployed page carries everything inline (see commit f6a036c2). External URLs (Firebase, Desmos, fonts)
// and deferred helpers are left as they are.
//
// Usage: node scripts/inline-studio.js Unit_2/centripetal_workshop
//   reads  <folder>/src.html, writes <folder>/index.html
// or:    node scripts/inline-studio.js admin/centripetal_workshop_monitor.src.html
//   reads  that file, writes the same name without ".src" (admin/centripetal_workshop_monitor.html)

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const target = path.resolve(repo, process.argv[2] || '');
const single = target.endsWith('.src.html');
const folder = single ? path.dirname(target) : target;
const srcFile = single ? target : path.join(folder, 'src.html');
const outFile = single ? target.replace(/\.src\.html$/, '.html') : path.join(folder, 'index.html');
if (!process.argv[2] || !fs.existsSync(srcFile)) {
  console.error('Usage: node scripts/inline-studio.js <studio folder containing src.html | file.src.html>');
  process.exit(1);
}

const isLocal = href => !/^(https?:)?\/\//.test(href) && !href.startsWith('data:');
const rel = file => path.relative(repo, file).split(path.sep).join('/');
const read = href => {
  const file = path.resolve(folder, href);
  if (!fs.existsSync(file)) throw new Error(`Missing file referenced by src.html: ${href}`);
  return { file, body: fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script') };
};

let html = fs.readFileSync(srcFile, 'utf8');
let count = 0;

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  if (!isLocal(href)) return m;
  const { file, body } = read(href);
  count++;
  return `<style>\n/* === ${rel(file)} === */\n${body}</style>`;
});

// Consecutive local scripts become one inline block, in the same order
html = html.replace(/(?:[ \t]*<script src="([^"]+)"><\/script>\s*)+/g, block => {
  const srcs = [...block.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  if (!srcs.every(isLocal)) return block;
  const parts = srcs.map(href => {
    const { file, body } = read(href);
    count++;
    return `// === ${rel(file)} ===\n${body}`;
  });
  return `  <script>\n${parts.join('\n')}\n</script>\n`;
});

html = html.replace(/\n\s*<!-- Source page\.[^\n]*-->/, `\n  <!-- Built from ${path.basename(srcFile)} by scripts/inline-studio.js. Edit the source files, not this page. -->`);
fs.writeFileSync(outFile, html);
console.log(`Wrote ${rel(outFile)} with ${count} files inlined.`);
