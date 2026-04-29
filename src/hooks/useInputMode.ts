import { useCallback, useSyncExternalStore } from 'react';

export type InputMode = 'keypad' | 'voice';

export const INPUT_MODE_STORAGE_KEY = 'multiplix-input-mode';

// Store partagé entre toutes les instances du hook : sans ça, SessionScreen
// et VoiceInput auraient chacun leur propre useState et le clic sur
// « Utiliser le clavier » dans VoiceInput ne re-rendrait pas SessionScreen.
function readMode(): InputMode {
  try {
    return localStorage.getItem(INPUT_MODE_STORAGE_KEY) === 'voice' ? 'voice' : 'keypad';
  } catch {
    return 'keypad';
  }
}

let cached: InputMode = readMode();
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): InputMode {
  return cached;
}

export function useInputMode(): {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
} {
  const inputMode = useSyncExternalStore(subscribe, getSnapshot);

  const setInputMode = useCallback((mode: InputMode) => {
    if (cached === mode) return;
    cached = mode;
    try {
      localStorage.setItem(INPUT_MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
    for (const listener of listeners) listener();
  }, []);

  return { inputMode, setInputMode };
}
