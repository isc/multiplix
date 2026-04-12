#!/usr/bin/env node

/**
 * Generates pre-recorded TTS audio files via the Inworld TTS API.
 *
 * Usage:
 *   source /path/to/weberg/.env && node scripts/generate-tts.mjs
 *
 * Requires INWORLD_API_KEY in the environment.
 * Output: public/audio/tts/*.mp3
 *
 * Skips files that already exist (delete a file to regenerate it).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'audio', 'tts');

const INWORLD_API_URL = 'https://api.inworld.ai/tts/v1/voice';
const VOICE_ID = 'Hélène';
const MODEL_ID = 'inworld-tts-1';

const API_KEY = process.env.INWORLD_API_KEY;
if (!API_KEY) {
  console.error('INWORLD_API_KEY environment variable not set');
  console.error('Usage: source /path/to/weberg/.env && node scripts/generate-tts.mjs');
  process.exit(1);
}

async function generateAudio(text, outputPath) {
  const response = await fetch(INWORLD_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voiceId: VOICE_ID, modelId: MODEL_ID }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`API error: ${response.status} - ${body}`);
    return false;
  }

  const data = await response.json();
  if (!data.audioContent) {
    console.error('No audio content in response');
    return false;
  }

  await writeFile(outputPath, Buffer.from(data.audioContent, 'base64'));
  return true;
}

function buildEntries() {
  const entries = [];

  // Questions: "A fois B" for all A,B in [2..9]
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      entries.push({ key: `q-${a}-${b}`, text: `${a} fois ${b}` });
    }
  }

  // Introductions: "Nouveau ! A fois B, c'est B+B+...+B, égale P" for unique facts (a <= b)
  for (let a = 2; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      const addition = Array.from({ length: a }, () => String(b)).join(' plus ');
      entries.push({
        key: `intro-${a}-${b}`,
        text: `Nouveau ! ${a} fois ${b}, c'est ${addition}, égale ${a * b}`,
      });
    }
  }

  // Commutativity: "B fois A, c'est pareil ! C'est aussi P" for facts where a != b
  for (let a = 2; a <= 9; a++) {
    for (let b = a + 1; b <= 9; b++) {
      entries.push({
        key: `comm-${a}-${b}`,
        text: `${b} fois ${a}, c'est pareil ! C'est aussi ${a * b}`,
      });
    }
  }

  // Static phrases
  entries.push({
    key: 'welcome-hello',
    text: "Bonjour ! Je suis un petit oeuf magique. Aide-moi à grandir en apprenant les tables de multiplication !",
  });
  entries.push({
    key: 'welcome-name',
    text: "Comment tu t'appelles ?",
  });
  entries.push({
    key: 'recap-done',
    text: "Séance terminée ! Bravo, tu as bien travaillé !",
  });

  return entries;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const entries = buildEntries();
  console.log(`Generating ${entries.length} audio files...\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const { key, text } of entries) {
    const filepath = join(OUTPUT_DIR, `${key}.mp3`);

    if (existsSync(filepath)) {
      skipped++;
      continue;
    }

    const preview = text.length > 60 ? text.slice(0, 57) + '...' : text;
    process.stdout.write(`${key}: "${preview}"... `);

    const ok = await generateAudio(text, filepath);
    if (ok) {
      console.log('ok');
      success++;
    } else {
      console.log('FAILED');
      failed++;
    }

    // Rate-limit API calls
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone! ${success} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
