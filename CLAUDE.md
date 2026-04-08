# Multiplix

App d'apprentissage des tables de multiplication (PWA React + TypeScript).

## Workflow

- Commit et push directement sans attendre de relecture du code.
- Toujours faire des squash merges, les commits individuels n'ont pas besoin d'être parfaits.
- Ne jamais faire de `git commit --amend`.
- Après chaque push sur une PR, vérifier si le titre et la description sont toujours à jour.

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
