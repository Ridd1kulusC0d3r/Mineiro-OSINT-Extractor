// The product version for the browser client, from package.json at build time (Vite inlines only this field).
// scripts/check-version.mjs fails if a client file carries its own copy.
import { version } from '../package.json';

export const APP_VERSION: string = version;
