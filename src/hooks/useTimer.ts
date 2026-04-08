import { useCallback, useRef } from 'react';

export function useTimer() {
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const stopTimer = useCallback((): number => {
    if (startTimeRef.current === 0) {
      return 0;
    }
    const elapsed = performance.now() - startTimeRef.current;
    startTimeRef.current = 0;
    return Math.round(elapsed);
  }, []);

  return { startTimer, stopTimer };
}
