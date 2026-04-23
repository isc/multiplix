import './Mascot.css';

interface MascotProps {
  mood: 'happy' | 'idle' | 'celebrate';
  size?: 'small' | 'normal' | 'large';
}

// Stable mascotte — does not evolve. The emoji is the placeholder identity
// (change here if a dedicated illustration replaces it later).
const MASCOT = { emoji: '\uD83D\uDC25', name: 'Piou' };

export default function Mascot({ mood, size = 'normal' }: MascotProps) {
  return (
    <div className={`mascot ${size}`} role="img" aria-label={`Mascotte ${MASCOT.name}, humeur: ${mood}`}>
      <div className={`mascot-figure ${mood}`}>
        {MASCOT.emoji}
      </div>
    </div>
  );
}
