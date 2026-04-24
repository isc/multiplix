import { useState, useMemo, Fragment } from 'react';
import type { UserProfile } from '../types';
import { RESPONSE_TIME } from '../types';
import { factsForTable } from '../lib/badges';
import { getFactKey } from '../lib/facts';
import ProgressGrid from '../components/ProgressGrid';
import BackChevron from '../components/BackChevron';
import FeedbackModal from '../components/FeedbackModal';
import './ParentDashboard.css';

const Y_TICKS = [0, 25, 50, 75, 100];

interface ParentDashboardProps {
  profile: UserProfile;
  onBack: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onResetFact: (a: number, b: number) => void;
  onResetTable: (table: number) => void;
  onShowPrivacy: () => void;
}

export default function ParentDashboard({
  profile,
  onBack,
  onExport,
  onImport,
  onResetFact,
  onResetTable,
  onShowPrivacy,
}: ParentDashboardProps) {
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const { boxCounts, maxBoxCount, hardFacts, tableAvgTimes } = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const fact of profile.facts) {
      if (!fact.introduced) counts[0]++;
      else counts[fact.box]++;
    }

    const hard = profile.facts
      .filter((f) => f.introduced)
      .map((f) => ({
        ...f,
        errorCount: f.history.filter((h) => !h.correct).length,
      }))
      .sort((a, b) => b.errorCount - a.errorCount || a.box - b.box)
      .slice(0, 5)
      .filter((f) => f.errorCount > 0);

    const avgTimes: { table: number; avgMs: number }[] = [];
    for (let t = 2; t <= 9; t++) {
      const allAttempts = factsForTable(profile.facts, t).flatMap((f) => f.history);
      if (allAttempts.length > 0) {
        const avg = allAttempts.reduce((sum, a) => sum + a.responseTimeMs, 0) / allAttempts.length;
        avgTimes.push({ table: t, avgMs: Math.round(avg) });
      }
    }

    return {
      boxCounts: counts,
      maxBoxCount: Math.max(...counts, 1),
      hardFacts: hard,
      tableAvgTimes: avgTimes,
    };
  }, [profile.facts]);

  const recentSessions = useMemo(
    () => [...profile.sessionHistory].reverse().slice(0, 10),
    [profile.sessionHistory],
  );

  const evolutionChart = useMemo(() => {
    const sessions = profile.sessionHistory.slice(-20);
    if (sessions.length < 2) return null;

    const data = sessions.map((s) => ({
      date: new Date(s.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      }),
      pct: Math.round((s.correctCount / s.questionsCount) * 100),
    }));

    const padding = { top: 20, right: 15, bottom: 40, left: 38 };
    const svgW = 400;
    const svgH = 200;
    const chartW = svgW - padding.left - padding.right;
    const chartH = svgH - padding.top - padding.bottom;
    const n = data.length;
    const xStep = chartW / (n - 1);

    const pts = data.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartH - (d.pct / 100) * chartH,
      pct: d.pct,
      date: d.date,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${pts[pts.length - 1].x},${padding.top + chartH} L${pts[0].x},${padding.top + chartH} Z`;

    const maxLabels = 6;
    const labelInterval = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);

    return { padding, svgW, svgH, chartW, chartH, pts, linePath, areaPath, labelInterval };
  }, [profile.sessionHistory]);

  const boxColors = [
    'var(--box-gray)', 'var(--box-red)', 'var(--box-orange)',
    'var(--box-yellow)', 'var(--box-lightgreen)', 'var(--box-green)',
  ];
  const boxLabels = ['N/A', 'B1', 'B2', 'B3', 'B4', 'B5'];

  const handleImport = () => {
    if (importJson.trim()) {
      onImport(importJson.trim());
      setShowImport(false);
      setImportJson('');
    }
  };

  return (
    <div className="parent-dashboard">
      <div className="parent-header">
        <button className="parent-back-btn" onClick={onBack} aria-label="Retour">
          <BackChevron />
        </button>
        <div className="parent-header-titles">
          <div className="parent-eyebrow">Espace parent</div>
          <div className="parent-title">{profile.name}{' \u00b7 '}profil</div>
        </div>
      </div>

      {/* General stats */}
      <div className="parent-section">
        <h3>Vue d'ensemble</h3>
        <div className="parent-stats-grid">
          <div className="parent-stat-card">
            <div className="parent-stat-value">{profile.totalSessions}</div>
            <div className="parent-stat-label">Séances</div>
          </div>
          <div className="parent-stat-card">
            <div className="parent-stat-value">{profile.currentStreak}</div>
            <div className="parent-stat-label">Série actuelle</div>
          </div>
          <div className="parent-stat-card">
            <div className="parent-stat-value">{profile.longestStreak}</div>
            <div className="parent-stat-label">Meilleure série</div>
          </div>
          <div className="parent-stat-card">
            <div className="parent-stat-value">
              {profile.facts.filter((f) => f.box >= 4).length}/
              {profile.facts.length}
            </div>
            <div className="parent-stat-label">Faits maîtrisés</div>
          </div>
        </div>
      </div>

      {/* Box histogram */}
      <div className="parent-section">
        <h3>Répartition par boîte</h3>
        <div className="parent-histogram">
          {boxCounts.map((count, i) => (
            <div key={i} className="parent-histogram-bar">
              <div className="parent-histogram-count">{count}</div>
              <div
                className="parent-histogram-fill"
                style={{
                  height: `${(count / maxBoxCount) * 100}%`,
                  background: boxColors[i],
                }}
              />
              <div className="parent-histogram-label">{boxLabels[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Leitner color grid (diagnostic view — complements the child's
          mystery image in §5.1 by showing the raw box state per fact) */}
      <div className="parent-section">
        <h3>Grille Leitner</h3>
        <ProgressGrid facts={profile.facts} />
      </div>

      {/* Evolution graph */}
      {evolutionChart && (
        <div className="parent-section">
          <h3>Évolution</h3>
          <div className="parent-evolution-chart">
            <svg viewBox={`0 0 ${evolutionChart.svgW} ${evolutionChart.svgH}`} preserveAspectRatio="xMidYMid meet">
              {Y_TICKS.map((tick) => {
                const y = evolutionChart.padding.top + evolutionChart.chartH - (tick / 100) * evolutionChart.chartH;
                return (
                  <Fragment key={`y-${tick}`}>
                    <line
                      x1={evolutionChart.padding.left}
                      y1={y}
                      x2={evolutionChart.padding.left + evolutionChart.chartW}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="1"
                    />
                    <text
                      x={evolutionChart.padding.left - 6}
                      y={y + 1}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill="var(--text-muted)"
                      fontFamily="Nunito, sans-serif"
                    >
                      {tick}%
                    </text>
                  </Fragment>
                );
              })}
              <path d={evolutionChart.areaPath} fill="var(--primary)" opacity="0.1" />
              <path
                d={evolutionChart.linePath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {evolutionChart.pts.map((p, i) => (
                <Fragment key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--surface)"
                    stroke="var(--primary)"
                    strokeWidth="2"
                  />
                  {i % evolutionChart.labelInterval === 0 && (
                    <text
                      x={p.x}
                      y={evolutionChart.padding.top + evolutionChart.chartH + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--text-light)"
                      fontFamily="Nunito, sans-serif"
                    >
                      {p.date}
                    </text>
                  )}
                </Fragment>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Hardest facts */}
      {hardFacts.length > 0 && (
        <div className="parent-section">
          <h3>Faits les plus difficiles</h3>
          <div className="parent-hard-facts">
            {hardFacts.map((f) => {
              const key = getFactKey(f.a, f.b);
              return (
                <div key={key} className="parent-hard-fact">
                  <span className="parent-hard-fact-name">
                    {f.a} {'\u00D7'} {f.b} = {f.product}
                  </span>
                  <span className="parent-hard-fact-errors">
                    {f.errorCount} erreur{f.errorCount > 1 ? 's' : ''} | Boîte{' '}
                    {f.box}
                  </span>
                  {confirmReset === key ? (
                    <button
                      className="parent-reset-confirm-btn"
                      onClick={() => { onResetFact(f.a, f.b); setConfirmReset(null); }}
                    >
                      Confirmer
                    </button>
                  ) : (
                    <button
                      className="parent-reset-btn"
                      onClick={() => setConfirmReset(key)}
                      aria-label={`Réinitialiser ${f.a}×${f.b}`}
                    >
                      {'\u21BA'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Response time per table */}
      {tableAvgTimes.length > 0 && (
        <div className="parent-section">
          <h3>Temps moyen par table</h3>
          <div className="parent-time-table">
            <div className="parent-time-cell header">Table</div>
            <div className="parent-time-cell header">Temps</div>
            <div className="parent-time-cell header">Table</div>
            <div className="parent-time-cell header">Temps</div>
            {tableAvgTimes.map((t) => {
              const seconds = (t.avgMs / 1000).toFixed(1);
              const speedClass =
                t.avgMs < RESPONSE_TIME.FAST
                  ? 'fast'
                  : t.avgMs < RESPONSE_TIME.SLOW
                    ? 'medium'
                    : 'slow';
              return (
                <Fragment key={t.table}>
                  <div className="parent-time-cell header">
                    {'\u00D7'}{t.table}
                  </div>
                  <div className={`parent-time-cell ${speedClass}`}>
                    {seconds}s
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Session history */}
      {profile.sessionHistory.length > 0 && (
        <div className="parent-section">
          <h3>Historique des séances</h3>
          <div className="parent-session-history">
            {recentSessions.map((session) => {
              const dateStr = new Date(session.date).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              });
              const avgSec = (session.averageTimeMs / 1000).toFixed(1);
              return (
                <div key={session.date} className="parent-session-row">
                  <span className="parent-session-date">{dateStr}</span>
                  <span className="parent-session-score">
                    {session.correctCount}/{session.questionsCount}
                  </span>
                  <span className="parent-session-time">{avgSec}s</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset table */}
      <div className="parent-section">
        <h3>Réinitialiser une table</h3>
        <div className="parent-reset-tables">
          {[2, 3, 4, 5, 6, 7, 8, 9].map((t) => {
            const tableFacts = factsForTable(profile.facts, t).filter((f) => f.introduced);
            if (tableFacts.length === 0) return null;
            const confirming = confirmReset === `table-${t}`;
            return (
              <button
                key={t}
                className={`parent-reset-table-btn ${confirming ? 'confirming' : ''}`}
                onClick={() => {
                  if (confirming) {
                    onResetTable(t);
                    setConfirmReset(null);
                  } else {
                    setConfirmReset(`table-${t}`);
                  }
                }}
              >
                {confirming ? `Confirmer \u00D7${t} ?` : `\u00D7${t}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="parent-actions">
        <button className="parent-action-btn" onClick={onExport}>
          Exporter
        </button>
        <button
          className="parent-action-btn"
          onClick={() => setShowImport(!showImport)}
        >
          Importer
        </button>
      </div>

      <div className="parent-actions">
        <a
          className="parent-action-btn"
          href={`${import.meta.env.BASE_URL}guide/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Guide utilisateur
        </a>
        <button
          className="parent-action-btn"
          onClick={() => setShowFeedback(true)}
        >
          Envoyer un avis
        </button>
      </div>

      <div className="parent-actions">
        <button
          className="parent-action-btn parent-action-secondary"
          onClick={onShowPrivacy}
        >
          Confidentialité
        </button>
      </div>

      {showImport && (
        <div className="parent-import-area">
          <textarea
            className="parent-import-textarea"
            placeholder="Collez le JSON ici..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
          />
          <button
            className="parent-import-confirm"
            onClick={handleImport}
            disabled={!importJson.trim()}
          >
            Confirmer l'import
          </button>
        </div>
      )}

      {showFeedback && (
        <FeedbackModal profile={profile} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
