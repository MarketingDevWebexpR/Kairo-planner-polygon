import { useEffect } from 'react';
import { Icon } from './icons.jsx';

export function ConfirmModal({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onConfirm, onCancel]);

  return (
    <div
      className="scrim"
      onClick={(e) => { if (e.target.classList.contains('scrim')) onCancel(); }}
    >
      <div className="modal modal-confirm" role="alertdialog" aria-modal="true">
        <header>
          <h3>{title}</h3>
          <button className="nav-btn" onClick={onCancel}><Icon.X s={14} /></button>
        </header>
        <div className="body">
          <p className="confirm-msg">{message}</p>
        </div>
        <footer>
          <span />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onCancel} autoFocus>{cancelLabel}</button>
            <button
              className={danger ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
