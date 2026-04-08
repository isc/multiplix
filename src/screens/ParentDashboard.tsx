import { useState, useMemo, Fragment } from 'react';
import type { UserProfile } from '../types';
import { RESPONSE_TIME } from '../types';
import { factsForTable } from '../lib/badges';
import { getFactKey } from '../lib/facts';
import './ParentDashboard.css';

interface ParentDashboardProps {
  profile: UserProfile;
  onBack: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
}

export default function ParentDashboard({
  profile,
  onBack,
  onExport,
  onImport,
}: ParentDashboardProps) {
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');

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
          {'\u2190'}
        </button>
        <div className="parent-title">Tableau de bord parent</div>
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

      {/* Hardest facts */}
      {hardFacts.length > 0 && (
        <div className="parent-section">
          <h3>Faits les plus difficiles</h3>
          <div className="parent-hard-facts">
            {hardFacts.map((f) => (
              <div key={getFactKey(f.a, f.b)} className="parent-hard-fact">
                <span className="parent-hard-fact-name">
                  {f.a} {'\u00D7'} {f.b} = {f.product}
                </span>
                <span className="parent-hard-fact-errors">
                  {f.errorCount} erreur{f.errorCount > 1 ? 's' : ''} | Boîte{' '}
                  {f.box}
                </span>
              </div>
            ))}
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
      {(profile.sessionHistory ?? []).length > 0 && (
        <div className="parent-section">
          <h3>Historique des s{'\u00E9'}ances</h3>
          <div className="parent-session-history">
            {[...(profile.sessionHistory ?? [])]
              .reverse()
              .slice(0, 10)
              .map((session, i) => {
                const dateStr = new Date(session.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                });
                const avgSec = (session.averageTimeMs / 1000).toFixed(1);
                return (
                  <div key={i} className="parent-session-row">
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
    </div>
  );
}
