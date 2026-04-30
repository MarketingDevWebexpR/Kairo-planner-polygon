import { useState, useEffect, useMemo } from 'react';
import { Icon } from './icons.jsx';
import { Sidebar } from './Sidebar.jsx';
import { WeekView } from './WeekView.jsx';
import { MonthView } from './MonthView.jsx';
import { TaskModal } from './TaskModal.jsx';
import { ConfirmModal } from './ConfirmModal.jsx';
import { FeedbackModal } from './FeedbackModal.jsx';
import { useKairoData } from './useKairoData.js';
import {
  isoDay,
  parseISO,
  addDays,
  startOfWeekMonday,
  fmtMonthYear,
  fmtShortMonth,
  monthWeeks,
} from './data.js';

const PREFS_KEY = 'polygon_planning_prefs_v1';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePrefs(p) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore quota errors */
  }
}

export function App() {
  const {
    members, clients, tasks, loading, error,
    addMember, removeMember, renameMember, reorderMembers,
    addClient, removeClient, renameClient, setClientColor,
    addTask, updateTask, removeTask,
  } = useKairoData();

  const savedPrefs = useMemo(() => loadPrefs(), []);

  const [view, setView] = useState(savedPrefs?.view || 'week');
  const [cursorISO, setCursorISO] = useState(savedPrefs?.cursorISO || isoDay(new Date()));
  const [hiddenMemberIds, setHiddenMemberIds] = useState(() => new Set(savedPrefs?.hiddenMemberIds || []));
  const [hiddenClientIds, setHiddenClientIds] = useState(() => new Set(savedPrefs?.hiddenClientIds || []));
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

  // Persist UI prefs only (the data itself lives in Supabase).
  useEffect(() => {
    savePrefs({
      view,
      cursorISO,
      hiddenMemberIds: [...hiddenMemberIds],
      hiddenClientIds: [...hiddenClientIds],
    });
  }, [view, cursorISO, hiddenMemberIds, hiddenClientIds]);

  const todayISO = isoDay(new Date());
  const cursor = parseISO(cursorISO);
  const monday = startOfWeekMonday(cursor);

  const clientMap = useMemo(() => {
    const m = {};
    clients.forEach(c => (m[c.id] = c));
    return m;
  }, [clients]);

  const activeMembers = useMemo(
    () => new Set(members.filter(m => !hiddenMemberIds.has(m.id)).map(m => m.id)),
    [members, hiddenMemberIds],
  );
  const activeClients = useMemo(
    () => new Set(clients.filter(c => !hiddenClientIds.has(c.id)).map(c => c.id)),
    [clients, hiddenClientIds],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!activeMembers.has(t.memberId)) return false;
      if (t.kind === 'absence') return true;
      return activeClients.has(t.clientId);
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
      removeTask(t.id);
      setEditingTask(null);
      return;
    }
    if (t.id) updateTask(t);
    else addTask(t);
    setEditingTask(null);
  }

  function deleteTask(id) {
    removeTask(id);
    setEditingTask(null);
  }

  function toggleMember(id) {
    setHiddenMemberIds(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function selectAllMembers(on) {
    setHiddenMemberIds(on ? new Set() : new Set(members.map(m => m.id)));
  }

  function toggleClient(id) {
    setHiddenClientIds(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function selectAllClients(on) {
    setHiddenClientIds(on ? new Set() : new Set(clients.map(c => c.id)));
  }

  function openCreate(seed = {}) {
    const m = seed.memberId || visibleMembers[0]?.id || members[0]?.id;
    setEditingTask({
      kind: seed.kind || 'task',
      title: '',
      clientId: clients[0]?.id,
      reason: 'conges',
      memberId: m,
      start: seed.start || todayISO,
      end: seed.end || seed.start || todayISO,
      half: seed.half || false,
      notes: '',
    });
  }

  if (loading) {
    return (
      <div className="app-loading">
        <span>Chargement…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-loading">
        <span style={{ color: 'oklch(50% 0.18 25)' }}>
          Impossible de joindre la base. Réessaie dans un instant.
        </span>
      </div>
    );
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
              onMoveTask={(t) => updateTask(t)}
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
