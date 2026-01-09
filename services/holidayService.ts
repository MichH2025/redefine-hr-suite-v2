
/**
 * Calculates Easter Sunday for a given year using the Gauss algorithm.
 */
const getEasterSunday = (year: number): Date => {
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
 * Returns a list of Berlin holidays (YYYY-MM-DD) for a specific year.
 */
const getBerlinHolidays = (year: number): string[] => {
  const easter = getEasterSunday(year);
  
  const addDays = (date: Date, days: number): string => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fixedHolidays = [
    `${year}-01-01`, // Neujahr
    `${year}-03-08`, // Internationaler Frauentag
    `${year}-05-01`, // Tag der Arbeit
    `${year}-10-03`, // Tag der Deutschen Einheit
    `${year}-12-25`, // 1. Weihnachtstag
    `${year}-12-26`, // 2. Weihnachtstag
  ];

  const floatingHolidays = [
    addDays(easter, -2), // Karfreitag
    addDays(easter, 1),  // Ostermontag
    addDays(easter, 39), // Christi Himmelfahrt
    addDays(easter, 50), // Pfingstmontag
  ];

  return [...fixedHolidays, ...floatingHolidays];
};

/**
 * Calculates net working days (excluding Sat, Sun, and dynamic Berlin Holidays)
 */
export const calculateWorkingDays = (start: Date, end: Date): number => {
  let count = 0;
  const curDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  // Cache for holidays to avoid recalculating for the same year
  const holidayCache: Record<number, string[]> = {};

  while (curDate <= endDate) {
    const year = curDate.getFullYear();
    if (!holidayCache[year]) {
      holidayCache[year] = getBerlinHolidays(year);
    }

    const dayOfWeek = curDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const m = String(curDate.getMonth() + 1).padStart(2, '0');
    const d = String(curDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${m}-${d}`;
    
    const isHoliday = holidayCache[year].includes(dateString);
    
    if (!isWeekend && !isHoliday) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
