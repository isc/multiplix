import { Component, type ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

// Filet de sécurité : un bug de rendu ne doit pas laisser l'enfant devant un
// écran blanc. La progression reste en localStorage, donc un simple reload
// suffit à reprendre. Offre aussi un téléchargement de sauvegarde brute pour
// les cas où le bug est causé par un profil corrompu.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    const message = err instanceof Error ? err.message : String(err);
    return { hasError: true, message };
  }

  componentDidCatch(err: unknown): void {
    // Console uniquement — pas d'intégration tierce de tracking.
    console.error('[ErrorBoundary]', err);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleDownloadBackup = (): void => {
    try {
      const raw = localStorage.getItem('multiplix-profile');
      if (!raw) return;
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multiplix-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Si même le téléchargement échoue, on laisse le parent recharger.
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-boundary">
        <div className="error-boundary-card">
          <h1 className="error-boundary-title">Oups, un petit bug</h1>
          <p className="error-boundary-text">
            L'application a rencontré un problème. Ta progression est enregistrée
            sur cet appareil — rechargez la page pour reprendre.
          </p>
          <div className="error-boundary-actions">
            <button type="button" className="error-boundary-primary" onClick={this.handleReload}>
              Recharger
            </button>
            <button type="button" className="error-boundary-secondary" onClick={this.handleDownloadBackup}>
              Télécharger une sauvegarde
            </button>
          </div>
          {this.state.message && (
            <details className="error-boundary-details">
              <summary>Détails techniques</summary>
              <pre>{this.state.message}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
