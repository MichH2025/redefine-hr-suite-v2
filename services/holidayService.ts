
// ── Helpers ──────────────────────────────────────────────────

const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const addDays = (base: Date, days: number): Date => {
  const d = new Date(base.getTime() + days * 86_400_000);
  return d;
};

// ── Year-based module-level cache ────────────────────────────

const holidayCache: Record<number, Map<string, string>> = {};

// ── Exported functions ───────────────────────────────────────

/**
 * Calculates Easter Sunday for a given year using the Gauss algorithm.
 */
export const getEasterSunday = (year: number): Date => {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

/**
 * Returns all 12 Berlin public holidays for a given year as Map<dateString, name>.
 * Results are cached per year at module level.
 */
export const getBerlinHolidays = (year: number): Map<string, string> => {
  if (holidayCache[year]) return holidayCache[year];

  const easter = getEasterSunday(year);

  const holidays: ReadonlyArray<{ date: string; name: string }> = [
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: `${year}-03-08`, name: 'Internationaler Frauentag' },
    { date: toDateKey(addDays(easter, -2)), name: 'Karfreitag' },
    { date: toDateKey(easter), name: 'Ostersonntag' },
    { date: toDateKey(addDays(easter, 1)), name: 'Ostermontag' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: toDateKey(addDays(easter, 39)), name: 'Christi Himmelfahrt' },
    { date: toDateKey(addDays(easter, 49)), name: 'Pfingstsonntag' },
    { date: toDateKey(addDays(easter, 50)), name: 'Pfingstmontag' },
    { date: `${year}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${year}-12-25`, name: '1. Weihnachtsfeiertag' },
    { date: `${year}-12-26`, name: '2. Weihnachtsfeiertag' },
  ];

  const map = new Map<string, string>();
  for (const h of holidays) {
    map.set(h.date, h.name);
  }

  holidayCache[year] = map;
  return map;
};

/**
 * Returns the holiday name for a given date, or null if it's not a holiday.
 */
export const getHolidayName = (date: Date): string | null => {
  return getBerlinHolidays(date.getFullYear()).get(toDateKey(date)) ?? null;
};

/**
 * Returns true if the date is a weekend (Sat/Sun) or a Berlin public holiday.
 */
export const isNonWorkday = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6 || getHolidayName(date) !== null;
};

/**
 * Calculates the number of working days between start and end (inclusive),
 * excluding weekends and Berlin public holidays.
 */
export const calcWorkDays = (start: Date, end: Date): number => {
  let count = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cur <= endDate) {
    if (!isNonWorkday(cur)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// ── Existing functions (preserved) ───────────────────────────

/**
 * Calculates net working days (excluding Sat, Sun, and dynamic Berlin Holidays).
 */
export const calculateWorkingDays = (start: Date, end: Date): number => {
  return calcWorkDays(start, end);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
