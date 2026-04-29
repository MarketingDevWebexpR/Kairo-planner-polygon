import { useState, useRef, useMemo } from 'react';
import { Icon } from './icons.jsx';
import {
  weekDays,
  addDays,
  isoDay,
  parseISO,
  diffDays,
  fmtDay,
  fmtShortMonth,
  isoWeek,
  initials,
  ABSENCE_REASONS,
} from './data.js';

const REASON_MAP = Object.fromEntries(ABSENCE_REASONS.map(r => [r.id, r]));

export function WeekView({ monday, members, tasks, clientMap, onCreateTask, onEditTask, onMoveTask, todayISO, confirm }) {
  const days = weekDays(monday);
  const dayIsoList = days.map(isoDay);
  const [drag, setDrag] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [ghost, setGhost] = useState(null);
  const moveDragRef = useRef(null);
  const gridRef = useRef(null);

  function startMoveTask(task, e) {
    e.stopPropagation();
    e.preventDefault();
    const pillRect = e.currentTarget.getBoundingClientRect();
    moveDragRef.current = {
      task,
      originX: e.clientX,
      originY: e.clientY,
      offsetX: e.clientX - pillRect.left,
      offsetY: e.clientY - pillRect.top,
      pillWidth: pillRect.width,
      hasMoved: false,
    };
    setMovingTaskId(task.id);
    document.body.classList.add('dragging-task');

    function onMM(ev) {
      const r = moveDragRef.current;
      if (!r) return;
      const dx = Math.abs(ev.clientX - r.originX);
      const dy = Math.abs(ev.clientY - r.originY);
      if (dx > 4 || dy > 4) r.hasMoved = true;
      const cell = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.w-cell');
      if (cell?.dataset.memberId && cell.dataset.dayIdx !== undefined) {
        setMoveTarget({ memberId: cell.dataset.memberId, dayIdx: parseInt(cell.dataset.dayIdx, 10) });
      } else {
        setMoveTarget(null);
      }
      if (r.hasMoved) {
        setGhost({
          task: r.task,
          x: ev.clientX - r.offsetX,
          y: ev.clientY - r.offsetY,
          width: r.pillWidth,
        });
      }
    }

    function onMU(ev) {
      document.removeEventListener('mousemove', onMM);
      document.removeEventListener('mouseup', onMU);
      document.body.classList.remove('dragging-task');
      const r = moveDragRef.current;
      moveDragRef.current = null;
      setMovingTaskId(null);
      setMoveTarget(null);
      setGhost(null);
      if (!r) return;
      if (r.hasMoved) {
        const cell = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.w-cell');
        if (!cell?.dataset.memberId || cell.dataset.dayIdx === undefined) return;
        const memberId = cell.dataset.memberId;
        const dayIdx = parseInt(cell.dataset.dayIdx, 10);
        const t = r.task;
        const duration = diffDays(t.start, t.end);
        const newStart = isoDay(addDays(monday, dayIdx));
        const newEnd = t.half ? newStart : isoDay(addDays(parseISO(newStart), duration));
        if (memberId === t.memberId && newStart === t.start) return;
        onMoveTask({ ...t, memberId, start: newStart, end: newEnd });
      } else {
        onEditTask(r.task);
      }
    }

    document.addEventListener('mousemove', onMM);
    document.addEventListener('mouseup', onMU);
  }

  const tasksByMember = useMemo(() => {
    const map = {};
    members.forEach(m => (map[m.id] = []));
    tasks.forEach(t => {
      if (!map[t.memberId]) return;
      const s = diffDays(dayIsoList[0], t.start);
      const e = diffDays(dayIsoList[0], t.end);
      if (e < 0 || s > 4) return;
      map[t.memberId].push({
        ...t,
        _s: Math.max(0, s),
        _e: Math.min(4, e),
        _truncL: s < 0,
        _truncR: e > 4,
      });
    });
    return map;
  }, [tasks, members, monday]);

  function lanes(rowTasks) {
    const sorted = [...rowTasks].sort((a, b) => a._s - b._s || a._e - b._e);
    const laneEnds = [];
    sorted.forEach(t => {
      let lane = laneEnds.findIndex(end => end < t._s);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(t._e);
      } else {
        laneEnds[lane] = t._e;
      }
      t._lane = lane;
    });
    return { items: sorted, laneCount: Math.max(1, laneEnds.length) };
  }

  function handleMouseDown(memberId, dayIdx) {
    setDrag({ memberId, startIdx: dayIdx, endIdx: dayIdx });
  }
  function handleMouseEnter(memberId, dayIdx) {
    if (!drag || drag.memberId !== memberId) return;
    setDrag(d => ({ ...d, endIdx: dayIdx }));
  }
  function handleMouseUp() {
    if (!drag) return;
    const a = Math.min(drag.startIdx, drag.endIdx);
    const b = Math.max(drag.startIdx, drag.endIdx);
    onCreateTask({
      memberId: drag.memberId,
      start: dayIsoList[a],
      end: dayIsoList[b],
      half: false,
    });
    setDrag(null);
  }

  return (
    <div className="week" ref={gridRef} onMouseUp={handleMouseUp} onMouseLeave={() => setDrag(null)}>
      <div className="w-corner">
        <span className="label">Sem. {String(isoWeek(monday)).padStart(2, '0')}</span>
      </div>
      {days.map(d => (
        <div key={isoDay(d)} className={'w-dayhead' + (isoDay(d) === todayISO ? ' today' : '')}>
          <span className="d1">{fmtDay(d)}</span>
          <span className="d2">
            <span className="date-num">{d.getDate()}</span>
            <span className="date-mon">{fmtShortMonth(d)}.</span>
          </span>
        </div>
      ))}

      {members.map(m => {
        const { items, laneCount } = lanes(tasksByMember[m.id] || []);
        const rowH = Math.max(100, 14 + laneCount * 34);
        return (
          <FragmentRow
            key={m.id}
            member={m}
            rowH={rowH}
            items={items}
            days={days}
            todayISO={todayISO}
            drag={drag}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            clientMap={clientMap}
            onEditTask={onEditTask}
            onStartMove={startMoveTask}
            moveTarget={moveTarget}
            movingTaskId={movingTaskId}
            confirm={confirm}
          />
        );
      })}
      {ghost && <DragGhost ghost={ghost} clientMap={clientMap} />}
    </div>
  );
}

