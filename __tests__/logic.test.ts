import {
  fillDays,
  formatDuration,
  lastDays,
  dayKey,
  labelDay,
  monthLabel,
} from '../src/stats';

test('lastDays ends today, oldest first, crosses month boundary', () => {
  expect(lastDays(3, new Date(2026, 2, 1))).toEqual([
    '2026-02-27',
    '2026-02-28',
    '2026-03-01',
  ]);
  expect(dayKey(new Date(2026, 8, 5))).toBe('2026-09-05');
});

test('fillDays pads missing days with zeros', () => {
  const out = fillDays(['a', 'b'], [{ day: 'b', count: 3, ms: 9000 }]);
  expect(out).toEqual([
    { day: 'a', count: 0, ms: 0 },
    { day: 'b', count: 3, ms: 9000 },
  ]);
});

test('formatDuration', () => {
  expect(formatDuration(5000)).toBe('5s');
  expect(formatDuration(125000)).toBe('2m');
  expect(formatDuration(3900000)).toBe('1h 5m');
});

test('labelDay', () => {
  expect(labelDay('2026-10-01', '2026-10-01')).toBe('Today');
  expect(labelDay('2026-09-30', '2026-10-01')).toBe('Yesterday');
  expect(labelDay('2026-09-28', '2026-10-01')).toBe('Mon, 28 Sep');
});

test('monthLabel', () => {
  expect(monthLabel('2026-10')).toBe('October 2026');
});
