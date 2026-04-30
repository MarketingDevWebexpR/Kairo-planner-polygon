import { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { supabase } from './supabase.js';

const FALLBACK_EMAIL = 'ltournier@webexpr.fr';

export function FeedbackModal({ onClose }) {
  const [type, setType] = useState('evolution');
  const [authorName, setAuthorName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && status !== 'sending') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, status]);

  function sendByMail() {
    const author = authorName.trim() || 'Anonyme';
    const typeLabel = type === 'bug' ? 'Bug' : 'Évolution';
    const subject = `[Kairo] ${typeLabel} — ${author}`;
    const body = [
      `Type : ${typeLabel}`,
      `Auteur : ${author}`,
      ``,
      `Description :`,
      description.trim(),
      ``,
      `—`,
      `Envoyé depuis Kairo · ${new Date().toLocaleString('fr-FR')}`,
    ].join('\n');
    window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    onClose();
  }

  async function submit() {
    if (!description.trim() || status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    const { error } = await supabase.from('feedbacks').insert({
      type,
      author_name: authorName.trim() || null,
      description: description.trim(),
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message || "Une erreur est survenue.");
      return;
    }
    setStatus('sent');
  }

  const canSubmit = description.trim().length > 0 && status !== 'sending';
  const isSent = status === 'sent';
  const isSending = status === 'sending';
  const hasError = status === 'error';

  return (
    <div
      className="scrim"
      onClick={(e) => { if (e.target.classList.contains('scrim') && !isSending) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <header>
          <h3>Améliorer Kairo</h3>
          <button className="nav-btn" onClick={onClose} disabled={isSending}>
            <Icon.X s={14} />
          </button>
        </header>

        {isSent ? (
          <>
            <div className="body" style={{ paddingTop: 28, paddingBottom: 24, textAlign: 'center' }}>
              <div className="feedback-success-mark" aria-hidden="true">✓</div>
              <p style={{ margin: '14px 0 0', fontWeight: 600, fontSize: 15 }}>
                Merci pour ta contribution&nbsp;!
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--ink-3)', fontSize: 12.5, lineHeight: 1.5 }}>
                L'équipe produit s'en charge prochainement&nbsp;:)
              </p>
            </div>
            <footer>
              <span />
              <button className="btn-primary" onClick={onClose} autoFocus>Fermer</button>
            </footer>
          </>
        ) : (
          <>
            <div className="body">
              <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: 12.5, lineHeight: 1.5 }}>
                Une idée d'évolution ou un bug à signaler&nbsp;? Ce retour sera enregistré pour l'équipe produit.
              </p>

              <div className="field">
                <label>Type</label>
                <div className="kind-toggle">
                  <button
                    type="button"
                    className={'kt-opt' + (type === 'bug' ? ' on' : '')}
                    onClick={() => setType('bug')}
                    disabled={isSending}
                  >
                    <span className="kt-icon">🐛</span> Bug
                  </button>
                  <button
                    type="button"
                    className={'kt-opt' + (type === 'evolution' ? ' on' : '')}
                    onClick={() => setType('evolution')}
                    disabled={isSending}
                  >
                    <span className="kt-icon">✨</span> Évolution
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Ton prénom</label>
                <input
                  type="text"
                  placeholder="Renseigne ton prénom"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  disabled={isSending}
                />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea
                  autoFocus
                  placeholder={
                    type === 'bug'
                      ? 'Décris le problème, les étapes pour le reproduire, le comportement attendu…'
                      : 'Ce que tu aimerais voir évoluer ou ajouter dans l\'outil…'
                  }
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isSending}
                  style={{ minHeight: 110 }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
                />
              </div>

              {hasError && (
                <div className="feedback-error">
                  <strong>Échec de l'envoi.</strong> {errorMsg}
                  <button type="button" className="feedback-mailto" onClick={sendByMail}>
                    Envoyer par mail à la place
                  </button>
                </div>
              )}
            </div>

            <footer>
              <span />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={onClose} disabled={isSending}>
                  Annuler
                </button>
                <button className="btn-primary" onClick={submit} disabled={!canSubmit}>
                  {isSending ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
