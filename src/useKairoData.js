import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase.js';
import { api, taskFromDb, taskToDb } from './api.js';

function sortMembers(arr) {
  return [...arr].sort((a, b) => {
    const da = a.display_order ?? 0;
    const db = b.display_order ?? 0;
    if (da !== db) return da - db;
    return (a.created_at || '').localeCompare(b.created_at || '');
  });
}

function sortClients(arr) {
  return [...arr].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
  );
}

function upsertById(arr, row) {
  const idx = arr.findIndex(x => x.id === row.id);
  if (idx === -1) return [...arr, row];
  const next = [...arr];
  next[idx] = row;
  return next;
}

export function useKairoData() {
  const [members, setMembers] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track the last echo we just wrote so we can skip the realtime echo
  // (the optimistic update already happened locally).
  const lastWriteIdsRef = useRef(new Set());
  const markLocal = (id) => {
    lastWriteIdsRef.current.add(id);
    setTimeout(() => lastWriteIdsRef.current.delete(id), 1500);
  };

  // -------------------- Initial load --------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, c, t] = await Promise.all([
          api.members.list(),
          api.clients.list(),
          api.tasks.list(),
        ]);
        if (cancelled) return;
        setMembers(sortMembers(m || []));
        setClients(sortClients(c || []));
        setTasks((t || []).map(taskFromDb));
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // -------------------- Realtime --------------------
  useEffect(() => {
    const ch = supabase
      .channel('kairo-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (p) => {
        if (p.eventType === 'DELETE') {
          setMembers(prev => prev.filter(x => x.id !== p.old.id));
          return;
        }
        if (lastWriteIdsRef.current.has(p.new.id)) return;
        setMembers(prev => sortMembers(upsertById(prev, p.new)));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (p) => {
        if (p.eventType === 'DELETE') {
          setClients(prev => prev.filter(x => x.id !== p.old.id));
          return;
        }
        if (lastWriteIdsRef.current.has(p.new.id)) return;
        setClients(prev => sortClients(upsertById(prev, p.new)));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (p) => {
        if (p.eventType === 'DELETE') {
          setTasks(prev => prev.filter(x => x.id !== p.old.id));
          return;
        }
        if (lastWriteIdsRef.current.has(p.new.id)) return;
        setTasks(prev => upsertById(prev, taskFromDb(p.new)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // -------------------- Members mutators --------------------
  const addMember = useCallback(async (name, ini) => {
    const display_order = members.length
      ? Math.max(...members.map(m => m.display_order ?? 0)) + 1
      : 0;
    const row = await api.members.insert({ name, initials: ini, display_order });
    markLocal(row.id);
    setMembers(prev => sortMembers(upsertById(prev, row)));
    return row;
  }, [members]);

  const removeMember = useCallback(async (id) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setTasks(prev => prev.filter(t => t.memberId !== id));
    await api.members.remove(id);
  }, []);

  const renameMember = useCallback(async (id, name, ini) => {
    const trimmedName = (name || '').trim();
    const trimmedIni = (ini || '').trim().toUpperCase().slice(0, 3);
    if (!trimmedName) return;
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, name: trimmedName, initials: trimmedIni || m.initials } : m,
    ));
    const row = await api.members.update(id, {
      name: trimmedName,
      initials: trimmedIni || undefined,
    });
    markLocal(row.id);
  }, []);

  const reorderMembers = useCallback(async (draggedId, targetId) => {
    let newOrder;
    setMembers(prev => {
      const arr = [...prev];
      const from = arr.findIndex(m => m.id === draggedId);
      const to = arr.findIndex(m => m.id === targetId);
      if (from < 0 || to < 0 || from === to) {
        newOrder = arr;
        return prev;
      }
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      newOrder = arr.map((m, idx) => ({ ...m, display_order: idx }));
      return newOrder;
    });
    if (newOrder && newOrder.length) {
      newOrder.forEach(m => markLocal(m.id));
      await api.members.reorder(newOrder.map(m => m.id));
    }
  }, []);

  // -------------------- Clients mutators --------------------
  const addClient = useCallback(async (name, picked) => {
    if (clients.find(c => c.name === name)) return;
    const row = await api.clients.insert({ name, color: picked.c, hue: picked.h });
    markLocal(row.id);
    setClients(prev => sortClients(upsertById(prev, row)));
    return row;
  }, [clients]);

  const removeClient = useCallback(async (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
    // local cascade for snappy UX (DB does the real cascade via FK)
    setTasks(prev => prev.filter(t => t.clientId !== id));
    await api.clients.remove(id);
  }, []);

  const renameClient = useCallback(async (id, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    if (clients.find(c => c.id !== id && c.name === trimmed)) return;
    setClients(prev =>
      sortClients(prev.map(c => (c.id === id ? { ...c, name: trimmed } : c))),
    );
    const row = await api.clients.update(id, { name: trimmed });
    markLocal(row.id);
  }, [clients]);

  const setClientColor = useCallback(async (id, picked) => {
    if (!picked) return;
    setClients(prev =>
      prev.map(c => (c.id === id ? { ...c, color: picked.c, hue: picked.h } : c)),
    );
    const row = await api.clients.update(id, { color: picked.c, hue: picked.h });
    markLocal(row.id);
  }, []);

  // -------------------- Tasks mutators --------------------
  const addTask = useCallback(async (task) => {
    const row = await api.tasks.insert(taskToDb(task));
    markLocal(row.id);
    setTasks(prev => upsertById(prev, taskFromDb(row)));
    return row;
  }, []);

  const updateTask = useCallback(async (task) => {
    setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, ...task } : t)));
    const row = await api.tasks.update(task.id, taskToDb(task));
    markLocal(row.id);
  }, []);

  const removeTask = useCallback(async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await api.tasks.remove(id);
  }, []);

  return {
    members, clients, tasks, loading, error,
    addMember, removeMember, renameMember, reorderMembers,
    addClient, removeClient, renameClient, setClientColor,
    addTask, updateTask, removeTask,
  };
}
