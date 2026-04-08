import { useState, useCallback, useEffect } from 'react';
import './NumPad.css';

interface NumPadProps {
  onSubmit: (value: number) => void;
  disabled?: boolean;
}

export default function NumPad({ onSubmit, disabled = false }: NumPadProps) {
  const [input, setInput] = useState('');

  // Reset input when disabled changes (new question)
  useEffect(() => {
    if (!disabled) {
      setInput('');
    }
  }, [disabled]);

  const handleDigit = useCallback(
    (digit: number) => {
      if (disabled) return;
      const newInput = input + digit.toString();
      setInput(newInput);

      // Auto-validate at 2 digits (all products are <= 90, so max 2 digits)
      if (newInput.length >= 2) {
        onSubmit(parseInt(newInput, 10));
      }
    },
    [input, disabled, onSubmit],
  );

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    setInput((prev) => prev.slice(0, -1));
  }, [disabled]);

  const handleOk = useCallback(() => {
    if (disabled || input.length === 0) return;
    onSubmit(parseInt(input, 10));
  }, [disabled, input, onSubmit]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleOk();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleDigit, handleBackspace, handleOk]);

  return (
    <div className="numpad-container">
      <div className="numpad-display" aria-live="polite">
        {input || ''}
        {!disabled && <span className="numpad-display-cursor" />}
      </div>
      <div className="numpad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            className="numpad-btn"
            onClick={() => handleDigit(d)}
            disabled={disabled}
            aria-label={d.toString()}
          >
            {d}
          </button>
        ))}
        <button
          className="numpad-btn numpad-btn-backspace"
          onClick={handleBackspace}
          disabled={disabled || input.length === 0}
          aria-label="Effacer"
        >
          ⌫
        </button>
        <button
          className="numpad-btn"
          onClick={() => handleDigit(0)}
          disabled={disabled}
          aria-label="0"
        >
          0
        </button>
        <button
          className="numpad-btn numpad-btn-ok"
          onClick={handleOk}
          disabled={disabled || input.length === 0}
          aria-label="Valider"
        >
          OK
        </button>
      </div>
    </div>
  );
}
