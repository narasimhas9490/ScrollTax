import type { DayRow } from './native/ScrollTax';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local yyyy-MM-dd, matching the native side's day key. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Last [n] local days ending today, oldest first. */
export const lastDays = (n: number, now = new Date()): string[] =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (n - 1 - i),
    );
    return dayKey(d);
  });

/** Fills days with no reels so the chart always has [days.length] bars. */
export const fillDays = (days: string[], rows: DayRow[]): DayRow[] =>
  days.map(day => rows.find(r => r.day === day) ?? { day, count: 0, ms: 0 });

export const formatDuration = (ms: number): string => {
  const m = Math.floor(ms / 60000);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(ms / 1000)}s`;
};

export const weekday = (day: string): string =>
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(`${day}T00:00:00`).getDay()];

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Today", "Yesterday", else "Mon, 29 Sep". [today] is a yyyy-MM-dd key. */
export const labelDay = (day: string, today: string): string => {
  if (day === today) return 'Today';
  const d = new Date(`${day}T00:00:00`);
  if (
    day === dayKey(new Date(new Date(`${today}T00:00:00`).getTime() - 86400000))
  )
    return 'Yesterday';
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "2026-10" -> "October 2026". */
export const monthLabel = (m: string): string => {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${names[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
};
