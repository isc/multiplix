import './Mascot.css';

interface MascotProps {
  level: number; // 1-5
  mood: 'happy' | 'sad' | 'idle' | 'celebrate';
  size?: 'small' | 'normal' | 'large';
  showLabel?: boolean;
}

const MASCOT_STAGES: Record<
  number,
  { emoji: string; name: string }
> = {
  1: { emoji: '\uD83E\uDD5A', name: 'Oeuf' },          // egg
  2: { emoji: '\uD83D\uDC23', name: 'Bebe' },           // hatching chick
  3: { emoji: '\uD83D\uDC25', name: 'Poussin' },        // front-facing baby chick
  4: { emoji: '\uD83E\uDD89', name: 'Chouette' },       // owl
  5: { emoji: '\uD83E\uDD85', name: 'Aigle royal' },    // eagle
};

export default function Mascot({
  level,
  mood,
  size = 'normal',
  showLabel = false,
}: MascotProps) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  const stage = MASCOT_STAGES[clampedLevel];

  return (
    <div className={`mascot ${size}`} role="img" aria-label={`Mascotte ${stage.name}, humeur: ${mood}`}>
      <div className={`mascot-figure ${mood}`}>
        {stage.emoji}
      </div>
      {showLabel && <div className="mascot-label">{stage.name}</div>}
    </div>
  );
}
