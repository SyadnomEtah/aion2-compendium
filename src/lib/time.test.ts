import { describe, expect, it } from 'vitest';
import { fmtCountdown, lastDaily, lastWeekly, nextDaily, nextWeekly, type TrackerSettings } from './time';

const settings: TrackerSettings = { daily: '09:00', wday: 3 }; // Wednesday

describe('lastDaily', () => {
  it('returns today\'s boundary when now is after the reset time', () => {
    const now = new Date('2026-01-07T10:00:00');
    expect(lastDaily(now, settings)).toEqual(new Date('2026-01-07T09:00:00'));
  });

  it('returns yesterday\'s boundary when now is before the reset time', () => {
    const now = new Date('2026-01-07T08:59:59');
    expect(lastDaily(now, settings)).toEqual(new Date('2026-01-06T09:00:00'));
  });

  it('treats the exact reset instant as the boundary itself, not the previous day', () => {
    const now = new Date('2026-01-07T09:00:00');
    expect(lastDaily(now, settings)).toEqual(new Date('2026-01-07T09:00:00'));
  });
});

describe('nextDaily', () => {
  it('is exactly one day after the last boundary', () => {
    const now = new Date('2026-01-07T10:00:00');
    expect(nextDaily(now, settings)).toEqual(new Date('2026-01-08T09:00:00'));
  });
});

describe('lastWeekly', () => {
  it('walks back from the daily boundary to the configured weekday', () => {
    // Thursday, one day after the Wednesday reset day
    const now = new Date('2026-01-08T10:00:00');
    expect(lastWeekly(now, settings)).toEqual(new Date('2026-01-07T09:00:00'));
  });

  it('rolls back across a month/year boundary', () => {
    // Tuesday 2026-01-06 is one day before Wednesday: the last Wednesday is 2025-12-31
    const now = new Date('2026-01-06T10:00:00');
    expect(lastWeekly(now, settings)).toEqual(new Date('2025-12-31T09:00:00'));
  });

  it('returns the same instant when now already sits on the reset weekday and time', () => {
    const now = new Date('2026-01-07T09:00:00');
    expect(lastWeekly(now, settings)).toEqual(new Date('2026-01-07T09:00:00'));
  });
});

describe('nextWeekly', () => {
  it('is exactly seven days after the last weekly boundary', () => {
    const now = new Date('2026-01-08T10:00:00');
    expect(nextWeekly(now, settings)).toEqual(new Date('2026-01-14T09:00:00'));
  });
});

describe('fmtCountdown', () => {
  it('formats hours, minutes and seconds with zero padding', () => {
    expect(fmtCountdown(3661000)).toBe('01:01:01');
  });

  it('omits the day segment when under 24h', () => {
    expect(fmtCountdown(0)).toBe('00:00:00');
  });

  it('prefixes the day count when 24h or more', () => {
    expect(fmtCountdown(90061000)).toBe('1d 01:01:01');
  });

  it('clamps negative durations to zero', () => {
    expect(fmtCountdown(-5000)).toBe('00:00:00');
  });
});
