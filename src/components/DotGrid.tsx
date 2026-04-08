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
  const [showResult, setShowResult] = useState(!animated);
  const [rotated, setRotated] = useState(false);

  // Animate rows appearing one by one
  useEffect(() => {
    if (!animated) {
      setVisibleRows(a);
      setShowResult(true);
      return;
    }
    setVisibleRows(0);
    setShowResult(false);
    setRotated(false);
    let row = 0;
    const interval = setInterval(() => {
      row++;
      setVisibleRows(row);
      if (row >= a) {
        clearInterval(interval);
        // Show result after last row's fade-in animation (400ms)
        setTimeout(() => setShowResult(true), 500);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [a, b, animated]);

  // Trigger rotation after all rows appear
  useEffect(() => {
    if (!showRotation || !showResult) return;
    const timeout = setTimeout(() => {
      setRotated(true);
    }, 800);
    return () => clearTimeout(timeout);
  }, [showRotation, showResult]);

  // Scale dots down for large grids so they don't overflow on mobile
  const maxDim = Math.max(a, b);
  const dotSize = maxDim >= 8 ? 12 : maxDim >= 6 ? 14 : 16;
  const dotGap = maxDim >= 8 ? 4 : 6;

  return (
    <div
      className={`dot-grid-wrapper ${size}`}
      style={{ '--dot-size': `${dotSize}px`, '--dot-gap': `${dotGap}px` } as React.CSSProperties}
    >
      <div className="dot-grid-label">
        <span>{a}</span> {'\u00D7'} <span>{b}</span>
      </div>
      <div className={`dot-grid ${rotated ? 'rotating' : ''}`}>
        {Array.from({ length: a }, (_, rowIndex) => {
          const visible = rowIndex < visibleRows;
          return (
            <div
              key={rowIndex}
              className={`dot-grid-row ${!animated ? 'no-animation' : visible ? '' : 'hidden'}`}
            >
              {Array.from({ length: b }, (_, colIndex) => (
                <div key={colIndex} className="dot" />
              ))}
            </div>
          );
        })}
      </div>
      <div className={`dot-grid-result ${showResult ? 'visible' : ''}`}>
        = <strong>{a * b}</strong>
      </div>
    </div>
  );
}
