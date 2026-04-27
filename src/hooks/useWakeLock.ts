import { useEffect } from 'react';

// Empêche la mise en veille de l'écran/du téléphone tant que le hook est monté.
// Indispensable en mode vocal : sans interaction tactile, iOS/Android coupent
// l'écran au bout de ~30s et la reconnaissance s'arrête.
//
// Le wake lock est libéré automatiquement quand l'onglet passe en arrière-plan,
// donc on le ré-acquiert sur visibilitychange tant que le composant est monté.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Échec silencieux : permission refusée, batterie faible, etc.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) {
        request();
      }
    };

    request();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sentinel) {
        sentinel.release().catch(() => {});
        sentinel = null;
      }
    };
  }, [active]);
}
