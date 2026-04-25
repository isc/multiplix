#!/usr/bin/env node
// Génère les splash screens iOS pour la PWA. iOS ignore le manifest pour le
// splash : il faut un PNG par couple (taille CSS × DPR) référencé via
// <link rel="apple-touch-startup-image">. On vise les iPhone modernes + iPad
// Pro 11" — les autres appareils auront un splash vide (acceptable).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, '..', 'public', 'icons');
const splashDir = join(here, '..', 'public', 'splash');
const masterPath = join(iconsDir, 'icon.svg');

// Cream — doit matcher --cream dans src/index.css pour éviter le flash.
const BG = { r: 0xfb, g: 0xf6, b: 0xec, alpha: 1 };

// Logo : 40 % de la plus petite dimension, centré.
const LOGO_RATIO = 0.4;

const targets = [
  { name: 'iphone-1170x2532.png', w: 1170, h: 2532 },     // iPhone 12/13/14/15/16 standard
  { name: 'iphone-1179x2556.png', w: 1179, h: 2556 },     // iPhone 14/15/16 Pro
  { name: 'iphone-1290x2796.png', w: 1290, h: 2796 },     // iPhone 14/15/16 Pro Max
  { name: 'ipad-1668x2388.png', w: 1668, h: 2388 },       // iPad Pro 11"
];

const svg = await readFile(masterPath);

await Promise.all(
  targets.map(async ({ name, w, h }) => {
    const logoSize = Math.round(Math.min(w, h) * LOGO_RATIO);
    const logo = await sharp(svg, { density: 384 })
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const out = join(splashDir, name);
    const { size } = await sharp({
      create: { width: w, height: h, channels: 4, background: BG },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(out);

    console.log(`✓ ${name} (${w}×${h}, ${(size / 1024).toFixed(1)} KB)`);
  }),
);
