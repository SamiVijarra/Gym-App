const DEFAULT_TIME_ZONE = 'America/Argentina/Cordoba';

export function todayInAppTimeZone(): string {
  const timeZone = process.env.APP_TIMEZONE ?? DEFAULT_TIME_ZONE;
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getWeekStart(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

export function getMonthRange(year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, '0');
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}
