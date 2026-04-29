import { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';

const FEEDBACK_TO = 'ltournier@webexpr.fr';

export function FeedbackModal({ onClose }) {
  const [type, setType] = useState('evolution');
  const [authorName, setAuthorName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function submit() {
    if (!description.trim()) return;
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

    const mailto = `mailto:${FEEDBACK_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onClose();
  }

  const canSubmit = description.trim().length > 0;

  return (
    <div
      className="scrim"
      onClick={(e) => { if (e.target.classList.contains('scrim')) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <header>
          <h3>Améliorer Kairo</h3>
          <button className="nav-btn" onClick={onClose}><Icon.X s={14} /></button>
        </header>
        <div className="body">
          <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: 12.5, lineHeight: 1.5 }}>
            Une idée d'évolution ou un bug à signaler ? Ce retour sera envoyé par mail à l'équipe produit.
          </p>

          <div className="field">
            <label>Type</label>
            <div className="kind-toggle">
              <button
                type="button"
                className={'kt-opt' + (type === 'bug' ? ' on' : '')}
                onClick={() => setType('bug')}
              >
                <span className="kt-icon">🐛</span> Bug
              </button>
              <button
                type="button"
                className={'kt-opt' + (type === 'evolution' ? ' on' : '')}
                onClick={() => setType('evolution')}
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
              style={{ minHeight: 110 }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            />
          </div>
        </div>
        <footer>
          <span />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn-primary" onClick={submit} disabled={!canSubmit}>
              Envoyer
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
