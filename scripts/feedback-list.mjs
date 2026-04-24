#!/usr/bin/env node
// Lit les feedbacks depuis Supabase via la secret key (côté local uniquement).
// Nécessite .env.local (chargé via `node --env-file=.env.local`).

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error('SUPABASE_URL ou SUPABASE_SECRET_KEY manquant. Lance avec: npm run feedback:list');
  process.exit(1);
}

const limit = Number(process.argv[2] ?? 50);
const endpoint = `${url}/rest/v1/feedback?select=*&order=created_at.desc&limit=${limit}`;

const res = await fetch(endpoint, {
  headers: {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
  },
});

if (!res.ok) {
  console.error(`Erreur ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const rows = await res.json();
if (rows.length === 0) {
  console.log('Aucun feedback pour le moment.');
  process.exit(0);
}

for (const row of rows) {
  const date = new Date(row.created_at).toLocaleString('fr-FR');
  const ctx = row.context ?? {};
  const stats = ctx.stats
    ? ` | ${ctx.stats.total_sessions} séances, ${ctx.stats.facts_mastered}/${ctx.stats.facts_total} maîtrisés`
    : '';
  console.log('---');
  console.log(`[${date}] ${row.email ?? '(sans email)'}${stats}`);
  console.log(`UA: ${ctx.user_agent ?? '?'} | ${ctx.viewport?.w ?? '?'}x${ctx.viewport?.h ?? '?'}`);
  console.log('');
  console.log(row.message);
}
console.log('---');
console.log(`${rows.length} feedback${rows.length > 1 ? 's' : ''}.`);
