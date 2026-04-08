import { useState, useEffect } from 'react';
import './DotGrid.css';

interface DotGridProps {
  a: number;
  b: number;
  animated?: boolean;
  showRotation?: boolean;
  size?: 'normal' | 'small';
}

export default function DotGrid({
  a,
  b,
  animated = true,
  showRotation = false,
  size = 'normal',
}: DotGridProps) {
  const [visibleRows, setVisibleRows] = useState(animated ? 0 : a);
  const [rotated, setRotated] = useState(false);

  // Animate rows appearing one by one
  useEffect(() => {
    if (!animated) {
      setVisibleRows(a);
      return;
    }
    setVisibleRows(0);
    setRotated(false);
    let row = 0;
    const interval = setInterval(() => {
      row++;
      setVisibleRows(row);
      if (row >= a) {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [a, b, animated]);

  // Trigger rotation after all rows appear
  useEffect(() => {
    if (!showRotation || visibleRows < a) return;
    const timeout = setTimeout(() => {
      setRotated(true);
    }, 800);
    return () => clearTimeout(timeout);
  }, [showRotation, visibleRows, a]);

  const rows = Array.from({ length: a }, (_, rowIndex) => (
    <div
      key={rowIndex}
      className={`dot-grid-row ${!animated ? 'no-animation' : ''}`}
      style={animated ? { animationDelay: `${rowIndex * 0.3}s` } : undefined}
    >
      {Array.from({ length: b }, (_, colIndex) => (
        <div key={colIndex} className="dot" />
      ))}
    </div>
  ));

  return (
    <div className={`dot-grid-wrapper ${size}`}>
      <div className="dot-grid-label">
        <span>{a}</span> {'\u00D7'} <span>{b}</span>
      </div>
      <div className={`dot-grid ${rotated ? 'rotating' : ''}`}>
        {rows.slice(0, visibleRows)}
      </div>
      {visibleRows >= a && (
        <div className="dot-grid-result">
          = <strong>{a * b}</strong>
        </div>
      )}
    </div>
  );
}
