import { useState, useMemo } from 'react';
import type { MultiFact } from '../types';
import DotGrid from './DotGrid';
import './MysteryImage.css';

interface MysteryImageProps {
  facts: MultiFact[];
}

// 0 = not introduced, 1..5 = Leitner box (1 = silhouette, 5 = détail complet)
function getLevel(fact: MultiFact | undefined): number {
  if (!fact || !fact.introduced) return 0;
  return fact.box;
}

const HEADERS = [2, 3, 4, 5, 6, 7, 8, 9];

export default function MysteryImage({ facts }: MysteryImageProps) {
  const [selectedFact, setSelectedFact] = useState<MultiFact | null>(null);

  const factMap = useMemo(() => {
    const m = new Map<string, MultiFact>();
    for (const f of facts) m.set(`${f.a},${f.b}`, f);
    return m;
  }, [facts]);

  return (
    <div className="mystery-image-container">
      <div className="mystery-image">
        {/* Placeholder scene: whimsical landscape. Will be replaced by the
            chosen master illustration (see specs §5.1). */}
        <svg
          className="mystery-scene"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd98a" />
              <stop offset="40%" stopColor="#ffb38a" />
              <stop offset="70%" stopColor="#a4c9ff" />
              <stop offset="100%" stopColor="#5f9fdb" />
            </linearGradient>
            <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7fbf6a" />
              <stop offset="100%" stopColor="#4d8a45" />
            </linearGradient>
            <linearGradient id="hill-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9bd67f" />
              <stop offset="100%" stopColor="#5faa4f" />
            </linearGradient>
            <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="60%" stopColor="#ffd166" />
              <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width="800" height="560" fill="url(#sky)" />

          {/* Sun */}
          <circle cx="620" cy="180" r="120" fill="url(#sun)" />
          <circle cx="620" cy="180" r="62" fill="#fff3b0" />

          {/* Clouds */}
          <g fill="#ffffff" opacity="0.85">
            <ellipse cx="150" cy="170" rx="70" ry="22" />
            <ellipse cx="200" cy="155" rx="55" ry="20" />
            <ellipse cx="115" cy="155" rx="40" ry="16" />
            <ellipse cx="440" cy="110" rx="60" ry="18" />
            <ellipse cx="480" cy="100" rx="45" ry="15" />
          </g>

          {/* Birds */}
          <g fill="none" stroke="#3a3a3a" strokeWidth="3" strokeLinecap="round">
            <path d="M 320 230 q 10 -10 20 0 q 10 -10 20 0" />
            <path d="M 380 260 q 8 -8 16 0 q 8 -8 16 0" />
          </g>

          {/* Distant mountain */}
          <path d="M 0 500 L 180 340 L 320 460 L 460 320 L 620 470 L 800 360 L 800 560 L 0 560 Z"
            fill="#8ea8c8" opacity="0.7" />

          {/* Back hill */}
          <path d="M 0 560 Q 200 450 420 510 Q 620 560 800 490 L 800 800 L 0 800 Z"
            fill="url(#hill-back)" />

          {/* Front hill */}
          <path d="M 0 640 Q 250 560 480 620 Q 650 660 800 600 L 800 800 L 0 800 Z"
            fill="url(#hill-front)" />

          {/* Path */}
          <path d="M 380 800 Q 420 720 480 680 Q 520 640 500 600"
            fill="none" stroke="#d9b68a" strokeWidth="42" strokeLinecap="round" />
          <path d="M 380 800 Q 420 720 480 680 Q 520 640 500 600"
            fill="none" stroke="#c09a6a" strokeWidth="42" strokeLinecap="round"
            strokeDasharray="4 18" opacity="0.4" />

          {/* House */}
          <g>
            <rect x="540" y="560" width="120" height="90" fill="#f5e1a7" />
            <polygon points="530,560 670,560 600,500" fill="#c44b3e" />
            <rect x="585" y="590" width="30" height="60" fill="#7a4a2a" />
            <rect x="555" y="580" width="22" height="22" fill="#a4c9ff" stroke="#7a4a2a" strokeWidth="2" />
            <rect x="623" y="580" width="22" height="22" fill="#a4c9ff" stroke="#7a4a2a" strokeWidth="2" />
            <rect x="620" y="510" width="16" height="28" fill="#9a8060" />
            <path d="M 616 510 q 10 -8 24 0" fill="none" stroke="#b0b0b0" strokeWidth="3" />
          </g>

          {/* Big tree */}
          <g>
            <rect x="180" y="580" width="26" height="80" fill="#6b4423" rx="4" />
            <circle cx="193" cy="560" r="58" fill="#4a8f3a" />
            <circle cx="155" cy="575" r="42" fill="#5fa64a" />
            <circle cx="230" cy="570" r="45" fill="#5fa64a" />
            <circle cx="193" cy="525" r="35" fill="#6fb85a" />
          </g>

          {/* Small tree */}
          <g>
            <rect x="80" y="630" width="14" height="40" fill="#6b4423" />
            <polygon points="87,600 70,650 104,650" fill="#4a8f3a" />
            <polygon points="87,620 75,660 99,660" fill="#5fa64a" />
          </g>

          {/* Flowers */}
          <g>
            <circle cx="280" cy="720" r="6" fill="#ff6b9d" />
            <circle cx="280" cy="720" r="2" fill="#ffd700" />
            <circle cx="320" cy="740" r="6" fill="#ffa94d" />
            <circle cx="320" cy="740" r="2" fill="#ffd700" />
            <circle cx="150" cy="730" r="6" fill="#b388ff" />
            <circle cx="150" cy="730" r="2" fill="#ffd700" />
            <circle cx="720" cy="720" r="6" fill="#ff6b9d" />
            <circle cx="720" cy="720" r="2" fill="#ffd700" />
            <circle cx="750" cy="750" r="6" fill="#ffffff" />
            <circle cx="750" cy="750" r="2" fill="#ffd700" />
          </g>

          {/* Butterfly */}
          <g transform="translate(400 380)">
            <ellipse cx="-8" cy="-6" rx="10" ry="14" fill="#ff9ec4" opacity="0.9" />
            <ellipse cx="8" cy="-6" rx="10" ry="14" fill="#ff9ec4" opacity="0.9" />
            <ellipse cx="-7" cy="6" rx="8" ry="10" fill="#c77fb0" opacity="0.9" />
            <ellipse cx="7" cy="6" rx="8" ry="10" fill="#c77fb0" opacity="0.9" />
            <line x1="0" y1="-14" x2="0" y2="14" stroke="#3a3a3a" strokeWidth="2" />
          </g>
        </svg>

        {/* Overlay grid: each cell applies a blur/desat filter based on its box */}
        <div className="mystery-cells">
          {HEADERS.map((row) =>
            HEADERS.map((col) => {
              const a = Math.min(row, col);
              const b = Math.max(row, col);
              const fact = factMap.get(`${a},${b}`);
              const level = getLevel(fact);
              const introduced = fact?.introduced ?? false;
              const isDiagonal = row === col;

              return (
                <button
                  key={`${row}-${col}`}
                  className={`mystery-cell mystery-level-${level}${isDiagonal ? ' mystery-diagonal' : ''}`}
                  onClick={() => introduced && fact && setSelectedFact(fact)}
                  aria-label={`${row} fois ${col} = ${row * col}`}
                />
              );
            }),
          )}
        </div>
      </div>

      {selectedFact && (
        <div
          className="mystery-detail-overlay"
          onClick={() => setSelectedFact(null)}
        >
          <div
            className="mystery-detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {selectedFact.a} {'\u00D7'} {selectedFact.b} ={' '}
              {selectedFact.product}
            </h3>
            <DotGrid
              a={selectedFact.a}
              b={selectedFact.b}
              animated={false}
              size="small"
            />
            <p className="mystery-detail-box">
              {selectedFact.box === 5
                ? 'Maîtrisé !'
                : selectedFact.box === 1
                  ? 'En apprentissage'
                  : `Boîte ${selectedFact.box}/5`}
            </p>
            <button
              className="mystery-detail-close"
              onClick={() => setSelectedFact(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
