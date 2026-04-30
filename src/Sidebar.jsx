import { useState } from 'react';
import { Icon } from './icons.jsx';
import { initials, PALETTE } from './data.js';

export function Sidebar({
  members,
  onAddMember,
  onRemoveMember,
  onRenameMember,
  onReorderMembers,
  activeMembers,
  onToggleMember,
  clients,
  activeClients,
  onToggleClient,
  onAddClient,
  onRemoveClient,
  onRenameClient,
  onSetClientColor,
  tasks,
  confirm,
  onOpenFeedback,
  onSelectAllMembers,
  onSelectAllClients,
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInitials, setNewInitials] = useState('');
  const [addingClient, setAddingClient] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newClientHue, setNewClientHue] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberInitials, setEditMemberInitials] = useState('');
  const [dragMember, setDragMember] = useState(null);
  const [dropMember, setDropMember] = useState(null);

  const sortedClients = [...clients].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
  );

  function defaultNewHue() {
    const used = new Set(clients.map(c => c.hue));
    return (PALETTE.find(p => !used.has(p.h)) || PALETTE[0]).h;
  }

  function openAddClient() {
    setAddingClient(true);
    setNewClient('');
    setNewClientHue(defaultNewHue());
  }

  function closeAddClient() {
    setAddingClient(false);
    setNewClient('');
    setNewClientHue(null);
  }

  function commitAddClient() {
    const trimmed = newClient.trim();
    if (!trimmed) return;
    const picked = PALETTE.find(p => p.h === newClientHue) || PALETTE[0];
    onAddClient(trimmed, picked);
    closeAddClient();
  }

  function commitRename(id) {
    onRenameClient(id, editValue);
    setEditingClient(null);
    setEditValue('');
  }

  function commitMemberRename(id) {
    if (editMemberName.trim()) {
      onRenameMember(id, editMemberName, editMemberInitials);
    }
    setEditingMember(null);
    setEditMemberName('');
    setEditMemberInitials('');
  }

  function commitMember() {
    if (!newName.trim()) return;
    const ini = (newInitials.trim() || newName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2))
      .toUpperCase()
      .slice(0, 3);
    onAddMember(newName.trim(), ini);
    setNewName('');
    setNewInitials('');
    setAdding(false);
  }

  const allMembersOn = activeMembers.size === members.length;
  const allClientsOn = activeClients.size === clients.length;

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo-kairo.png" alt="Kairo" className="brand-logo" />
      </div>

      <div className="sb-section">
        <div className="sb-head">
          <span>Clients · {clients.length}</span>
          <button onClick={() => onSelectAllClients(!allClientsOn)} title={allClientsOn ? 'Tout masquer' : 'Tout afficher'}>
            <Icon.Filter />
          </button>
        </div>
        {sortedClients.map(c => {
          const isEditing = editingClient === c.id;
          if (isEditing) {
            return (
              <div key={c.id} className="client-edit-block" style={{ '--c': c.color }}>
                <div className="member">
                  <span className="swatch"></span>
                  <input
                    autoFocus
                    className="rename-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename(c.id);
                      if (e.key === 'Escape') { setEditingClient(null); setEditValue(''); }
                    }}
                  />
                  <button
                    className="rename-ok"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => commitRename(c.id)}
                    title="Valider"
                  >
                    OK
                  </button>
                </div>
                <div
                  className="palette-grid"
                  onMouseDown={e => e.preventDefault()}
                >
                  {PALETTE.map(p => (
                    <button
                      key={p.h}
                      type="button"
                      className={'palette-swatch' + (c.hue === p.h ? ' selected' : '')}
                      style={{ background: p.c }}
                      title={`Teinte ${p.h}°`}
                      onClick={() => onSetClientColor(c.id, p)}
                    />
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div
              key={c.id}
              className={'member' + (activeClients.has(c.id) ? '' : ' off')}
              style={{ '--c': c.color }}
              onClick={() => onToggleClient(c.id)}
            >
              <span className="swatch"></span>
              <span className="name">{c.name}</span>
              <button
                className="kill edit"
                title="Renommer le client"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingClient(c.id);
                  setEditValue(c.name);
                }}
              >
                <Icon.Pencil />
              </button>
              <button
                className="kill"
                title="Retirer le client"
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await confirm({
                    title: 'Retirer le client',
                    message: `Retirer "${c.name}" de la liste ? Toutes ses tâches seront définitivement supprimées.`,
                    confirmLabel: 'Retirer',
                    danger: true,
                  });
                  if (ok) onRemoveClient(c.id);
                }}
              >
                <Icon.X />
              </button>
            </div>
          );
        })}
        {addingClient ? (
          <div className="add-client-block">
            <div className="add-member-row">
              <input
                autoFocus
                placeholder="Nom du client"
                value={newClient}
                onChange={e => setNewClient(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitAddClient();
                  if (e.key === 'Escape') closeAddClient();
                }}
              />
              <button onMouseDown={e => e.preventDefault()} onClick={commitAddClient}>OK</button>
            </div>
            <div className="palette-grid" onMouseDown={e => e.preventDefault()}>
              {PALETTE.map(p => (
                <button
                  key={p.h}
                  type="button"
                  className={'palette-swatch' + (newClientHue === p.h ? ' selected' : '')}
                  style={{ background: p.c }}
                  title={`Teinte ${p.h}°`}
                  onClick={() => setNewClientHue(p.h)}
                />
              ))}
            </div>
          </div>
        ) : (
          <button className="btn-ghost" style={{ marginTop: 4, marginLeft: 4 }} onClick={openAddClient}>
            <Icon.Plus s={12} /> Ajouter un client
          </button>
        )}
      </div>

      <div className="sb-section sb-team">
        <div className="sb-head">
          <span>Équipe · {members.length}</span>
          <button onClick={() => onSelectAllMembers(!allMembersOn)} title={allMembersOn ? 'Tout masquer' : 'Tout afficher'}>
            <Icon.Filter />
          </button>
        </div>
        {members.map(m => {
          const isEditing = editingMember === m.id;
          if (isEditing) {
            return (
              <div key={m.id} className="member member-neutral member-editing">
                <span className="avatar-mini">{initials({ name: editMemberName, initials: editMemberInitials })}</span>
                <input
                  autoFocus
                  className="rename-input"
                  placeholder="Prénom"
                  value={editMemberName}
                  onChange={e => setEditMemberName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitMemberRename(m.id);
                    if (e.key === 'Escape') { setEditingMember(null); setEditMemberName(''); setEditMemberInitials(''); }
                  }}
                />
                <input
                  className="rename-input rename-initials"
                  placeholder="Init."
                  maxLength={3}
                  value={editMemberInitials}
                  onChange={e => setEditMemberInitials(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitMemberRename(m.id);
                    if (e.key === 'Escape') { setEditingMember(null); setEditMemberName(''); setEditMemberInitials(''); }
                  }}
                />
                <button className="rename-ok" onClick={() => commitMemberRename(m.id)} title="Valider">OK</button>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={
                'member member-neutral' +
                (activeMembers.has(m.id) ? '' : ' off') +
                (dragMember === m.id ? ' dragging' : '') +
                (dropMember === m.id ? ' drop-target' : '')
              }
              draggable
              onDragStart={(e) => {
                setDragMember(m.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', m.id);
              }}
              onDragOver={(e) => {
                if (!dragMember || dragMember === m.id) return;
                e.preventDefault();
                setDropMember(m.id);
              }}
              onDragLeave={() => { if (dropMember === m.id) setDropMember(null); }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragMember && dragMember !== m.id) onReorderMembers(dragMember, m.id);
                setDragMember(null);
                setDropMember(null);
              }}
              onDragEnd={() => { setDragMember(null); setDropMember(null); }}
              onClick={() => onToggleMember(m.id)}
            >
              <span className="avatar-mini">{initials(m)}</span>
              <span className="name">{m.name}</span>
              <button
                className="kill edit"
                title="Renommer le membre"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMember(m.id);
                  setEditMemberName(m.name);
                  setEditMemberInitials(m.initials || '');
                }}
              >
                <Icon.Pencil />
              </button>
              <button
                className="kill"
                title="Retirer du planning"
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await confirm({
                    title: 'Retirer un membre',
                    message: `Retirer ${m.name} de l'équipe ? Toutes ses tâches seront définitivement supprimées.`,
                    confirmLabel: 'Retirer',
                    danger: true,
                  });
                  if (ok) onRemoveMember(m.id);
                }}
              >
                <Icon.X />
              </button>
            </div>
          );
        })}
        {adding ? (
          <div className="add-member-row" style={{ flexWrap: 'wrap' }}>
            <input
              autoFocus
              placeholder="Prénom"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitMember();
                if (e.key === 'Escape') { setNewName(''); setNewInitials(''); setAdding(false); }
              }}
              style={{ flex: '2 1 100px' }}
            />
            <input
              placeholder="Init."
              value={newInitials}
              maxLength={3}
              onChange={e => setNewInitials(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter') commitMember();
                if (e.key === 'Escape') { setNewName(''); setNewInitials(''); setAdding(false); }
              }}
              style={{
                flex: '1 1 50px',
                maxWidth: 56,
                textAlign: 'center',
                textTransform: 'uppercase',
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 600,
              }}
            />
            <button onClick={commitMember}>OK</button>
          </div>
        ) : (
          <button className="btn-ghost" style={{ marginTop: 4, marginLeft: 4 }} onClick={() => setAdding(true)}>
            <Icon.Plus s={12} /> Ajouter un membre
          </button>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn-ghost-pill" onClick={onOpenFeedback}>
          <Icon.Sparkles s={14} /> Améliorer Kairo
        </button>
      </div>
    </aside>
  );
}
