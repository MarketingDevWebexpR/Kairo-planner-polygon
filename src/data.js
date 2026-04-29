export const PALETTE = [
  { c: 'oklch(62% 0.18 260)', h: 260 },
  { c: 'oklch(64% 0.16 160)', h: 160 },
  { c: 'oklch(68% 0.17 50)',  h: 50  },
  { c: 'oklch(63% 0.18 350)', h: 350 },
  { c: 'oklch(64% 0.15 210)', h: 210 },
  { c: 'oklch(60% 0.18 300)', h: 300 },
  { c: 'oklch(60% 0.16 25)',  h: 25  },
  { c: 'oklch(62% 0.15 130)', h: 130 },
];

export const DEFAULT_MEMBERS = [
  { id: 'm1', name: 'Léo',      initials: 'LT' },
  { id: 'm2', name: 'Jordan',   initials: 'JC' },
  { id: 'm3', name: 'Isabelle', initials: 'IB' },
  { id: 'm4', name: 'Laure',    initials: 'LM' },
  { id: 'm5', name: 'Stoyan',   initials: 'SK' },
  { id: 'm6', name: 'Viviane',  initials: 'VR' },
];

export const DEFAULT_CLIENTS = [
  { name: 'BNP Paribas',   color: PALETTE[0].c, hue: PALETTE[0].h },
  { name: 'Saint Gobain',  color: PALETTE[1].c, hue: PALETTE[1].h },
  { name: 'Filet Halard',  color: PALETTE[2].c, hue: PALETTE[2].h },
  { name: 'Interne',       color: PALETTE[3].c, hue: PALETTE[3].h },
];

export const ABSENCE_REASONS = [
  { id: 'conges',      label: 'Congés',      icon: '🌴', color: 'oklch(70% 0.04 240)' },
  { id: 'rtt',         label: 'RTT',         icon: '⏱',  color: 'oklch(70% 0.04 240)' },
  { id: 'maladie',     label: 'Maladie',     icon: '🩹', color: 'oklch(70% 0.04 240)' },
  { id: 'formation',   label: 'Formation',   icon: '🎓', color: 'oklch(70% 0.04 240)' },
  { id: 'teletravail', label: 'Télétravail', icon: '🏠', color: 'oklch(70% 0.04 240)' },
  { id: 'autre',       label: 'Autre',       icon: '✦',  color: 'oklch(70% 0.04 240)' },
];

export function pad(n) { return String(n).padStart(2, '0'); }
export function isoDay(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function diffDays(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }

export function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
export function isWeekday(d) { const g = d.getDay(); return g >= 1 && g <= 5; }

export function fmtMonthYear(d) {
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
export function fmtShortMonth(d) {
  const months = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
  return months[d.getMonth()];
}
export function fmtDay(d) {
  const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  return days[d.getDay()];
}

export function isoWeek(d) {
  const target = new Date(d);
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  return 1 + Math.ceil((firstThursday - target) / (7 * 86400000));
}

export function weekDays(monday) {
  return [0, 1, 2, 3, 4].map(i => addDays(monday, i));
}

export function monthWeeks(monthDate) {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const start = startOfWeekMonday(first);
  const end = startOfWeekMonday(last);
  const weeks = [];
  let cur = start;
  while (cur <= end) {
    weeks.push(weekDays(cur));
    cur = addDays(cur, 7);
  }
  return weeks;
}

export function initials(memberOrName) {
  if (memberOrName && typeof memberOrName === 'object') {
    if (memberOrName.initials && memberOrName.initials.trim()) {
      return memberOrName.initials.trim().toUpperCase().slice(0, 3);
    }
    return (memberOrName.name || '').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
  return String(memberOrName || '').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export function seedTasks(memberIds) {
  const today = new Date();
  const monday = startOfWeekMonday(today);
  const T = (offset, dur, mIdx, title, client, half = false, notes = '') => ({
    id: 'seed_' + Math.random().toString(36).slice(2, 8),
    kind: 'task',
    memberId: memberIds[mIdx],
    title, client, notes,
    start: isoDay(addDays(monday, offset)),
    end: isoDay(addDays(monday, offset + dur - 1)),
    half,
  });
  const A = (offset, dur, mIdx, reasonId, half = false) => ({
    id: 'seed_a_' + Math.random().toString(36).slice(2, 8),
    kind: 'absence',
    memberId: memberIds[mIdx],
    reason: reasonId,
    start: isoDay(addDays(monday, offset)),
    end: isoDay(addDays(monday, offset + dur - 1)),
    half,
  });
  return [
    T(0, 3, 0, 'Atelier discovery', 'BNP Paribas', false, 'Cadrage des besoins, 3 sessions de 2h.'),
    T(0, 1, 1, 'Brief créa', 'Saint Gobain', 'pm'),
    T(1, 2, 1, 'Maquettes Hi-Fi', 'Saint Gobain'),
    T(0, 5, 2, 'Pilotage projet', 'Filet Halard', false, 'Suivi quotidien équipe + reporting client.'),
    T(2, 2, 3, 'Refonte landing', 'BNP Paribas'),
    T(0, 1, 3, 'Présentation kickoff', 'BNP Paribas', 'am'),
    T(3, 2, 4, 'Dev sprint #4', 'Filet Halard'),
    T(0, 2, 5, 'Tests utilisateurs', 'Saint Gobain'),
    T(3, 2, 5, 'Synthèse UX', 'Saint Gobain'),

    T(5, 3, 0, 'Workshop stratégie', 'Saint Gobain'),
    T(5, 1, 1, 'Recette client', 'BNP Paribas', 'am'),
    T(6, 2, 2, 'Audit accessibilité', 'BNP Paribas'),
    T(7, 3, 3, 'Direction artistique', 'Filet Halard'),
    T(5, 5, 4, 'Dev sprint #5', 'Filet Halard'),
    T(8, 1, 5, 'Atelier copywriting', 'Interne', 'pm'),
    T(5, 2, 5, 'Recherche UX', 'BNP Paribas'),

    T(-3, 2, 0, 'Restitution étude', 'BNP Paribas'),
    T(-2, 1, 4, 'Mise en prod', 'Saint Gobain'),
    T(10, 4, 0, 'Phase 2 design system', 'Saint Gobain'),
    T(12, 2, 1, 'Itération maquettes', 'Saint Gobain'),
    T(11, 3, 3, 'Direction artistique v2', 'Filet Halard'),

    A(2, 2, 2, 'conges'),
    A(7, 1, 4, 'rtt'),
    A(8, 1, 1, 'formation'),
    A(13, 5, 5, 'conges'),
  ];
}
