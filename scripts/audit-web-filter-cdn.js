#!/usr/bin/env node
/**
 * District Web Filter & CDN Vulnerability Auditor
 * 
 * Scans all HTML and JS files across the workspace for CDN dependencies
 * (specifically unpkg.com and in-browser @babel/standalone) that are frequently
 * blocked by school district firewalls (Securly, Blocksi, GoGuardian).
 * 
 * Usage:
 *   node scripts/audit-web-filter-cdn.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORED_DIRS = new Set(['node_modules', '.git', '.gemini', 'scratch', 'dist']);

const findings = {
  inBrowserBabel: [],
  unpkgDependencies: []
};

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDir(path.join(dir, entry.name));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
      scanFile(path.join(dir, entry.name));
    }
  }
}

function scanFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  // Skip vendor / phetsims third-party folders and auditor itself
  if (relativePath === 'scripts/audit-web-filter-cdn.js') return;
  if (relativePath.startsWith('phetsims_tools/')) return;
  if (relativePath.includes('assets/vendor/')) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Check for in-browser Babel
    if (trimmed.includes('@babel/standalone') || trimmed.includes('type="text/babel"')) {
      findings.inBrowserBabel.push({
        file: relativePath,
        line: lineNum,
        content: trimmed.substring(0, 100)
      });
    }

    // Check for unpkg.com
    if (trimmed.includes('unpkg.com')) {
      findings.unpkgDependencies.push({
        file: relativePath,
        line: lineNum,
        content: trimmed.substring(0, 100)
      });
    }
  });
}

scanDir(ROOT_DIR);

console.log('\n=================================================================');
console.log('🛡️  DISTRICT WEB FILTER CDN AUDIT REPORT');
console.log('=================================================================');

if (findings.inBrowserBabel.length === 0 && findings.unpkgDependencies.length === 0) {
  console.log('✅ ALL CLEAR: Zero unpkg.com and zero in-browser Babel dependencies detected!');
  process.exit(0);
}

if (findings.inBrowserBabel.length > 0) {
  console.log(`\n🚨 HIGH RISK: In-Browser Babel Transpilation (${findings.inBrowserBabel.length} instances)`);
  console.log('   These pages will crash and render completely blank if unpkg is blocked:');
  const seenFiles = new Set();
  findings.inBrowserBabel.forEach(f => {
    if (!seenFiles.has(f.file)) {
      seenFiles.add(f.file);
      console.log(`   - ${f.file} (Line ${f.line})`);
    }
  });
}

if (findings.unpkgDependencies.length > 0) {
  console.log(`\n⚠️  MEDIUM RISK: Dependencies loaded from unpkg.com (${findings.unpkgDependencies.length} instances)`);
  console.log('   District filters may drop unpkg packets, causing missing icons or scripts:');
  const seenFiles = new Set();
  findings.unpkgDependencies.forEach(f => {
    if (!seenFiles.has(f.file)) {
      seenFiles.add(f.file);
      console.log(`   - ${f.file} (Line ${f.line})`);
    }
  });
}

console.log('\n=================================================================');
console.log('📋 REMEDIATION GUIDELINES:');
console.log('1. Convert in-browser Babel pages to native Vanilla JS (zero dependencies).');
console.log('2. Replace unpkg.com with local vendoring in assets/vendor/ or jsdelivr CDN.');
console.log('=================================================================\n');
