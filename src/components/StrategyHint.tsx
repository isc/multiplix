import type { Strategy } from '../lib/strategies';
import './StrategyHint.css';

interface StrategyHintProps {
  strategy: Strategy;
  variant?: 'feedback' | 'intro';
}

export default function StrategyHint({ strategy, variant = 'feedback' }: StrategyHintProps) {
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
    </div>
  );
}
