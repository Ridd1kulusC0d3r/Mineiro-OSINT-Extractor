import fs from 'node:fs';
import path from 'node:path';
import { validateDeclarativeDetector, type DeclarativeDetector } from '../src/core/matchers';

const DIR = path.join(process.cwd(), 'registry', 'detectors');

export function loadDeclarativeDetectors(dir = DIR): { detectors: Map<string, DeclarativeDetector>; errors: string[] } {
  const detectors = new Map<string, DeclarativeDetector>();
  const errors: string[] = [];
  if (!fs.existsSync(dir)) return { detectors, errors };

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      for (const item of parsed.detectors ?? []) {
        const problems = validateDeclarativeDetector(item);
        if (problems.length) errors.push(...problems.map((p) => `${file}: ${p}`));
        else detectors.set(item.id, item);
      }
    } catch (err) {
      errors.push(`${file}: ${(err as Error).message}`);
    }
  }
  return { detectors, errors };
}

export const DECLARATIVE_DETECTORS = (() => {
  const { detectors, errors } = loadDeclarativeDetectors();
  errors.forEach((e) => console.warn(`[detectors] ${e}`));
  return detectors;
})();
