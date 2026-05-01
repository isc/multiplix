#!/usr/bin/env node
// Marque un ou plusieurs feedbacks comme traités (status='done').
// Accepte des ids complets ou des préfixes (résolus contre les feedbacks 'new').
//
// Usage:
//   npm run feedback:treat -- <id-prefix> [<id-prefix>...]
//   npm run feedback:treat -- --all   # marque tous les 'new' comme 'done'

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error('SUPABASE_URL ou SUPABASE_SECRET_KEY manquant. Lance avec: npm run feedback:treat -- <id>');
  process.exit(1);
}

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const ids = args.filter((a) => !a.startsWith('--'));
const treatAll = flags.includes('--all');

if (ids.length === 0 && !treatAll) {
  console.error('Aucun id fourni. Usage: npm run feedback:treat -- <id-prefix> [<id-prefix>...]');
  console.error('Ou: npm run feedback:treat -- --all');
  process.exit(1);
}

if (treatAll && ids.length > 0) {
  console.error('--all ne peut pas être combiné avec des ids.');
  process.exit(1);
}

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  'Content-Type': 'application/json',
};

function formatDoneMessage(n) {
  const s = n > 1 ? 's' : '';
  return `${n} feedback${s} marqué${s} comme traité${s}.`;
}

async function fetchNewFeedbacks() {
  const res = await fetch(`${url}/rest/v1/feedback?select=id&status=eq.new`, { headers });
  if (!res.ok) {
    console.error(`Erreur ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  return res.json();
}

async function markDone(idsToMark) {
  const res = await fetch(`${url}/rest/v1/feedback?id=in.(${idsToMark.join(',')})`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'done' }),
  });
  if (!res.ok) {
    console.error(`Erreur ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
}

const allNew = await fetchNewFeedbacks();

if (treatAll) {
  if (allNew.length === 0) {
    console.log('Aucun feedback à traiter.');
    process.exit(0);
  }
  await markDone(allNew.map((r) => r.id));
  console.log(formatDoneMessage(allNew.length));
  process.exit(0);
}

const resolved = [];
for (const arg of ids) {
  const matches = allNew.filter((r) => r.id.startsWith(arg));
  if (matches.length === 0) {
    console.error(`Aucun feedback 'new' ne correspond à "${arg}".`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(`Préfixe "${arg}" ambigu, ${matches.length} correspondances : ${matches.map((m) => m.id.slice(0, 8)).join(', ')}`);
    process.exit(1);
  }
  resolved.push(matches[0].id);
}

await markDone(resolved);
console.log(formatDoneMessage(resolved.length));
