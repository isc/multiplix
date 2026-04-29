import { useEffect } from 'react';
import { INPUT_MODE_STORAGE_KEY } from './useInputMode';

// Décale l'enregistrement du listener de geste pour laisser le temps au
// service worker (autoUpdate de vite-plugin-pwa) de finir un éventuel cycle
// install→activate→reload après un déploiement. Sans ce délai, un reload
// déclenché pendant le prompt micro le ferme, et iOS interprète ça comme un
// refus jusqu'à la prochaine relance de l'app.
const SW_SETTLE_DELAY_MS = 2000;

// À l'app launch, si l'utilisateur est déjà en mode vocal, déclenche le
// prompt micro au tout premier tap utilisateur (geste requis par iOS pour
// `getUserMedia`). Ça évite que le prompt n'apparaisse au milieu d'une
// séance — il arrive pendant la navigation home/welcome, le plus tôt
// possible avec un geste valide.
export function usePreflightMicPermission(): void {
  useEffect(() => {
    let mode: string | null = null;
    try {
      mode = localStorage.getItem(INPUT_MODE_STORAGE_KEY);
    } catch {
      return;
    }
    if (mode !== 'voice') return;
    if (!navigator.mediaDevices?.getUserMedia) return;

    const ac = new AbortController();
    const requestMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Refus, navigateur non supporté, contexte non sécurisé : tant pis,
        // on retombera sur le prompt natif quand SpeechRecognition.start()
        // sera appelé en séance.
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', requestMic, {
        once: true,
        signal: ac.signal,
      });
    }, SW_SETTLE_DELAY_MS);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, []);
}
