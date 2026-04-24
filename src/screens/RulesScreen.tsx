import './RulesScreen.css';

interface RulesScreenProps {
  onBack: () => void;
}

function BackChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RulesScreen({ onBack }: RulesScreenProps) {
  return (
    <div className="rules-screen">
      <div className="rules-header">
        <button className="rules-back-btn" onClick={onBack} aria-label="Retour">
          <BackChevron />
        </button>
        <div className="rules-title">Mes deux règles</div>
      </div>

      <div className="rules-content">
        <div className="rules-intro">
          Deux raccourcis à connaître par cœur. Après, ce sera facile !
        </div>

        {/* Règle ×1 */}
        <div className="rule-card rule-card-indigo">
          <div className="rule-card-head">
            <div className="rule-card-badge">×1</div>
            <div>
              <div className="rule-card-eyebrow">Règle n°1</div>
              <div className="rule-card-heading">Multiplier par 1</div>
            </div>
          </div>
          <div className="rule-card-message">
            Tout nombre multiplié par 1 <b>reste le même</b> !
          </div>
          <div className="rule-examples">
            <div className="rule-example">
              2 {'×'} 1 = <span className="rule-example-highlight">2</span>
            </div>
            <div className="rule-example">
              5 {'×'} 1 = <span className="rule-example-highlight">5</span>
            </div>
            <div className="rule-example">
              9 {'×'} 1 = <span className="rule-example-highlight">9</span>
            </div>
            <div className="rule-example">
              123 {'×'} 1 = <span className="rule-example-highlight">123</span>
            </div>
          </div>
          <div className="rule-card-tip">
            Ça marche avec tous les nombres, même les très grands !
          </div>
        </div>

        {/* Règle ×10 */}
        <div className="rule-card rule-card-coral">
          <div className="rule-card-head">
            <div className="rule-card-badge">×10</div>
            <div>
              <div className="rule-card-eyebrow">Règle n°2</div>
              <div className="rule-card-heading">Multiplier par 10</div>
            </div>
          </div>
          <div className="rule-card-message">
            Les chiffres glissent d'une place vers la gauche : un <b>0</b> vient prendre la place des unités !
          </div>
          <div className="rule-examples">
            <div className="rule-example">3 {'×'} 10 = <span className="rule-example-highlight">30</span></div>
            <div className="rule-example">7 {'×'} 10 = <span className="rule-example-highlight">70</span></div>
            <div className="rule-example">12 {'×'} 10 = <span className="rule-example-highlight">120</span></div>
            <div className="rule-example">25 {'×'} 10 = <span className="rule-example-highlight">250</span></div>
          </div>
          <div className="rule-card-tip">
            Astuce : tous les résultats de la table de 10 se terminent par 0 !
          </div>
        </div>
      </div>
    </div>
  );
}
