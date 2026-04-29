// 24 couleurs : densité plus forte sur la moitié chaude (rouge → jaune → vert lime),
// et un pas de 20° sur le reste pour couvrir tout le cercle chromatique.
// L et C calibrés par famille pour égaliser le "poids visuel".
export const PALETTE = [
  { c: 'oklch(64% 0.18 0)',   h: 0   }, // rouge
  { c: 'oklch(66% 0.18 10)',  h: 10  }, // rouge-corail
  { c: 'oklch(66% 0.17 20)',  h: 20  }, // corail
  { c: 'oklch(66% 0.18 30)',  h: 30  }, // terracotta
  { c: 'oklch(68% 0.16 40)',  h: 40  }, // orange
  { c: 'oklch(70% 0.17 50)',  h: 50  }, // orange vif
  { c: 'oklch(72% 0.15 60)',  h: 60  }, // jaune chaud
  { c: 'oklch(73% 0.16 70)',  h: 70  }, // ambre
  { c: 'oklch(74% 0.14 80)',  h: 80  }, // jaune
  { c: 'oklch(75% 0.15 90)',  h: 90  }, // jaune citron
  { c: 'oklch(70% 0.15 100)', h: 100 }, // jaune-vert
  { c: 'oklch(68% 0.16 110)', h: 110 }, // vert lime
  { c: 'oklch(66% 0.16 120)', h: 120 }, // vert pomme
  { c: 'oklch(64% 0.16 140)', h: 140 }, // vert
  { c: 'oklch(64% 0.15 160)', h: 160 }, // vert sapin
  { c: 'oklch(64% 0.12 180)', h: 180 }, // cyan
  { c: 'oklch(64% 0.13 200)', h: 200 }, // bleu cyan
  { c: 'oklch(64% 0.14 220)', h: 220 }, // bleu ciel
  { c: 'oklch(63% 0.16 240)', h: 240 }, // bleu
  { c: 'oklch(62% 0.18 260)', h: 260 }, // bleu profond
  { c: 'oklch(60% 0.18 280)', h: 280 }, // indigo
  { c: 'oklch(60% 0.18 300)', h: 300 }, // violet
  { c: 'oklch(62% 0.18 320)', h: 320 }, // magenta
  { c: 'oklch(63% 0.18 340)', h: 340 }, // rose
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

// Pâques via l'algorithme grégorien anonyme (Computus / Gauss).
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const HOLIDAY_CACHE = {};

// Jours fériés légaux français (métropole, hors Alsace-Moselle).
export function holidaysFor(year) {
  if (HOLIDAY_CACHE[year]) return HOLIDAY_CACHE[year];
  const easter = easterSunday(year);
  const map = new Map();
  const add = (d, label) => map.set(isoDay(d), label);
  add(new Date(year, 0, 1),    "Jour de l'An");
  add(addDays(easter, 1),      "Lundi de Pâques");
  add(new Date(year, 4, 1),    "Fête du Travail");
  add(new Date(year, 4, 8),    "Victoire 1945");
  add(addDays(easter, 39),     "Ascension");
  add(addDays(easter, 50),     "Lundi de Pentecôte");
  add(new Date(year, 6, 14),   "Fête nationale");
  add(new Date(year, 7, 15),   "Assomption");
  add(new Date(year, 10, 1),   "Toussaint");
  add(new Date(year, 10, 11),  "Armistice 1918");
  add(new Date(year, 11, 25),  "Noël");
  HOLIDAY_CACHE[year] = map;
  return map;
}

export function getHolidayLabel(iso) {
  const year = parseInt(iso.slice(0, 4), 10);
  if (!Number.isFinite(year)) return null;
  return holidaysFor(year).get(iso) || null;
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
