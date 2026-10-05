import {
  getMonthRange,
  getWeekStart,
  shiftIsoDate,
  todayInAppTimeZone,
} from './date.util';

describe('date.util', () => {
  describe('getWeekStart', () => {
    it.each([
      ['2026-09-28', '2026-09-28'],
      ['2026-09-29', '2026-09-28'],
      ['2026-10-03', '2026-09-28'],
      ['2026-10-04', '2026-09-28'],
      ['2026-10-05', '2026-10-05'],
    ])('the week of %s starts on Monday %s', (date, expected) => {
      expect(getWeekStart(date)).toBe(expected);
    });

    it('crosses month and year boundaries', () => {
      expect(getWeekStart('2027-01-01')).toBe('2026-12-28');
    });

    it('ignores a time part', () => {
      expect(getWeekStart('2026-10-04T23:30:00.000Z')).toBe('2026-09-28');
    });

    it('is not shifted when the process timezone is behind UTC (jest runs in America/Argentina/Cordoba)', () => {
      expect(new Date().getTimezoneOffset()).toBeGreaterThan(0);
      expect(getWeekStart('2026-09-28')).toBe('2026-09-28');
      expect(getWeekStart('2026-10-04')).toBe('2026-09-28');
    });
  });

  describe('shiftIsoDate', () => {
    it('moves forward and backward', () => {
      expect(shiftIsoDate('2026-09-28', -7)).toBe('2026-09-21');
      expect(shiftIsoDate('2026-12-30', 3)).toBe('2027-01-02');
    });
  });

  describe('getMonthRange', () => {
    it('handles 30, 31 and leap-year months', () => {
      expect(getMonthRange(2026, 9)).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      });
      expect(getMonthRange(2026, 10).endDate).toBe('2026-10-31');
      expect(getMonthRange(2028, 2).endDate).toBe('2028-02-29');
      expect(getMonthRange(2027, 2).endDate).toBe('2027-02-28');
    });
  });

  describe('todayInAppTimeZone', () => {
    afterEach(() => {
      jest.useRealTimers();
      delete process.env.APP_TIMEZONE;
    });

    it('uses the app timezone, not UTC (22:00 in Cordoba is already the next day in UTC)', () => {
      jest.useFakeTimers({ now: new Date('2026-10-04T01:00:00Z') });
      expect(todayInAppTimeZone()).toBe('2026-10-03');
    });

    it('can be changed with APP_TIMEZONE', () => {
      jest.useFakeTimers({ now: new Date('2026-10-04T01:00:00Z') });
      process.env.APP_TIMEZONE = 'Pacific/Auckland';
      expect(todayInAppTimeZone()).toBe('2026-10-04');
    });
  });
});
