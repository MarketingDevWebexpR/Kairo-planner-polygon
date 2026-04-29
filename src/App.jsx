import { useState, useEffect, useMemo } from 'react';
import { Icon } from './icons.jsx';
import { Sidebar } from './Sidebar.jsx';
import { WeekView } from './WeekView.jsx';
import { MonthView } from './MonthView.jsx';
import { TaskModal } from './TaskModal.jsx';
import { ConfirmModal } from './ConfirmModal.jsx';
import { FeedbackModal } from './FeedbackModal.jsx';
import {
  PALETTE,
  DEFAULT_MEMBERS,
  DEFAULT_CLIENTS,
  isoDay,
  parseISO,
  addDays,
  startOfWeekMonday,
  fmtMonthYear,
  fmtShortMonth,
  isoWeek,
  monthWeeks,
  seedTasks,
} from './data.js';

const STORAGE_KEY = 'polygon_planning_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function App() {
  const saved = loadState();

  const [members, setMembers] = useState(saved?.members || DEFAULT_MEMBERS);
  const [clients, setClients] = useState(saved?.clients || DEFAULT_CLIENTS);
  const [tasks, setTasks] = useState(saved?.tasks || seedTasks(DEFAULT_MEMBERS.map(m => m.id)));
  const [view, setView] = useState(saved?.view || 'week');
  const [cursorISO, setCursorISO] = useState(saved?.cursorISO || isoDay(new Date()));
  const [activeMembers, setActiveMembers] = useState(
    new Set(saved?.activeMembers || (saved?.members || DEFAULT_MEMBERS).map(m => m.id)),
  );
  const [activeClients, setActiveClients] = useState(
    new Set(saved?.activeClients || (saved?.clients || DEFAULT_CLIENTS).map(c => c.name)),
  );
  const [editingTask, setEditingTask] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  function askConfirm(opts) {
    return new Promise((resolve) => {
      setConfirmState({
        ...opts,
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
  }

  useEffect(() => {
    saveState({
      members,
      clients,
      tasks,
      view,
      cursorISO,
      activeMembers: [...activeMembers],
      activeClients: [...activeClients],
    });
  }, [members, clients, tasks, view, cursorISO, activeMembers, activeClients]);

  const todayISO = isoDay(new Date());
  const cursor = parseISO(cursorISO);
  const monday = startOfWeekMonday(cursor);

  const clientMap = useMemo(() => {
    const m = {};
    clients.forEach(c => (m[c.name] = c));
    return m;
  }, [clients]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!activeMembers.has(t.memberId)) return false;
      if (t.kind === 'absence') return true;
      return activeClients.has(t.client);
    });
  }, [tasks, activeMembers, activeClients]);

  const visibleMembers = useMemo(
    () => members.filter(m => activeMembers.has(m.id)),
    [members, activeMembers],
  );

  function navPrev() {
    if (view === 'week') setCursorISO(isoDay(addDays(cursor, -7)));
    else setCursorISO(isoDay(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)));
  }
  function navNext() {
    if (view === 'week') setCursorISO(isoDay(addDays(cursor, 7)));
    else setCursorISO(isoDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)));
  }
  function navToday() { setCursorISO(isoDay(new Date())); }

  let periodTitle, periodSub;
  if (view === 'week') {
    const sun = addDays(monday, 4);
    const sameMonth = monday.getMonth() === sun.getMonth();
    periodTitle = sameMonth
      ? `${monday.getDate()}–${sun.getDate()} ${fmtMonthYear(monday).toLowerCase()}`
      : `${monday.getDate()} ${fmtShortMonth(monday)} – ${sun.getDate()} ${fmtShortMonth(sun)} ${sun.getFullYear()}`;
    periodSub = '';
  } else {
    periodTitle = fmtMonthYear(cursor);
    periodSub = `${monthWeeks(cursor).length} semaines`;
  }

  function upsertTask(t) {
    if (t._delete) {
      setTasks(prev => prev.filter(x => x.id !== t.id));
      setEditingTask(null);
      return;
    }
    setTasks(prev => {
      if (t.id) return prev.map(x => (x.id === t.id ? { ...x, ...t } : x));
      return [...prev, { ...t, id: 'task_' + Math.random().toString(36).slice(2, 9) }];
    });
    setEditingTask(null);
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(x => x.id !== id));
    setEditingTask(null);
  }

  function moveTask(t) {
    setTasks(prev => prev.map(x => (x.id === t.id ? { ...x, ...t } : x)));
  }

  function addMember(name, ini) {
    const id = 'm_' + Math.random().toString(36).slice(2, 7);
    setMembers(prev => [...prev, { id, name, initials: ini || name.slice(0, 2).toUpperCase() }]);
    setActiveMembers(s => new Set([...s, id]));
  }

  function removeMember(id) {
    setMembers(prev => prev.filter(m => m.id !== id));
    setTasks(prev => prev.filter(t => t.memberId !== id));
    setActiveMembers(s => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }

  function toggleMember(id) {
    setActiveMembers(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function selectAllMembers(on) {
    setActiveMembers(on ? new Set(members.map(m => m.id)) : new Set());
  }

  function renameMember(id, name, ini) {
    const trimmedName = (name || '').trim();
    const trimmedIni = (ini || '').trim().toUpperCase().slice(0, 3);
    if (!trimmedName) return;
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, name: trimmedName, initials: trimmedIni || m.initials } : m)));
  }

  function reorderMembers(draggedId, targetId) {
    setMembers(prev => {
      const arr = [...prev];
      const from = arr.findIndex(m => m.id === draggedId);
      const to = arr.findIndex(m => m.id === targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }


  function addClient(name, picked) {
    if (clients.find(c => c.name === name)) return;
    let color, hue;
    if (picked && picked.c != null && picked.h != null) {
      color = picked.c;
      hue = picked.h;
    } else {
      const usedHues = new Set(clients.map(c => c.hue));
      const palette = PALETTE.find(p => !usedHues.has(p.h)) || PALETTE[clients.length % PALETTE.length];
      color = palette.c;
      hue = palette.h;
    }
    setClients(prev => [...prev, { name, color, hue }]);
    setActiveClients(s => new Set([...s, name]));
  }

  function setClientColor(name, picked) {
    if (!picked) return;
    setClients(prev => prev.map(c => (c.name === name ? { ...c, color: picked.c, hue: picked.h } : c)));
  }

  function removeClient(name) {
    setClients(prev => prev.filter(c => c.name !== name));
    setTasks(prev => prev.filter(t => t.client !== name));
    setActiveClients(s => {
      const n = new Set(s);
      n.delete(name);
      return n;
    });
  }

  function renameClient(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (clients.find(c => c.name === trimmed)) return;
    setClients(prev => prev.map(c => (c.name === oldName ? { ...c, name: trimmed } : c)));
    setTasks(prev => prev.map(t => (t.client === oldName ? { ...t, client: trimmed } : t)));
    setActiveClients(s => {
      if (!s.has(oldName)) return s;
      const n = new Set(s);
      n.delete(oldName);
      n.add(trimmed);
      return n;
    });
  }

  function toggleClient(c) {
    setActiveClients(s => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c); else n.add(c);
      return n;
    });
  }

  function selectAllClients(on) {
    setActiveClients(on ? new Set(clients.map(c => c.name)) : new Set());
  }

  function openCreate(seed = {}) {
    const m = seed.memberId || visibleMembers[0]?.id || members[0]?.id;
    setEditingTask({
      kind: seed.kind || 'task',
      title: '',
      client: clients[0]?.name,
      reason: 'conges',
      memberId: m,
      start: seed.start || todayISO,
      end: seed.end || seed.start || todayISO,
      half: seed.half || false,
      notes: '',
    });
  }

  return (
    <div className="app">
      <Sidebar
        members={members}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onRenameMember={renameMember}
        onReorderMembers={reorderMembers}
        activeMembers={activeMembers}
        onToggleMember={toggleMember}
        onSelectAllMembers={selectAllMembers}
        clients={clients}
        activeClients={activeClients}
        onToggleClient={toggleClient}
        onAddClient={addClient}
        onRemoveClient={removeClient}
        onRenameClient={renameClient}
        onSetClientColor={setClientColor}
        onSelectAllClients={selectAllClients}
        tasks={tasks}
        confirm={askConfirm}
        onOpenFeedback={() => setFeedbackOpen(true)}
      />

      <div className="main">
        <div className="topbar">
          <div className="group">
            <button className="nav-btn" onClick={navPrev} title="Précédent"><Icon.ChevL /></button>
            <button className="today-btn" onClick={navToday}>Aujourd'hui</button>
            <button className="nav-btn" onClick={navNext} title="Suivant"><Icon.ChevR /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="period-title">{periodTitle}</span>
            {periodSub && <span className="period-sub">{periodSub}</span>}
          </div>

          <div className="spacer" />

          <div className="segment">
            <button className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}>Semaine</button>
            <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}>Mois</button>
          </div>

          <button
            className="btn-ghost-pill"
            onClick={() => openCreate({ start: todayISO, end: todayISO, kind: 'absence' })}
            title="Ajouter une absence"
          >
            <span className="absence-icon" aria-hidden="true">⛱</span> Absence
          </button>
          <button className="btn-primary" onClick={() => openCreate({ start: todayISO, end: todayISO })}>
            <Icon.Plus s={13} /> Nouvelle tâche
          </button>
        </div>

        <div className="calendar">
          {view === 'week' ? (
            <WeekView
              monday={monday}
              members={visibleMembers}
              tasks={filteredTasks}
              clientMap={clientMap}
              todayISO={todayISO}
              onCreateTask={(seed) => openCreate(seed)}
              onEditTask={(t) => {
                if (t._delete) { deleteTask(t.id); return; }
                setEditingTask(t);
              }}
              onMoveTask={moveTask}
              confirm={askConfirm}
            />
          ) : (
            <MonthView
              month={cursor}
              members={visibleMembers}
              tasks={filteredTasks}
              clientMap={clientMap}
              todayISO={todayISO}
              onCreateTask={(seed) => openCreate(seed)}
              onEditTask={(t) => setEditingTask(t)}
            />
          )}
        </div>
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask}
          members={members}
          clients={clients}
          clientMap={clientMap}
          onSave={upsertTask}
          onDelete={deleteTask}
          onClose={() => setEditingTask(null)}
          confirm={askConfirm}
        />
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          danger={confirmState.danger}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />
      )}

      {feedbackOpen && (
        <FeedbackModal onClose={() => setFeedbackOpen(false)} />
      )}
    </div>
  );
}
