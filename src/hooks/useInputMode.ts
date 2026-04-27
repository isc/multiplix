import { useCallback, useState } from 'react';

export type InputMode = 'keypad' | 'voice';

const STORAGE_KEY = 'multiplix-input-mode';

function getInitialMode(): InputMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'voice' ? 'voice' : 'keypad';
  } catch {
    return 'keypad';
  }
}

export function useInputMode(): {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
} {
  const [inputMode, setInputModeState] = useState<InputMode>(getInitialMode);

  const setInputMode = useCallback((mode: InputMode) => {
    setInputModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  return { inputMode, setInputMode };
}
