#!/usr/bin/env node
/**
 * mantine-css.mjs [--write | --check] -- the Mantine CSS this site renders, and only that.
 *
 * `@mantine/core/styles.css` carries every component Mantine has, about 280 KB
 * of render-blocking CSS on every page, of which Chrome's coverage had a page on
 * lancetta.app using 11-13% (2026-10-11; the four app sites share this script).
 * It keeps the part the site renders:
 *
 * 1. every name imported from '@mantine/core' anywhere in the site's own code,
 *    and in every dependency that itself imports '@mantine/core' (the
 *    @gfazioli/mantine-* extensions);
 * 2. each name resolved through Mantine's own ESM index to its module, and that
 *    module's relative imports followed, so a Button brings UnstyledButton and
 *    Loader with it;
 * 3. the rules of `styles.css` that belong to no component (Mantine's
 *    variables, baseline and global rules), plus those that name a class or a
 *    keyframes of a component reached, in the order `styles.css` has them.
 *
 * Extracted from `styles.css`, NOT imported as `@mantine/core/styles/<C>.css`:
 * in Mantine 9 the per-component sheets are not the same CSS. They carry fixed
 * px where `styles.css` scales with the root font size (Button's
 * `--button-height-xs` is `30px` there and `calc(1.875rem * var(--mantine-scale))`
 * here; 125 uses of `--mantine-scale` across all of them against 701), so a
 * visitor whose browser's default font size is not 16px would get buttons and
 * badges that stop growing with their text. Found in review, 2026-10-11.
 *
 * `--write` regenerates `theme/mantine.css`; `--check` (and the Jest test that
 * runs it) fails when it is not what this script would write. The script
 * fails outright when it cannot read Mantine's index, meets an import of all
 * of @mantine/core at once (`import * as`, `export *`), or cannot resolve a name
 * that is a component.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORE = join(ROOT, 'node_modules/@mantine/core');
const OUT = join(ROOT, 'theme/mantine.css');
const CODE = /\.(ts|tsx|js|jsx|mjs|mdx)$/;
// Hidden folders (.next, .git, .vercel, .claude...) are skipped by name, so the result never depends on
// what one clone holds that another does not.
const SKIP_DIRS = new Set([
  'node_modules',
  'public',
  'out',
  'coverage',
  'storybook-static',
  'scripts',
  'test-utils',
]);
const TOKEN = /m_[0-9a-f]{6,8}\b/g;

function fail(message) {
  console.error(`mantine-css: ${message}`);
  process.exit(1);
}

/** Every code file under `dir`, tests and stories left out. */
function codeFiles(dir, skip = SKIP_DIRS) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skip.has(entry.name) && !entry.name.startsWith('.')) out.push(...codeFiles(path, skip));
    } else if (CODE.test(entry.name) && !/\.(test|spec|story|stories|d)\.\w+$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

/** Names a file imports or re-exports from '@mantine/core', type-only ones left out. */
function mantineNames(text, file) {
  if (/(?:import|export)\s*\*\s*(?:as\s+\w+\s*)?from\s*['"]@mantine\/core['"]/.test(text)) {
    fail(`${relative(ROOT, file)} takes all of @mantine/core at once: name the components instead`);
  }
  const names = new Set();
  for (const m of text.matchAll(
    /(?:import|export)\s*(type\s+)?(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*['"]@mantine\/core['"]/g
  )) {
    if (m[1]) continue;
    const list = m[2].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const part of list.split(',')) {
      const item = part.trim();
      if (!item || item.startsWith('type ')) continue;
      names.add(item.split(/\s+as\s+/)[0].trim());
    }
  }
  return names;
}

// 1. The names used: the site's code, and every dependency that renders Mantine.
const used = new Set();
for (const f of codeFiles(ROOT))
  for (const n of mantineNames(readFileSync(f, 'utf8'), f)) used.add(n);
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
for (const dep of Object.keys(pkg.dependencies ?? {})) {
  // Core and hooks are what is being read; any other @mantine package renders core components.
  if (dep === '@mantine/core' || dep === '@mantine/hooks') continue;
  const dir = join(ROOT, 'node_modules', dep);
  const meta = existsSync(join(dir, 'package.json'))
    ? JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    : {};
  const wants = { ...meta.dependencies, ...meta.peerDependencies };
  if (!('@mantine/core' in wants)) continue;
  let found = 0;
  for (const f of codeFiles(dir, new Set(['node_modules', 'cjs', 'src', 'types']))) {
    for (const n of mantineNames(readFileSync(f, 'utf8'), f)) {
      used.add(n);
      found += 1;
    }
  }
  // A package that wants @mantine/core and yields no name is one this scan cannot
  // read (a CommonJS-only build, a bundle that requires it): its components would
  // be left out without a word.
  if (found === 0)
    fail(`${dep} depends on @mantine/core, but no import of it was found in its files`);
}

// 2. Name -> module, from Mantine's own ESM index (it imports every name from
// its module, then exports them all at once), and the components reached.
const exported = new Map();
for (const m of readFileSync(join(CORE, 'esm/index.mjs'), 'utf8').matchAll(
  /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g
)) {
  for (const part of m[1].split(',')) {
    const [orig, alias] = part.trim().split(/\s+as\s+/);
    if (orig) exported.set((alias ?? orig).trim(), join(CORE, 'esm', m[2]));
  }
}
if (exported.size < 100)
  fail(`read only ${exported.size} names from @mantine/core's esm/index.mjs: its format changed`);

const components = join(CORE, 'esm/components');
const sheet = (c) => join(CORE, 'styles', `${c}.css`);
const reached = new Set();
const seen = new Set();
function walk(mod) {
  if (seen.has(mod) || !existsSync(mod)) return;
  seen.add(mod);
  const rel = relative(components, mod);
  // `sep`, not '/': on Windows `relative()` answers `Button\Button.mjs`.
  if (!rel.startsWith('..')) reached.add(rel.split(sep)[0]);
  for (const m of readFileSync(mod, 'utf8').matchAll(/from\s*["'](\.{1,2}\/[^"']+\.mjs)["']/g)) {
    const next = resolve(dirname(mod), m[1]);
    if (!relative(components, next).startsWith('..')) walk(next);
  }
}
for (const name of used) {
  const mod = exported.get(name);
  if (mod) walk(mod);
  else if (existsSync(sheet(name)))
    fail(`${name} is a Mantine component, but @mantine/core's index does not resolve it`);
}

// 3. The tokens (class and keyframes names) of every component, and of those reached.
const GLOBAL = new Set(['baseline', 'default-css-variables', 'global']);
const allTokens = new Set();
const neededTokens = new Set();
for (const f of readdirSync(join(CORE, 'styles'))) {
  if (!f.endsWith('.css') || f.endsWith('.layer.css')) continue;
  const c = f.slice(0, -4);
  if (GLOBAL.has(c)) continue;
  const tokens = readFileSync(sheet(c), 'utf8').match(TOKEN) ?? [];
  for (const t of tokens) {
    allTokens.add(t);
    if (reached.has(c)) neededTokens.add(t);
  }
}

const root = postcss.parse(readFileSync(join(CORE, 'styles.css'), 'utf8'));
/** True when a node belongs to a component the site does not render. */
function unused(text) {
  const tokens = (text.match(TOKEN) ?? []).filter((t) => allTokens.has(t));
  return tokens.length > 0 && !tokens.some((t) => neededTokens.has(t));
}
root.walk((node) => {
  if (node.type === 'comment') node.remove();
  else if (node.type === 'rule' && unused(node.selector)) node.remove();
  else if (node.type === 'atrule' && node.name === 'keyframes' && unused(node.params))
    node.remove();
});
// An at-rule left with nothing in it goes too, and so does one emptied by that.
for (let removed = true; removed;) {
  removed = false;
  root.walk((node) => {
    if (node.type === 'atrule' && node.nodes && node.nodes.length === 0) {
      node.remove();
      removed = true;
    }
  });
}

const kept = [...reached].filter((c) => existsSync(sheet(c))).sort();
const text = `/*
 * GENERATED by \`node scripts/mantine-css.mjs --write\`: do not edit by hand.
 * The rules of @mantine/core/styles.css that this site renders: Mantine's
 * variables, baseline and global rules, and ${kept.length} components
 * (${kept.join(', ')}).
 * The script says how the list is worked out, and why the rules come from
 * styles.css rather than the per-component sheets.
 */
${root.toString().trim()}
`;

const mode = process.argv[2];
if (mode === '--write') {
  writeFileSync(OUT, text);
  console.log(
    `theme/mantine.css: ${kept.length} components, ${text.length} bytes (styles.css is ${statSync(join(CORE, 'styles.css')).size})`
  );
} else if (mode === '--check') {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== text)
    fail('theme/mantine.css is out of date: run `node scripts/mantine-css.mjs --write`');
  console.log(`theme/mantine.css is current: ${kept.length} components`);
} else {
  console.log(
    JSON.stringify(
      { used: [...used].sort(), reached: [...reached].sort(), components: kept },
      null,
      1
    )
  );
}
