import './RulesScreen.css';

interface RulesScreenProps {
  onBack: () => void;
}

export default function RulesScreen({ onBack }: RulesScreenProps) {
  return (
    <div className="rules-screen">
      <div className="rules-header">
        <button className="rules-back-btn" onClick={onBack} aria-label="Retour">
          {'\u2190'}
        </button>
        <div className="rules-title">{'\uD83D\uDCCF'} Les r\u00E8gles magiques</div>
      </div>

      <div className="rules-content">
        {/* Rule: ×1 */}
        <div className="rule-card">
          <div className="rule-card-icon">{'\u2728'}</div>
          <div className="rule-card-heading">Multiplier par 1</div>
          <div className="rule-card-message">
            Tout nombre multipli\u00E9 par 1 reste le m\u00EAme !
          </div>
          <div className="rule-examples">
            <div className="rule-example">
              2 {'\u00D7'} 1 = <span className="rule-example-highlight">2</span>
            </div>
            <div className="rule-example">
              5 {'\u00D7'} 1 = <span className="rule-example-highlight">5</span>
            </div>
            <div className="rule-example">
              9 {'\u00D7'} 1 = <span className="rule-example-highlight">9</span>
            </div>
            <div className="rule-example">
              123 {'\u00D7'} 1 = <span className="rule-example-highlight">123</span>
            </div>
          </div>
          <div className="rule-card-tip">
            {'\u00C7'}a marche avec tous les nombres, m\u00EAme les tr\u00E8s grands !
          </div>
        </div>

        {/* Rule: ×10 */}
        <div className="rule-card">
          <div className="rule-card-icon">{'\uD83D\uDE80'}</div>
          <div className="rule-card-heading">Multiplier par 10</div>
          <div className="rule-card-message">
            Pour multiplier par 10, on ajoute un z\u00E9ro !
          </div>
          <div className="rule-examples">
            <div className="rule-example">
              3 {'\u00D7'} 10 = <span className="rule-example-highlight">30</span>
            </div>
            <div className="rule-example">
              7 {'\u00D7'} 10 = <span className="rule-example-highlight">70</span>
            </div>
            <div className="rule-example">
              12 {'\u00D7'} 10 = <span className="rule-example-highlight">120</span>
            </div>
            <div className="rule-example">
              25 {'\u00D7'} 10 = <span className="rule-example-highlight">250</span>
            </div>
          </div>
          <div className="rule-card-tip">
            Le nombre glisse d'une place vers la gauche et un 0 prend sa place !
          </div>
        </div>
      </div>
    </div>
  );
}
