import { useEffect } from 'react';

const INPUT_MODE_KEY = 'multiplix-input-mode';

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
      mode = localStorage.getItem(INPUT_MODE_KEY);
    } catch {
      return;
    }
    if (mode !== 'voice') return;
    if (!navigator.mediaDevices?.getUserMedia) return;

    let done = false;
    const requestMic = async () => {
      if (done) return;
      done = true;
      document.removeEventListener('pointerdown', requestMic);
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
      if (!done) {
        document.addEventListener('pointerdown', requestMic, { once: true });
      }
    }, SW_SETTLE_DELAY_MS);

    return () => {
      done = true;
      clearTimeout(timer);
      document.removeEventListener('pointerdown', requestMic);
    };
  }, []);
}
