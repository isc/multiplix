import type { Strategy } from '../lib/strategies';
import './StrategyHint.css';

interface StrategyHintProps {
  strategy: Strategy;
  variant?: 'feedback' | 'intro';
}

export default function StrategyHint({ strategy, variant = 'feedback' }: StrategyHintProps) {
  const showTenRecall = variant === 'intro' && strategy.kind === 'near-ten';

  return (
    <div className={`strategy-hint ${variant}`}>
      <div className="strategy-hint-title">
        <span className="strategy-hint-bulb" aria-hidden>💡</span>
        <span>{strategy.title}</span>
      </div>
      <div className="strategy-hint-lines">
        {strategy.lines.map((line, i) => (
          <div key={i} className="strategy-hint-line">{line}</div>
        ))}
      </div>
      {showTenRecall && (
        <div className="strategy-hint-recall">
          Rappel : pour {'\u00D7'} 10, les chiffres glissent d'une place vers la
          gauche et un 0 prend la place des unités.
        </div>
      )}
    </div>
  );
}
