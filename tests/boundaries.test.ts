// Import boundaries of the client (docs/REFACTOR_PLAN.md, section 2):
// - the domain and the scan engine are plain TypeScript: no React, no Express, nothing from the UI layers;
// - presentation components never reach into the server;
// - inside src/components, `*.logic.ts` (pure computation, unit-tested) and `*.render.ts` (imperative D3 drawing)
//   are React-free: no React, no UI kit, no component (.tsx), hook or app module. Logic files also touch no DOM.
// Every static import, re-export, dynamic import() and require() is checked, including type-only imports.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const PURE_DIRS = ['core', 'data', 'registry', 'intelligence', 'graph', 'cases', 'scan'];
const FORBIDDEN_PACKAGES = ['react', 'react-dom', 'express'];
/** Packages a React-free component module (`*.logic.ts`, `*.render.ts`) may not import. */
const REACT_PACKAGES = ['react', 'react-dom', 'lucide-react', 'motion', 'framer-motion'];
/** Shared modules those files may import; they must stay React-free themselves. */
const REACT_FREE_SHARED = [path.join(SRC, 'theme', 'palette.ts'), path.join(SRC, 'theme', 'tokens.ts'), path.join(SRC, 'theme', 'theme.ts')];
const UI_DIRS = ['components', 'hooks', 'app'].map((d) => path.join(SRC, d));
const SERVER_DIRS = [path.join(ROOT, 'server'), path.join(ROOT, 'server.ts')];

/**
 * Documented exceptions: `<file relative to the repo>` -> `<specifier>`. Each needs a reason. None today: the check
 * found no violation when it was introduced (Etapa 4).
 */
const EXCEPTIONS: Record<string, string[]> = {};

function filesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx|mts|js|jsx|mjs)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath ?? (entry as unknown as { path: string }).path, entry.name));
}

/** Module specifiers of every import form, comments stripped first. */
export function importSpecifiers(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const specs = new Set<string>();
  const patterns = [
    /\bimport\s+(?:type\s+)?[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/g, // import x from '...', import { a } from '...'
    /\bimport\s*['"]([^'"]+)['"]/g, // side-effect import '...'
    /\bexport\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s*(?:as\s+\w+\s*)?from\s*['"]([^'"]+)['"]/g, // re-exports
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // dynamic import('...')
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // require('...')
  ];
  for (const pattern of patterns) for (const match of code.matchAll(pattern)) specs.add(match[1]);
  return [...specs];
}

const packageName = (spec: string) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
const isInside = (file: string, dirs: string[]) => dirs.some((dir) => file === dir || file.startsWith(`${dir}${path.sep}`) || file.startsWith(`${dir}.`));

function resolveRelative(fromFile: string, spec: string): string | null {
  if (spec.startsWith('.')) return path.resolve(path.dirname(fromFile), spec);
  if (spec.startsWith('@/')) return path.resolve(ROOT, spec.slice(2)); // tsconfig/vite alias: '@' is the repo root
  return null;
}

interface Violation { file: string; spec: string; rule: string }

function check(files: string[], forbid: (spec: string, resolved: string | null) => string | null): Violation[] {
  const out: Violation[] = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    for (const spec of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
      const rule = forbid(spec, resolveRelative(file, spec));
      if (rule && !(EXCEPTIONS[rel] || []).includes(spec)) out.push({ file: rel, spec, rule });
    }
  }
  return out;
}

const format = (violations: Violation[]) => violations.map((v) => `${v.file}: '${v.spec}' (${v.rule})`).join('\n');

describe('import boundaries', () => {
  it('finds the import forms it checks', () => {
    const specs = importSpecifiers([
      "import React from 'react';",
      "import type { X } from '../components/X';",
      "import {\n  a,\n  b,\n} from 'express';",
      "import './side-effect.css';",
      "export * from '../hooks/useScan';",
      "export { y } from 'react-dom/client';",
      "const m = await import('../app/App');",
      "const e = require('express');",
      "// import nope from 'commented-out';",
    ].join('\n'));
    expect(specs.sort()).toEqual(['../app/App', '../components/X', '../hooks/useScan', './side-effect.css', 'express', 'react', 'react-dom/client'].sort());
  });

  it(`pure modules (${PURE_DIRS.map((d) => `src/${d}`).join(', ')}) import no React, Express or UI layer`, () => {
    const files = PURE_DIRS.flatMap((d) => filesUnder(path.join(SRC, d)));
    expect(files.length).toBeGreaterThan(20);
    const violations = check(files, (spec, resolved) => {
      if (FORBIDDEN_PACKAGES.includes(packageName(spec))) return `package ${packageName(spec)}`;
      if (resolved && isInside(resolved, UI_DIRS)) return 'UI layer (components, hooks, app)';
      return null;
    });
    expect(violations, format(violations)).toEqual([]);
  });

  it('components never import from server/', () => {
    const files = filesUnder(path.join(SRC, 'components'));
    expect(files.length).toBeGreaterThan(20);
    const violations = check(files, (_spec, resolved) => (resolved && isInside(resolved, SERVER_DIRS) ? 'server code' : null));
    expect(violations, format(violations)).toEqual([]);
  });

  it('component logic (*.logic.ts) and D3 render (*.render.ts) modules are React-free', () => {
    const files = filesUnder(path.join(SRC, 'components')).filter((f) => /\.(logic|render)\.ts$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    const violations = check(files, (spec, resolved) => {
      if (REACT_PACKAGES.includes(packageName(spec))) return `package ${packageName(spec)}`;
      if (resolved && isInside(resolved, ['hooks', 'app'].map((d) => path.join(SRC, d)))) return 'UI layer (hooks, app)';
      if (resolved && (resolved.endsWith('.tsx') || fs.existsSync(`${resolved}.tsx`))) return 'React component (.tsx)';
      if (resolved && resolved.startsWith(path.join(SRC, 'theme')) && !REACT_FREE_SHARED.some((f) => f === resolved || f === `${resolved}.ts`)) {
        return 'theme module outside the React-free list';
      }
      return null;
    });
    for (const file of files.filter((f) => f.endsWith('.logic.ts'))) {
      const code = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
      if (/\b(document|window|getComputedStyle|ResizeObserver)\b/.test(code)) {
        violations.push({ file: path.relative(ROOT, file), spec: '(DOM global)', rule: 'logic modules touch no DOM' });
      }
    }
    expect(violations, format(violations)).toEqual([]);
  });

  it('the shared theme modules that logic files import stay React-free', () => {
    const violations = check(REACT_FREE_SHARED, (spec) => (REACT_PACKAGES.includes(packageName(spec)) ? `package ${packageName(spec)}` : null));
    expect(violations, format(violations)).toEqual([]);
  });

  it('every documented exception still exists (remove it when the violation is gone)', () => {
    for (const [file, specs] of Object.entries(EXCEPTIONS)) {
      const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
      for (const spec of specs) expect(importSpecifiers(source), `${file} no longer imports ${spec}`).toContain(spec);
    }
  });
});
