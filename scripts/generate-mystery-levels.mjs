#!/usr/bin/env node
/**
 * Dérive les 5 niveaux de finesse d'une image mystère depuis un master.
 *
 * Les niveaux matchent les 5 boîtes Leitner (voir specs §5.1) :
 *   1 : silhouette floue        — flou fort + désaturation
 *   2 : aplat simple            — flou moyen + posterize agressif
 *   3 : couleurs principales    — flou léger + posterize doux
 *   4 : ombres et volumes       — très léger flou uniquement
 *   5 : détails fins            — image originale
 *
 * Usage :
 *   node scripts/generate-mystery-levels.mjs <master.png> [--out <dir>] [--size <px>]
 *
 * Exemples :
 *   node scripts/generate-mystery-levels.mjs masters/forest.png
 *   # → public/mystery/forest/level-{1..5}.png  (512×512 par défaut)
 *
 *   node scripts/generate-mystery-levels.mjs masters/ocean.png --size 768
 *   # → public/mystery/ocean/level-{1..5}.png  (768×768)
 *
 *   node scripts/generate-mystery-levels.mjs masters/city.png --out public/mystery/ville
 *   # → public/mystery/ville/level-{1..5}.png
 *
 * Le master doit être carré (1:1). S'il ne l'est pas, il est recadré au
 * centre pour rester carré avant d'être redimensionné à la taille cible.
 *
 * Idempotent : écrase les fichiers existants à chaque run.
 */

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_SIZE = 512;

// --- Pipelines par niveau --------------------------------------------------

/**
 * Chaque pipeline reçoit une instance `sharp` déjà cadrée (carrée) et doit
 * retourner une nouvelle instance avec les transformations du niveau appliquées.
 *
 * Les paramètres sont calibrés pour une image 512×512 — ils scalent
 * grossièrement avec la taille (le flou est multiplié par size/512).
 */
function makePipelines(size) {
  const k = size / DEFAULT_SIZE; // facteur d'échelle pour le flou
  return [
    {
      level: 1,
      // Silhouette floue : flou massif + désaturation forte + légère
      // réduction de contraste pour un rendu "brume".
      apply: (img) =>
        img
          .blur(30 * k)
          .modulate({ saturation: 0.25, brightness: 1.05 })
          .linear(0.85, 12), // contrast * 0.85, brightness offset +12
    },
    {
      level: 2,
      // Aplat simple : flou moyen + posterize agressif (peu de niveaux
      // de couleur) pour un rendu "masses colorées".
      apply: (img) =>
        img
          .blur(14 * k)
          .modulate({ saturation: 0.55 })
          // posterize approximatif via reduction de bits puis restore
          .png({ palette: true, colors: 8 }),
    },
    {
      level: 3,
      // Couleurs principales : flou léger + saturation quasi normale.
      apply: (img) =>
        img
          .blur(6 * k)
          .modulate({ saturation: 0.85 }),
    },
    {
      level: 4,
      // Ombres et volumes : flou subtil (les contours restent nets,
      // les micro-détails s'estompent).
      apply: (img) => img.blur(1.5 * k),
    },
    {
      level: 5,
      // Détails fins : image originale, juste redimensionnée.
      apply: (img) => img,
    },
  ];
}

// --- Args parsing ----------------------------------------------------------

function parseArgs(argv) {
  const args = { master: null, out: null, size: DEFAULT_SIZE };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') {
      args.out = argv[++i];
    } else if (a === '--size') {
      args.size = Number(argv[++i]);
      if (!Number.isFinite(args.size) || args.size < 64) {
        throw new Error(`--size doit être un entier ≥ 64 (reçu : ${argv[i]})`);
      }
    } else if (a.startsWith('--')) {
      throw new Error(`Option inconnue : ${a}`);
    } else if (!args.master) {
      args.master = a;
    } else {
      throw new Error(`Argument positionnel inattendu : ${a}`);
    }
  }
  if (!args.master) {
    throw new Error('Master manquant. Usage : node generate-mystery-levels.mjs <master.png> [--out <dir>] [--size <px>]');
  }
  if (!existsSync(args.master)) {
    throw new Error(`Master introuvable : ${args.master}`);
  }
  if (!args.out) {
    const id = basename(args.master, extname(args.master));
    args.out = resolve(REPO_ROOT, 'public', 'mystery', id);
  } else {
    args.out = resolve(args.out);
  }
  return args;
}

// --- Main ------------------------------------------------------------------

async function main() {
  const { master, out, size } = parseArgs(process.argv.slice(2));
  await mkdir(out, { recursive: true });

  console.log(`master:   ${master}`);
  console.log(`out dir:  ${out}`);
  console.log(`size:     ${size}×${size}`);

  // Charge le master, recadre au centre en carré si nécessaire, redimensionne
  // à la taille cible. Les 5 pipelines travaillent depuis cette base carrée.
  const { width, height } = await sharp(master).metadata();
  if (!width || !height) {
    throw new Error(`Impossible de lire les dimensions de ${master}`);
  }
  const squareSide = Math.min(width, height);
  const offsetX = Math.floor((width - squareSide) / 2);
  const offsetY = Math.floor((height - squareSide) / 2);

  const pipelines = makePipelines(size);

  for (const { level, apply } of pipelines) {
    // On repart du master à chaque niveau pour éviter que les transformations
    // se cumulent entre les étapes (blur puis posterize sur un blur n'est pas
    // la même chose que blur fresh).
    const base = sharp(master).extract({
      left: offsetX,
      top: offsetY,
      width: squareSide,
      height: squareSide,
    }).resize(size, size);

    const outputPath = join(out, `level-${level}.png`);
    const transformed = apply(base);
    // Force une sortie PNG RGBA propre même si le pipeline contient un palette.
    await transformed.toColourspace('srgb').png().toFile(outputPath);
    console.log(`✓ level-${level}.png`);
  }

  console.log('done ✔');
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
