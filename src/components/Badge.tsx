import './Badge.css';

interface BadgeProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  earned: boolean;
  earnedDate?: string;
}

export default function Badge({ badge, earned, earnedDate }: BadgeProps) {
  return (
    <div className={`badge ${earned ? 'earned' : 'locked'}`}>
      <div className="badge-icon">{badge.icon}</div>
      <div className="badge-name">{badge.name}</div>
      {earned && earnedDate && (
        <div className="badge-date">
          {new Date(earnedDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </div>
      )}
      {!earned && <div className="badge-date">???</div>}
    </div>
  );
}

// All possible badges for display in BadgesScreen
export const ALL_BADGES = [
  {
    id: 'premier-pas',
    name: 'Premier pas',
    description: 'Terminer la première séance',
    icon: '\uD83C\uDF31',
  },
  {
    id: 'regulier',
    name: 'Régulière',
    description: '7 jours consécutifs',
    icon: '\uD83D\uDD25',
  },
  {
    id: 'machine',
    name: 'Machine',
    description: '10 bonnes réponses de suite',
    icon: '\u26A1',
  },
  {
    id: 'exploratrice',
    name: 'Exploratrice',
    description: 'Avoir vu tous les faits',
    icon: '\uD83D\uDDFA\uFE0F',
  },
  {
    id: 'table-2',
    name: 'Table de 2',
    description: 'Maîtriser la table de 2',
    icon: '\u2B50',
  },
  {
    id: 'table-3',
    name: 'Table de 3',
    description: 'Maîtriser la table de 3',
    icon: '\u2B50',
  },
  {
    id: 'table-4',
    name: 'Table de 4',
    description: 'Maîtriser la table de 4',
    icon: '\u2B50',
  },
  {
    id: 'table-5',
    name: 'Table de 5',
    description: 'Maîtriser la table de 5',
    icon: '\u2B50',
  },
  {
    id: 'table-6',
    name: 'Table de 6',
    description: 'Maîtriser la table de 6',
    icon: '\u2B50',
  },
  {
    id: 'table-7',
    name: 'Table de 7',
    description: 'Maîtriser la table de 7',
    icon: '\u2B50',
  },
  {
    id: 'table-8',
    name: 'Table de 8',
    description: 'Maîtriser la table de 8',
    icon: '\u2B50',
  },
  {
    id: 'table-9',
    name: 'Table de 9',
    description: 'Maîtriser la table de 9',
    icon: '\u2B50',
  },
  {
    id: 'mathematicienne',
    name: 'Mathématicienne',
    description: 'Tous les faits en boîte 5',
    icon: '\uD83C\uDFC6',
  },
  {
    id: 'veloce',
    name: 'Véloce',
    description: '5 réponses < 2s de suite',
    icon: '\uD83D\uDE80',
  },
  {
    id: 'perseverante',
    name: 'Persévérante',
    description: 'Revenir après 3+ jours',
    icon: '\uD83D\uDCAA',
  },
  {
    id: 'flamme-eternelle',
    name: 'Flamme éternelle',
    description: '30 jours consécutifs',
    icon: '\uD83C\uDF1F',
  },
];
