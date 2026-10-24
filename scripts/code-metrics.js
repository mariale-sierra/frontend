#!/usr/bin/env node
/**
 * Reproducible counts for the B10 report (Sprint 10): line counts of the
 * large screens, `console.*` calls and `any` in type positions.
 *
 *   node scripts/code-metrics.js           -> table
 *   node scripts/code-metrics.js --json    -> JSON
 *
 * Counting rules (so two runs are comparable):
 * - Scope: app, components, context, hooks, i18n, services, store, types,
 *   utils, validation, constants; .ts/.tsx only; __tests__ folders,
 *   *.test.* files and node_modules are left out.
 * - Lines: newline count of the file, same as `wc -l`.
 * - console: each `console.<method>(` call outside a comment; reported per
 *   method (log/error/warn/info/debug).
 * - any: `any` used as a type (`: any`, `as any`, `<any>`, `any[]`,
 *   `, any` / `any,` inside a generic, `| any`), outside comments and strings.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['app', 'components', 'context', 'hooks', 'i18n', 'services', 'store', 'types', 'utils', 'validation', 'constants'];

const LARGE_SCREENS = [
  'app/(auth)/register.tsx',
  'app/challenge/[id]/routine/[day].tsx',
  'app/messaging/spaces/[id]/index.tsx',
  'app/(add)/camera.tsx',
  'app/challenge/routine/exercises.tsx',
  'app/messaging/[conversationId].tsx',
  'app/(tabs)/index.tsx',
  'app/challenge/[id]/index.tsx',
  'components/home/FeedPostCard.tsx',
  'app/(tabs)/challenges.tsx',
  'app/challenge/routine/select.tsx',
  'app/profile/edit.tsx',
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Blanks comments and string/template contents, keeping line breaks. */
function stripCommentsAndStrings(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
    } else if (c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') out += '\n';
        i++;
      }
      i += 2;
    } else if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += quote;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\') i++;
        else if (source[i] === '\n') out += '\n';
        i++;
      }
      out += quote;
      i++;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

const CONSOLE_RE = /\bconsole\.(log|error|warn|info|debug)\s*\(/g;
const ANY_RE = /(:\s*any\b|\bas\s+any\b|<\s*any\s*[>,\[]|\bany\s*\[\]|,\s*any\s*[>,)\]]|\|\s*any\b)/g;

function count(relPath) {
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const code = stripCommentsAndStrings(source);
  const consoleByMethod = {};
  for (const match of code.matchAll(CONSOLE_RE)) {
    consoleByMethod[match[1]] = (consoleByMethod[match[1]] ?? 0) + 1;
  }
  return {
    lines: (source.match(/\n/g) ?? []).length,
    console: consoleByMethod,
    any: [...code.matchAll(ANY_RE)].length,
  };
}

function collect() {
  const files = DIRS.flatMap((d) => walk(path.join(ROOT, d))).map((f) => path.relative(ROOT, f).split(path.sep).join('/'));
  const totals = { files: files.length, console: {}, consoleTotal: 0, consoleLogError: 0, any: 0 };
  const byFile = {};
  for (const file of files) {
    const result = count(file);
    byFile[file] = result;
    for (const [method, n] of Object.entries(result.console)) {
      totals.console[method] = (totals.console[method] ?? 0) + n;
      totals.consoleTotal += n;
      if (method === 'log' || method === 'error') totals.consoleLogError += n;
    }
    totals.any += result.any;
  }
  const screens = LARGE_SCREENS.map((file) => ({ file, lines: byFile[file]?.lines ?? null }));
  const consoleFiles = Object.entries(byFile)
    .filter(([, r]) => Object.keys(r.console).length > 0)
    .map(([file, r]) => ({ file, ...r.console }));
  const anyFiles = Object.entries(byFile)
    .filter(([, r]) => r.any > 0)
    .map(([file, r]) => ({ file, any: r.any }));
  return { totals, screens, consoleFiles, anyFiles };
}

if (require.main === module) {
  const report = collect();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('Large screens (lines):');
    report.screens.forEach((s) => console.log(`  ${String(s.lines).padStart(5)}  ${s.file}`));
    console.log(`\nFiles scanned: ${report.totals.files}`);
    console.log(`console.* calls: ${report.totals.consoleTotal} (log+error: ${report.totals.consoleLogError}) ${JSON.stringify(report.totals.console)}`);
    report.consoleFiles.forEach((f) => console.log(`  ${f.file} ${JSON.stringify({ ...f, file: undefined })}`));
    console.log(`any (type positions): ${report.totals.any}`);
    report.anyFiles.forEach((f) => console.log(`  ${String(f.any).padStart(3)}  ${f.file}`));
  }
}

module.exports = { collect, stripCommentsAndStrings };
