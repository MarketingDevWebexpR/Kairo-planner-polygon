import { useState, useMemo, useRef, useEffect } from 'react';
import {
  monthWeeks,
  isoDay,
  parseISO,
  addDays,
  diffDays,
  initials,
  ABSENCE_REASONS,
  getHolidayLabel,
} from './data.js';

const REASON_MAP = Object.fromEntries(ABSENCE_REASONS.map(r => [r.id, r]));

const HEADER_H = 30;
const LANE_H = 22;
const MAX_LANES = 4;
const FOOTER_H = 22;
const ROW_PAD = 6;

export function MonthView({ month, members, tasks, clientMap, onCreateTask, onEditTask, todayISO }) {
  const weeks = monthWeeks(month);
  const [popover, setPopover] = useState(null);
  const popoverRef = useRef(null);

  const memberById = useMemo(() => {
    const m = {};
    members.forEach(x => (m[x.id] = x));
    return m;
  }, [members]);

  const memberOrder = useMemo(() => {
    const m = new Map();
    members.forEach((mem, i) => m.set(mem.id, i));
    return m;
  }, [members]);

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const s = parseISO(t.start);
      const e = parseISO(t.end);
      let cur = s;
      while (cur <= e) {
        const k = isoDay(cur);
        (map[k] = map[k] || []).push(t);
        cur = addDays(cur, 1);
      }
    });
    return map;
  }, [tasks]);

  useEffect(() => {
    function onClick(e) {
      if (!popover) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopover(null);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [popover]);

  function sortByMember(list) {
    return [...list].sort((a, b) => {
      const ma = memberOrder.get(a.memberId) ?? 999;
      const mb = memberOrder.get(b.memberId) ?? 999;
      if (ma !== mb) return ma - mb;
      if (a.kind !== b.kind) return a.kind === 'absence' ? -1 : 1;
      return a.start.localeCompare(b.start);
    });
  }

  return (
    <div className="month">
      <div className="m-header">
        {['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="m-grid">
        {weeks.map((days, wi) => (
          <WeekRow
            key={wi}
            days={days}
            month={month}
            tasks={tasks}
            memberOrder={memberOrder}
            memberById={memberById}
            todayISO={todayISO}
            clientMap={clientMap}
            onCreateTask={onCreateTask}
            onEditTask={onEditTask}
            onOpenDay={(dayISO, x, y) => setPopover({ dayISO, x, y })}
          />
        ))}
      </div>

      {popover && (() => {
        const list = sortByMember(tasksByDay[popover.dayISO] || []);
        const d = parseISO(popover.dayISO);
        const left = Math.min(popover.x, window.innerWidth - 360);
        return (
          <div ref={popoverRef} className="popover" style={{ left, top: popover.y }}>
            <h4>
              <span>
                {['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][d.getDay()]}{' '}
                {d.getDate()}
              </span>
              <span className="date">{list.length} élément{list.length > 1 ? 's' : ''}</span>
            </h4>
            {list.map(t => {
              const m = memberById[t.memberId];
              if (!m) return null;
              if (t.kind === 'absence') {
                const r = REASON_MAP[t.reason] || ABSENCE_REASONS[0];
                return (
                  <div
                    key={t.id}
                    className="p-task p-absence"
                    onClick={() => { setPopover(null); onEditTask(t); }}
                  >
                    <span className="pt-bar"></span>
                    <div className="pt-main">
                      <div className="pt-title">
                        <span className="pt-emoji" aria-hidden="true">{r.icon}</span> {r.label}
                      </div>
                      <div className="pt-sub">{m.name}</div>
                    </div>
                    <span className="pt-person">{initials(m)}</span>
                  </div>
                );
              }
              const cli = clientMap[t.clientId] || { color: 'oklch(60% 0 0)', hue: 0, name: '' };
              return (
                <div
                  key={t.id}
                  className="p-task"
                  style={{ '--c': cli.color, '--h': cli.hue }}
                  onClick={() => { setPopover(null); onEditTask(t); }}
                >
                  <span className="pt-bar"></span>
                  <div className="pt-main">
                    <div className="pt-title">{t.title}</div>
                    <div className="pt-sub">{cli.name} · {m.name}</div>
                  </div>
                  <span className="pt-person">{initials(m)}</span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

function WeekRow({ days, month, tasks, memberOrder, memberById, todayISO, clientMap, onCreateTask, onEditTask, onOpenDay }) {
  const weekStartIso = isoDay(days[0]);
  const weekEndIso = isoDay(days[4]);

  const items = tasks
    .filter(t => !(t.end < weekStartIso || t.start > weekEndIso))
    .map(t => {
      const sDiff = diffDays(weekStartIso, t.start);
      const eDiff = diffDays(weekStartIso, t.end);
      return {
        ...t,
        _s: Math.max(0, sDiff),
        _e: Math.min(4, eDiff),
        _truncL: sDiff < 0,
        _truncR: eDiff > 4,
      };
    })
    .sort((a, b) => {
      const ma = memberOrder.get(a.memberId) ?? 999;
      const mb = memberOrder.get(b.memberId) ?? 999;
      if (ma !== mb) return ma - mb;
      if (a.kind !== b.kind) return a.kind === 'absence' ? -1 : 1;
      return a._s - b._s;
    });

  const laneEnds = [];
  items.forEach(t => {
    let lane = laneEnds.findIndex(end => end < t._s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(t._e);
    } else {
      laneEnds[lane] = t._e;
    }
    t._lane = lane;
  });

  const visibleItems = items.filter(t => t._lane < MAX_LANES);
  const overflowItems = items.filter(t => t._lane >= MAX_LANES);
  const overflowByDay = [0, 0, 0, 0, 0];
  overflowItems.forEach(t => {
    for (let i = t._s; i <= t._e; i++) overflowByDay[i]++;
  });

  const visibleLaneCount = Math.min(laneEnds.length, MAX_LANES);
  const rowHeight = HEADER_H + Math.max(visibleLaneCount, 1) * LANE_H + ROW_PAD + (overflowItems.length ? FOOTER_H : 0);

  return (
    <div className="m-week" style={{ minHeight: rowHeight }}>
      <div className="m-week-cells">
        {days.map((d, idx) => {
          const k = isoDay(d);
          const inMonth = d.getMonth() === month.getMonth();
          const holiday = getHolidayLabel(k);
          const dayItemsCount = items.filter(t => t._s <= idx && t._e >= idx).length;
          return (
            <div
              key={k}
              className={
                'm-cell' +
                (inMonth ? '' : ' out') +
                (k === todayISO ? ' today' : '') +
                (holiday ? ' holiday' : '')
              }
              title={holiday || undefined}
              onClick={(e) => {
                if (e.target.closest('.m-bar') || e.target.closest('.m-week-more')) return;
                onCreateTask({ start: k, end: k, half: false });
              }}
            >
              <div className="m-date">
                <span className="num">{d.getDate()}</span>
                {dayItemsCount > 0 && <span className="count-dot">{dayItemsCount}</span>}
              </div>
              {holiday && inMonth && <span className="m-holiday">{holiday}</span>}
              {overflowByDay[idx] > 0 && (
                <button
                  className="m-week-more"
                  onClick={(e) => {
                    e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    onOpenDay(k, r.left, r.bottom + 6);
                  }}
                >
                  +{overflowByDay[idx]} de plus
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="m-week-bars" style={{ top: HEADER_H + 4 }}>
        {visibleItems.map(t => {
          const m = memberById[t.memberId];
          if (!m) return null;
          const span = t._e - t._s + 1;
          const left = `calc(${t._s * 20}% + 3px)`;
          const width = `calc(${span * 20}% - 6px)`;
          const top = t._lane * LANE_H;

          if (t.kind === 'absence') {
            const r = REASON_MAP[t.reason] || ABSENCE_REASONS[0];
            return (
              <div
                key={t.id}
                className={'m-bar m-bar-absence' + (t._truncL ? ' trunc-l' : '') + (t._truncR ? ' trunc-r' : '')}
                style={{ left, width, top }}
                title={`${r.label} · ${m.name}`}
                onClick={(e) => { e.stopPropagation(); onEditTask(t); }}
              >
                <span className="bar-icon" aria-hidden="true">{r.icon}</span>
                <span className="bar-title">{r.label}</span>
                <span className="bar-who">{initials(m)}</span>
              </div>
            );
          }

          const cli = clientMap[t.clientId] || { color: 'oklch(60% 0 0)', hue: 0, name: '' };
          return (
            <div
              key={t.id}
              className={'m-bar' + (t._truncL ? ' trunc-l' : '') + (t._truncR ? ' trunc-r' : '')}
              style={{ left, width, top, '--c': cli.color, '--h': cli.hue }}
              title={`${t.title} · ${cli.name} · ${m.name}`}
              onClick={(e) => { e.stopPropagation(); onEditTask(t); }}
            >
              <span className="bar-title">{t.title}</span>
              <span className="bar-who">{initials(m)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
