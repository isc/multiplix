# Redirecteur Multiplix → Tablito

Ce dépôt ne contient **pas** d'application : il sert uniquement de **redirecteur**
à l'adresse <https://isc.github.io/multiplix/>.

## Pourquoi ?

L'appli « Multiplix » a été **renommée Tablito** et **déménagée** sur son propre
domaine : <https://tablito.app/>. Le dépôt GitHub `isc/multiplix` a été renommé
en `isc/tablito`, ce qui a libéré le chemin `isc.github.io/multiplix/`.

Deux problèmes à régler pour ne perdre aucun utilisateur :

1. **GitHub Pages ne redirige pas** l'ancien chemin d'un dépôt renommé, et les
   **PWA déjà installées** (service worker *cache-first*) se retrouvent
   orphelines sur `/multiplix/`.
2. Le **`localStorage` est lié à l'origine** (`isc.github.io`), pas au chemin. Il
   ne suit donc **pas** automatiquement vers `tablito.app` (origine différente).

Ce dépôt recrée un repo nommé `multiplix` pour **réoccuper** `/multiplix/` et y
servir une page de migration.

## Comment ça marche

- **`sw.js`** — service worker « d'adieu » : remplace l'ancien SW de l'app,
  purge ses caches et **se désinscrit**, pour que la page se charge à neuf
  (plus de version figée en cache).
- **`index.html`** / **`404.html`** — la page de migration :
  - annonce le renommage (« Multiplix devient Tablito ») ;
  - bouton **« Copier ma progression »** qui lit le profil dans le `localStorage`
    (même origine `isc.github.io`) ;
  - instructions d'installation **adaptées à l'OS** (iOS / Android / desktop) ;
  - en navigateur (hors PWA), un lien direct qui **emporte le profil** vers
    `tablito.app` via le fragment d'URL `#import=<flag><base64url>` (flag `z` =
    gzip).

Le **côté réception** vit dans le dépôt `tablito` :
- `src/lib/storage.ts` → `importProfileFromUrl()` décode `#import=` au boot ;
- l'écran d'accueil propose **« Déjà une progression ? L'importer »**
  (collage / presse-papiers) pour une install neuve.

## Parcours utilisateur (iOS)

1. Ouvrir l'ancienne icône **Multiplix** → **Copier ma progression**.
2. Ouvrir **tablito.app** → Partager → **Sur l'écran d'accueil** (icône Tablito).
3. Ouvrir **Tablito** → **Déjà une progression ? L'importer** → **Coller**.

## Déploiement

3 fichiers statiques servis par **GitHub Pages** (branche `main`, racine).
Aucun build.

## Quand le retirer

Une fois que les utilisateurs encore installés sur `/multiplix/` ont migré
(quelques mois), ce dépôt peut être archivé/supprimé.
