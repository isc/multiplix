# Multiplix

App d'apprentissage des tables de multiplication (PWA React + TypeScript).

## Stack

- Vite 6 + React + TypeScript
- PWA via vite-plugin-pwa
- localStorage pour la persistance (pas de backend)
- Déploiement : GitHub Pages via GitHub Actions (`base: '/multiplix/'`)
- Node minimum : 20.19+ pour le build (CI utilise Node 22)

## Structure

- `src/lib/` — logique métier (Leitner, sélection de questions, similarité, badges, stockage)
- `src/components/` — composants React réutilisables
- `src/screens/` — écrans de l'app
- `src/hooks/` — hooks custom (son, timer, streak, confetti)
- `specs-multiplix.md` — spécifications fonctionnelles complètes
- `TODO.md` — évolutions techniques envisagées (pistes non tranchées)

## Guide utilisateur

Un guide HTML avec captures d'écran est généré par `npm run user-guide` (script `scripts/generate-user-guide.mjs`) et déployé à `/multiplix/guide/`.

## Changelog in-app

`src/lib/changelog.ts` alimente la page « Nouveautés » de l'espace parent. Quand un commit apporte un changement visible côté enfant ou parent (nouveau fonctionnement, fix d'un bug que l'utilisateur pouvait observer, nouvelle UI, etc.), ajouter une entrée — soit en créant un nouvel objet pour la date du jour, soit en complétant l'entrée du jour si elle existe déjà. Ne pas y mettre les refactos, le CI, le lint, ou les changements purement techniques invisibles.

## Génération des MP3 TTS

Les voix sont pré-générées via `scripts/generate-tts.mjs` (Mistral Voxtral) et checked-in dans `public/audio/tts/`. Le script est idempotent : il ne régénère que les fichiers manquants.

**Quand ajouter un MP3** : ajouter une entrée dans `scripts/generate-tts.mjs` avec une nouvelle `key` et le `text` correspondant, puis générer.

**Comment générer** (la clé API n'est jamais en clair dans le repo) :

- **Depuis une session avec la clé en env local** : `node scripts/generate-tts.mjs` puis `git add public/audio/tts && git commit && git push`.
- **Depuis CI / session remote sans la clé** : déclencher le workflow dédié qui utilise le secret repo `MISTRAL_API_KEY` et commit les MP3s sur `main` :
  ```bash
  gh workflow run generate-tts.yml
  gh run watch  # suivre l'exécution
  git pull      # récupérer le commit assets(tts) créé par le workflow
  ```
  Le workflow est défini dans `.github/workflows/generate-tts.yml` et déclenchable manuellement (`workflow_dispatch`).
