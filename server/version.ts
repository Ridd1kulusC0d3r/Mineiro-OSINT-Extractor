// The product version has one source: package.json. esbuild inlines it into dist/server.cjs and the pip bundle,
// so the built server does not read package.json at runtime. scripts/check-version.mjs fails on a hard-coded copy.
import pkg from '../package.json';

export const VERSION: string = pkg.version;
