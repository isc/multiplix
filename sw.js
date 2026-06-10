// SW « d'adieu » v2 de l'ancien chemin /multiplix/ (Tablito → tablito.app).
// Remplace l'ancien SW cache-first. Au lieu de se désinscrire (ce qui pouvait
// laisser une page blanche), il prend la main et sert la page redirecteur
// visible (index.html) pour toute navigation.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch (e) {}
    await self.clients.claim();
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) { try { await c.navigate(c.url); } catch (e) {} }
  })());
});
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch('/multiplix/index.html', { cache: 'no-store' })
        .catch(() => new Response(
          '<!doctype html><meta charset=utf-8><meta http-equiv=refresh content="0;url=https://tablito.app/"><a href="https://tablito.app/">Continuer vers Tablito</a>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        ))
    );
  }
});
