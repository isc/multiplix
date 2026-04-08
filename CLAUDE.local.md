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

## Agents en worktree

Quand on lance des agents en worktree pour paralléliser :

- **rtk casse `git apply`** : le hook rtk préfixe un diffstat au `git diff`. Pour extraire un patch utilisable :
  ```bash
  git -C <worktree> diff --no-color -U3 2>/dev/null | sed -n '/^diff --git/,$p' > /tmp/patch.patch
  ```
- **Toujours demander aux agents de commiter** : dans le prompt de l'agent, inclure l'instruction "Une fois terminé, commit tes changements avec un message descriptif." Sinon certains commitent et d'autres non, ce qui complique le merge. Pour extraire le diff d'un commit : `git -C <worktree> diff --no-color -U3 <base>..<head> 2>/dev/null | sed -n '/^diff --git/,$p'`
- **Ordre de merge** : appliquer d'abord les patches qui ne touchent pas aux mêmes fichiers, puis ceux avec conflits potentiels (ex: App.tsx touché par plusieurs agents).
