// Fails fast if the active Node version is below `engines.node` in
// package.json. engine-strict in .npmrc only covers `npm install`; this covers
// scripts like `npm test` where a stale node_modules can hide the mismatch
// until jsdom throws an opaque ERR_REQUIRE_ESM mid-run.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
const required = JSON.parse(readFileSync(pkgPath, 'utf8')).engines?.node;
if (!required) process.exit(0);

const match = required.match(/(\d+)\.(\d+)/);
if (!match) process.exit(0);

const [reqMajor, reqMinor] = [Number(match[1]), Number(match[2])];
const [major, minor] = process.versions.node.split('.').map(Number);

if (major < reqMajor || (major === reqMajor && minor < reqMinor)) {
  console.error(`\n✖ Node ${required} requis (actuel : ${process.versions.node}).`);
  console.error('  Le repo fournit un .nvmrc — lance « nvm use » (ou équivalent fnm/mise).\n');
  process.exit(1);
}
