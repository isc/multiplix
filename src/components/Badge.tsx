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
