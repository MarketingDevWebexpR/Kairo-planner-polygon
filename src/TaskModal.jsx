import { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import {
  isoDay,
  parseISO,
  addDays,
  diffDays,
  initials,
  ABSENCE_REASONS,
} from './data.js';

export function TaskModal({ task, members, clients, clientMap, onSave, onDelete, onClose, confirm }) {
  const isNew = !task.id;
  const [kind, setKind] = useState(task.kind || 'task');
  const [title, setTitle] = useState(task.title || '');
  const [clientId, setClientId] = useState(task.clientId || clients[0]?.id);
  const [reason, setReason] = useState(task.reason || ABSENCE_REASONS[0].id);
  const [memberId, setMemberId] = useState(task.memberId || members[0]?.id);
  const [start, setStart] = useState(task.start || isoDay(new Date()));
  const [end, setEnd] = useState(task.end || task.start || isoDay(new Date()));
  const [half, setHalf] = useState(task.half || false);
  const [notes, setNotes] = useState(task.notes || '');
  const dur = diffDays(start, end) + 1;
  const cli = clientMap[clientId] || { color: 'oklch(60% 0 0)', hue: 0 };
  const isAbsence = kind === 'absence';
  const accent = isAbsence
    ? { color: 'oklch(58% 0.05 250)', hue: 250 }
    : { color: cli.color, hue: cli.hue };

  function setDuration(days, halfMode) {
    if (halfMode) {
      setEnd(start);
      setHalf(halfMode);
    } else {
      setEnd(isoDay(addDays(parseISO(start), days - 1)));
      setHalf(false);
    }
  }

  function submit() {
    if (isAbsence) {
      onSave({
        id: task.id,
        kind: 'absence',
        memberId,
        reason,
        start,
        end: half ? start : end,
        half,
        notes: notes.trim(),
      });
      return;
    }
    if (!title.trim() || !clientId) return;
    onSave({
      id: task.id,
      kind: 'task',
      memberId,
      title: title.trim(),
      clientId,
      start,
      end: half ? start : end,
      half,
      notes: notes.trim(),
    });
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const headerTitle = isAbsence
    ? (isNew ? 'Nouvelle absence' : "Modifier l'absence")
    : (isNew ? 'Nouvelle tâche' : 'Modifier la tâche');

  const canSubmit = isAbsence ? true : (title.trim().length > 0 && !!clientId);

  return (
    <div
      className="scrim"
      onClick={(e) => { if (e.target.classList.contains('scrim')) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <header>
          <h3>{headerTitle}</h3>
          <button className="nav-btn" onClick={onClose}><Icon.X s={14} /></button>
        </header>
        <div className="body">
          {isNew && (
            <div className="kind-toggle">
              <button
                type="button"
                className={'kt-opt' + (!isAbsence ? ' on' : '')}
                onClick={() => setKind('task')}
              >
                <span className="kt-icon">●</span> Tâche
              </button>
              <button
                type="button"
                className={'kt-opt' + (isAbsence ? ' on' : '')}
                onClick={() => setKind('absence')}
              >
                <span className="kt-icon">⛱</span> Absence
              </button>
            </div>
          )}

          {!isAbsence && (
            <div className="field">
              <label>Titre</label>
              <input
                autoFocus
                placeholder="Ex. Atelier discovery"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
              />
            </div>
          )}

          {!isAbsence && (
            <div className="field">
              <label>Client</label>
              <div className="chip-row">
                {clients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={'chip' + (clientId === c.id ? ' on' : '')}
                    style={{ '--c': c.color, '--h': c.hue }}
                    onClick={() => setClientId(c.id)}
                  >
                    <span className="chip-dot"></span>{c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isAbsence && (
            <div className="field">
              <label>Motif</label>
              <div className="chip-row">
                {ABSENCE_REASONS.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={'chip chip-neutral' + (reason === r.id ? ' on' : '')}
                    onClick={() => setReason(r.id)}
                  >
                    <span className="r-icon" aria-hidden="true">{r.icon}</span>{r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label>Personne</label>
            <div className="chip-row">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={'chip chip-neutral' + (memberId === m.id ? ' on' : '')}
                  onClick={() => setMemberId(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Période</label>
            <div className="row">
              <input
                type="date"
                value={start}
                onChange={e => {
                  setStart(e.target.value);
                  if (parseISO(e.target.value) > parseISO(end)) setEnd(e.target.value);
                }}
              />
              <input
                type="date"
                value={end}
                disabled={!!half}
                onChange={e => setEnd(e.target.value)}
              />
            </div>
            <div className="duration-row" style={{ marginTop: 6 }}>
              <button type="button" className={'chip' + (half === 'am' ? ' on' : '')} style={{ '--c': accent.color, '--h': accent.hue }} onClick={() => setDuration(0.5, 'am')}>½j matin</button>
              <button type="button" className={'chip' + (half === 'pm' ? ' on' : '')} style={{ '--c': accent.color, '--h': accent.hue }} onClick={() => setDuration(0.5, 'pm')}>½j après-midi</button>
              <button type="button" className={'chip' + (!half && dur === 1 ? ' on' : '')} style={{ '--c': accent.color, '--h': accent.hue }} onClick={() => setDuration(1)}>1j</button>
              <button type="button" className={'chip' + (!half && dur === 2 ? ' on' : '')} style={{ '--c': accent.color, '--h': accent.hue }} onClick={() => setDuration(2)}>2j</button>
              <button type="button" className={'chip' + (!half && dur === 3 ? ' on' : '')} style={{ '--c': accent.color, '--h': accent.hue }} onClick={() => setDuration(3)}>3j</button>
              <button type="button" className={'chip' + (!half && dur === 5 ? ' on' : '')} style={{ '--c': accent.color, '--h': accent.hue }} onClick={() => setDuration(5)}>1 sem.</button>
            </div>
          </div>

          <div className="field">
            <label>
              Notes{' '}
              <span style={{ color: 'var(--ink-4)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                · optionnel
              </span>
            </label>
            <textarea
              placeholder={isAbsence ? 'Précisions, remplaçant…' : 'Contexte, livrables, dépendances…'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

        </div>
        <footer>
          {!isNew ? (
            <button
              className="btn-danger-ghost"
              onClick={async () => {
                const ok = await confirm({
                  title: isAbsence ? 'Supprimer une absence' : 'Supprimer une tâche',
                  message: isAbsence
                    ? 'Cette absence sera définitivement supprimée.'
                    : `« ${title || 'cette tâche'} » sera définitivement supprimée.`,
                  confirmLabel: 'Supprimer',
                  danger: true,
                });
                if (ok) onDelete(task.id);
              }}
            >
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn-primary" onClick={submit} disabled={!canSubmit}>
              {isNew ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
