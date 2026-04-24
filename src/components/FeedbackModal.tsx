import { useEffect, useState } from 'react';
import { submitFeedback, buildContext, feedbackEnabled } from '../lib/feedback';
import type { UserProfile } from '../types';
import './FeedbackModal.css';

interface FeedbackModalProps {
  profile: UserProfile | null;
  onClose: () => void;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function FeedbackModal({ profile, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'sending') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    try {
      await submitFeedback({
        message: message.trim(),
        email: email.trim() || undefined,
        context: buildContext(profile),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Envoi impossible');
    }
  };

  if (!feedbackEnabled) {
    return (
      <div className="feedback-overlay" onClick={onClose}>
        <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
          <p className="feedback-unavailable">Le formulaire n'est pas configuré.</p>
          <button type="button" className="feedback-close-btn" onClick={onClose}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-overlay" onClick={status !== 'sending' ? onClose : undefined}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <h2 id="feedback-title" className="feedback-title">Votre avis</h2>

        {status === 'success' ? (
          <div className="feedback-success">
            <p className="feedback-success-text">Merci, c'est bien reçu !</p>
            <button type="button" className="feedback-close-btn" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <label className="feedback-label" htmlFor="feedback-message">
              Dites-nous ce qui va, ce qui ne va pas, ou ce que vous aimeriez voir
            </label>
            <textarea
              id="feedback-message"
              className="feedback-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message…"
              maxLength={5000}
              rows={6}
              required
              disabled={status === 'sending'}
            />

            <label className="feedback-label" htmlFor="feedback-email">
              Email (optionnel, si vous souhaitez une réponse)
            </label>
            <input
              id="feedback-email"
              type="email"
              className="feedback-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              maxLength={320}
              disabled={status === 'sending'}
            />

            {status === 'error' && (
              <p className="feedback-error">Erreur : {errorMsg}</p>
            )}

            <div className="feedback-actions">
              <button
                type="button"
                className="feedback-cancel-btn"
                onClick={onClose}
                disabled={status === 'sending'}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="feedback-submit-btn"
                disabled={!message.trim() || status === 'sending'}
              >
                {status === 'sending' ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
