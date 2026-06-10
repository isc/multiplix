// SW « d'adieu » v5 de l'ancien chemin /multiplix/.
// Un SW qui sert/cache l'index rendait les mises à jour "collantes" sur iOS.
// Ici on fait l'inverse : purge tous les caches, DÉSINSCRIPTION du SW, puis on
// recharge les fenêtres → au rechargement il n'y a plus de SW, GitHub sert
// l'index.html frais. Plus aucune couche de cache qui masque la page à jour.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) { try { await c.navigate(c.url); } catch (e) {} }
  })());
});
