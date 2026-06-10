// SW « d'adieu » de l'ancien chemin /multiplix/.
// Un service worker ne peut PAS lire localStorage. Son seul rôle : remplacer
// l'ancien SW cache-first encore installé, purger ses caches et se désinscrire.
// Au prochain lancement de l'app, /multiplix/ n'a plus de SW → GitHub sert
// l'index.html (l'émetteur), qui lit le profil et redirige vers tablito.app.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* ignore */ }
    try { await self.registration.unregister(); } catch (e) { /* ignore */ }
  })());
});
