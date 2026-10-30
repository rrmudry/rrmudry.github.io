#!/usr/bin/env node
/**
 * Firestore Rules Coverage Audit (no credentials needed)
 *
 * Root cause of repeated "works for teacher, students lose work" bugs:
 *   firestore.rules has a global `match /{document=**} { allow read, write: if isAdmin(); }`.
 *   Any NEW collection a webapp writes to silently works for the teacher account
 *   and is DENIED for every student.
 *
 * This script scans every student-facing .html/.js file for `.collection('x')`
 * (and `const X = 'x'` + `.collection(X)`), parses firestore.rules, and FAILS if a
 * collection has no top-level match block granting non-admin access.
 * It also flags writes to admin-only parent docs (student_results/{id}.set()).
 *
 * Usage: node scripts/audit-firestore-rules-coverage.js [--staged]
 *   --staged  only scan files staged in git (used by the pre-commit hook)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'sync-classroom', 'scripts', '.agents', '.agent', 'admin', 'dist', 'Teacher', 'teacher', 'phetsims_tools', 'vendor']);
// Files that are teacher-only tools opt out with this marker comment:
const TEACHER_ONLY_MARKER = 'firestore-audit: teacher-only';
// Collections only ever touched by admin/teacher tools (no student rule needed)
const ADMIN_ONLY_OK = new Set(['notes', 'assignment_registry', 'gradest_assignments', 'students']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js|mjs)$/.test(e.name) && !/\.min\.js$/.test(e.name) && !/teacher|admin/i.test(e.name)) out.push(p);
  }
  return out;
}

function parseRules() {
  const src = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const covered = new Set();
  // match blocks: match /name/{x} or nested subcollections like /parent/{p}/sub/{x}
  const re = /match\s+\/(?:[\w-]+\/\{[^}]+\}\/)*([\w-]+)\/\{[^}]+\}\s*\{([\s\S]*?)\n\s*\}/g;
  for (const m of src.matchAll(re)) {
    const body = m[2];
    // covered if any allow line is not purely isAdmin()
    const allows = [...body.matchAll(/allow\s+[^:]+:\s*if\s+([^;]+);/g)].map((a) => a[1].trim());
    if (allows.some((cond) => cond !== 'isAdmin()')) covered.add(m[1]);
  }
  return covered;
}

let files = walk(ROOT);
if (process.argv.includes('--staged')) {
  const staged = execSync('git diff --cached --name-only --diff-filter=ACM', { cwd: ROOT }).toString().split(/\r?\n/).filter(Boolean).map((f) => path.join(ROOT, f));
  const set = new Set(files);
  files = staged.filter((f) => set.has(f));
}

const covered = parseRules();
const problems = [];
const warnings = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes('collection(') || src.includes(TEACHER_ONLY_MARKER)) continue;
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const consts = {};
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*['"`]([\w-]+)['"`]/g)) consts[m[1]] = m[2];
  for (const m of src.matchAll(/\.collection\(\s*(?:(['"`])([\w-]+)\1|([A-Za-z_$][\w$]*))\s*\)/g)) {
    const name = m[2] || consts[m[3]];
    if (!name || name === 'undefined' || ADMIN_ONLY_OK.has(name) || covered.has(name)) continue;
    problems.push(`${rel}: collection "${name}" has NO student rule in firestore.rules (teacher-only via admin catch-all).`);
  }
  if (/collection\(\s*['"`](student_results|practice_results)['"`]\s*\)\s*\.doc\([^)]*\)\s*\.(set|update)\s*\(/.test(src)) {
    warnings.push(`${rel}: writes PARENT doc student_results/{assignment} (admin-only). OK only if wrapped in its own try/catch or an isTeacher() guard.`);
  }
}

warnings.forEach((w) => console.warn('  ⚠️  ' + w));

const unique = [...new Set(problems)];
if (unique.length) {
  console.error('🚫 Firestore rules coverage FAILED — students would lose work:\n');
  unique.forEach((p) => console.error('  ❌ ' + p));
  console.error('\nFix: add a student-owned match block to firestore.rules, run `firebase deploy --only firestore:rules`,');
  console.error('then `npm run verify -- --id <ASSIGNMENT_ID> --app <folder>` in sync-classroom/.');
  process.exit(1);
}
console.log(`✅ Firestore rules coverage OK (${files.length} files scanned; student-covered: ${[...covered].join(', ')}).`);
