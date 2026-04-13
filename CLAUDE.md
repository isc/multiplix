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
- `audit-scientifique.md` — audit de conformité aux sources scientifiques

## Guide utilisateur

Un guide HTML avec captures d'écran est généré par `npm run user-guide` (script `scripts/generate-user-guide.mjs`) et déployé à `/multiplix/guide/`.
