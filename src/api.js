import { supabase } from './supabase.js';

async function ok(promise) {
  const { data, error } = await promise;
  if (error) {
    console.error('[supabase]', error);
    throw error;
  }
  return data;
}

export const api = {
  members: {
    list: () =>
      ok(
        supabase
          .from('members')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ),
    insert: (row) => ok(supabase.from('members').insert(row).select().single()),
    update: (id, patch) =>
      ok(supabase.from('members').update(patch).eq('id', id).select().single()),
    remove: (id) => ok(supabase.from('members').delete().eq('id', id)),
    reorder: async (orderedIds) => {
      // upsert display_order = idx for each id, in a single batched call
      const rows = orderedIds.map((id, idx) => ({ id, display_order: idx }));
      return ok(supabase.from('members').upsert(rows, { onConflict: 'id' }));
    },
  },

  clients: {
    list: () => ok(supabase.from('clients').select('*').order('name')),
    insert: (row) => ok(supabase.from('clients').insert(row).select().single()),
    update: (id, patch) =>
      ok(supabase.from('clients').update(patch).eq('id', id).select().single()),
    remove: (id) => ok(supabase.from('clients').delete().eq('id', id)),
  },

  tasks: {
    list: () => ok(supabase.from('tasks').select('*').order('start_date')),
    insert: (row) => ok(supabase.from('tasks').insert(row).select().single()),
    update: (id, patch) =>
      ok(supabase.from('tasks').update(patch).eq('id', id).select().single()),
    remove: (id) => ok(supabase.from('tasks').delete().eq('id', id)),
  },
};

// ========== Mappers between DB rows and front-end shape ==========

export function taskFromDb(row) {
  return {
    id: row.id,
    kind: row.kind,
    memberId: row.member_id,
    clientId: row.client_id,
    title: row.title,
    notes: row.notes || '',
    reason: row.reason,
    start: row.start_date,
    end: row.end_date,
    half: row.half || false,
  };
}

export function taskToDb(task) {
  const isAbsence = task.kind === 'absence';
  return {
    kind: task.kind,
    member_id: task.memberId,
    title: isAbsence ? null : (task.title || '').trim(),
    client_id: isAbsence ? null : task.clientId,
    notes: task.notes || '',
    reason: isAbsence ? task.reason : null,
    start_date: task.start,
    end_date: task.half ? task.start : task.end,
    half: task.half || null,
  };
}
