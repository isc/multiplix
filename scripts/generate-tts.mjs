#!/usr/bin/env node

/**
 * Generates pre-recorded TTS audio files via the Mistral Voxtral TTS API.
 *
 * Usage:
 *   MISTRAL_API_KEY=... node scripts/generate-tts.mjs
 *
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

const MISTRAL_TTS_URL = 'https://api.mistral.ai/v1/audio/speech';
const MODEL = 'voxtral-mini-tts-2603';
// Marie - Curious (fr_fr, female)
const VOICE_ID = 'e0580ce5-e63c-4cbe-88c8-a983b80c5f1f';

const API_KEY = process.env.MISTRAL_API_KEY;
if (!API_KEY) {
  console.error('MISTRAL_API_KEY environment variable not set');
  process.exit(1);
}

async function generateAudio(text, outputPath) {
  const response = await fetch(MISTRAL_TTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: text,
      voice_id: VOICE_ID,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`API error: ${response.status} - ${body}`);
    return false;
  }

  const data = await response.json();
  if (!data.audio_data) {
    console.error('No audio_data in response');
    return false;
  }

  await writeFile(outputPath, Buffer.from(data.audio_data, 'base64'));
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
    key: 'welcome-test',
    text: "Je vais te poser quelques questions pour voir ce que tu connais déjà. Pas de stress, il n'y a pas de piège !",
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
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone! ${success} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