function DragGhost({ ghost, clientMap }) {
  const { task, x, y, width } = ghost;
  const baseStyle = { left: x, top: y, width };
  if (task.kind === 'absence') {
    const r = REASON_MAP[task.reason] || ABSENCE_REASONS[0];
    return (
      <div className="absence-pill drag-ghost" style={baseStyle}>
        <span className="a-icon" aria-hidden="true">{r.icon}</span>
        <span className="a-label">{r.label}</span>
      </div>
    );
  }
  const cli = clientMap[task.client] || { color: 'oklch(60% 0 0)', hue: 0 };
  return (
    <div
      className="task-pill drag-ghost"
      style={{ ...baseStyle, '--c': cli.color, '--h': cli.hue }}
    >
      <span className="t-title">{task.title}</span>
      <span className="t-client">{task.client}</span>
    </div>
  );
}

function FragmentRow({ member, rowH, items, days, todayISO, drag, onMouseDown, onMouseEnter, clientMap, onEditTask, onStartMove, moveTarget, movingTaskId, confirm }) {
  return (
    <>
      <div className="w-person member-neutral" style={{ minHeight: rowH }}>
        <span className="name">{member.name}</span>
        <span className={'load' + (items.length >= 4 ? ' hot' : '')}>{items.length}</span>
      </div>
      {days.map((d, dayIdx) => {
        const isStartOfDrag = drag && drag.memberId === member.id && dayIdx === Math.min(drag.startIdx, drag.endIdx);
        const dragSpan = drag && drag.memberId === member.id ? Math.abs(drag.endIdx - drag.startIdx) + 1 : 0;
        const isMoveTarget = moveTarget && moveTarget.memberId === member.id && moveTarget.dayIdx === dayIdx;
        return (
          <div
            key={dayIdx}
            className={
              'w-cell' +
              (isoDay(d) === todayISO ? ' today' : '') +
              (isMoveTarget ? ' move-target' : '')
            }
            data-member-id={member.id}
            data-day-idx={dayIdx}
            style={{ minHeight: rowH }}
            onMouseDown={() => onMouseDown(member.id, dayIdx)}
            onMouseEnter={() => onMouseEnter(member.id, dayIdx)}
          >
            <div className="add-hint">
              <span className="plus"><Icon.Plus s={12} /></span>
              Glisser pour créer
            </div>
            {isStartOfDrag && (
              <div className="drag-overlay" style={{ left: 6, width: `calc(${dragSpan * 100}% - 12px)` }}>
                {dragSpan}j
              </div>
            )}
            {items
              .filter(t => t._s === dayIdx)
              .map(t => {
                const span = t._e - t._s + 1;
                const top = 6 + t._lane * 34;
                let left = '6px';
                let width = `calc(${span * 100}% - 12px)`;
                if (t.half === 'pm' && span === 1) {
                  left = '50%';
                  width = `calc(50% - 6px)`;
                }
                if (t.half === 'am' && span === 1) {
                  left = '6px';
                  width = `calc(50% - 6px)`;
                }

                const isMoving = movingTaskId === t.id;
                if (t.kind === 'absence') {
                  const r = REASON_MAP[t.reason] || ABSENCE_REASONS[0];
                  return (
                    <div
                      key={t.id}
                      className={'absence-pill' + (isMoving ? ' moving' : '')}
                      style={{ top, left, width }}
                      onMouseDown={(e) => onStartMove(t, e)}
                    >
                      <span className="a-icon" aria-hidden="true">{r.icon}</span>
                      <span className="a-label">{r.label}</span>
                      <span className="t-actions" onMouseDown={(e) => e.stopPropagation()}>
                        <button title="Modifier" onClick={(e) => { e.stopPropagation(); onEditTask(t); }}>
                          <Icon.Pencil s={13} />
                        </button>
                        <button
                          className="del"
                          title="Supprimer"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok = await confirm({
                              title: 'Supprimer une absence',
                              message: 'Cette absence sera définitivement supprimée.',
                              confirmLabel: 'Supprimer',
                              danger: true,
                            });
                            if (ok) onEditTask({ ...t, _delete: true });
                          }}
                        >
                          <Icon.Trash s={13} />
                        </button>
                      </span>
                    </div>
                  );
                }

                const cli = clientMap[t.client] || { color: 'oklch(60% 0 0)', hue: 0 };
                return (
                  <div
                    key={t.id}
                    className={'task-pill' + (isMoving ? ' moving' : '')}
                    style={{ '--c': cli.color, '--h': cli.hue, top, left, width }}
                    onMouseDown={(e) => onStartMove(t, e)}
                  >
                    <span className="t-title">{t.title}</span>
                    {span > 1 || !t.half ? <span className="t-client">{t.client}</span> : null}
                    <span className="t-actions" onMouseDown={(e) => e.stopPropagation()}>
                      <button title="Modifier" onClick={(e) => { e.stopPropagation(); onEditTask(t); }}>
                        <Icon.Pencil s={13} />
                      </button>
                      <button
                        className="del"
                        title="Supprimer"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm({
                            title: 'Supprimer une tâche',
                            message: `« ${t.title} » sera définitivement supprimée.`,
                            confirmLabel: 'Supprimer',
                            danger: true,
                          });
                          if (ok) onEditTask({ ...t, _delete: true });
                        }}
                      >
                        <Icon.Trash s={13} />
                      </button>
                    </span>
                  </div>
                );
              })}
          </div>
        );
      })}
    </>
  );
}
