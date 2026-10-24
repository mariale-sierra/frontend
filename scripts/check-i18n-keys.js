#!/usr/bin/env node
/**
 * Compares the keys of i18n/resources/en.ts and es.ts (nested keys included,
 * as dotted paths to every leaf) and reports what is missing on each side.
 *
 *   npm run i18n:check            -> human-readable report, exit 1 on drift
 *   npm run i18n:check -- --json  -> the same report as JSON
 *
 * The files are transpiled with the project's own TypeScript (no extra
 * dependency) and evaluated in isolation, so the comparison is on the real
 * objects, not on line counts: the two files differ in length because of
 * comments and wrapped strings, which says nothing about their keys.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const RESOURCES = path.join(ROOT, 'i18n', 'resources');

function loadResource(name) {
  const file = path.join(RESOURCES, `${name}.ts`);
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports, require: () => ({}) }, { filename: file });
  return { file, value: module.exports.default ?? module.exports, lines: source.split('\n').length };
}

/** Dotted paths of every leaf; a non-string leaf or an empty string is reported too. */
function collectLeaves(node, prefix = '', out = new Map()) {
  if (node === null || typeof node !== 'object') {
    out.set(prefix, node);
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    collectLeaves(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

function compare() {
  const en = loadResource('en');
  const es = loadResource('es');
  const enLeaves = collectLeaves(en.value);
  const esLeaves = collectLeaves(es.value);

  const missingInEs = [...enLeaves.keys()].filter((k) => !esLeaves.has(k)).sort();
  const missingInEn = [...esLeaves.keys()].filter((k) => !enLeaves.has(k)).sort();
  const empty = [
    ...[...enLeaves].filter(([, v]) => v === '').map(([k]) => `en:${k}`),
    ...[...esLeaves].filter(([, v]) => v === '').map(([k]) => `es:${k}`),
  ];

  return {
    en: { keys: enLeaves.size, lines: en.lines },
    es: { keys: esLeaves.size, lines: es.lines },
    // "Sobrantes" in es = keys es has that en does not; same as missingInEn.
    missingInEs,
    missingInEn,
    empty,
    ok: missingInEs.length === 0 && missingInEn.length === 0 && empty.length === 0,
  };
}

if (require.main === module) {
  const report = compare();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`en.ts: ${report.en.keys} keys (${report.en.lines} lines)`);
    console.log(`es.ts: ${report.es.keys} keys (${report.es.lines} lines)`);
    console.log(`Missing in es.ts (extra in en.ts): ${report.missingInEs.length}`);
    report.missingInEs.forEach((k) => console.log(`  - ${k}`));
    console.log(`Missing in en.ts (extra in es.ts): ${report.missingInEn.length}`);
    report.missingInEn.forEach((k) => console.log(`  - ${k}`));
    console.log(`Empty values: ${report.empty.length}`);
    report.empty.forEach((k) => console.log(`  - ${k}`));
    console.log(report.ok ? 'OK: both files have the same keys.' : 'DRIFT: the files do not have the same keys.');
  }
  process.exit(report.ok ? 0 : 1);
}

module.exports = { compare, collectLeaves };
