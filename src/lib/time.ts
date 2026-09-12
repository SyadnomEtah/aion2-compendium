// Pure time math for the daily/weekly tracker.
// No React, no storage: everything here is a function of `now` and the user's reset settings so it is
// trivial to unit test with a fixed clock.

export interface TrackerSettings {
  /** "HH:MM" 24h daily reset time */
  daily: string;
  /** weekly reset day, 0 = Sunday .. 6 = Saturday */
  wday: number;
}

/** Most recent daily reset boundary at or before `now`. */
export function lastDaily(now: Date, settings: TrackerSettings): Date {
  const [h, m] = settings.daily.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d > now) d.setDate(d.getDate() - 1);
  return d;
}

/** Most recent weekly reset boundary at or before `now`: the last daily boundary, walked back to `wday`. */
export function lastWeekly(now: Date, settings: TrackerSettings): Date {
  const d = lastDaily(now, settings);
  const diff = (d.getDay() - settings.wday + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/** Next daily reset boundary after `now`. */
export function nextDaily(now: Date, settings: TrackerSettings): Date {
  const d = lastDaily(now, settings);
  d.setDate(d.getDate() + 1);
  return d;
}

/** Next weekly reset boundary after `now`. */
export function nextWeekly(now: Date, settings: TrackerSettings): Date {
  const d = lastWeekly(now, settings);
  d.setDate(d.getDate() + 7);
  return d;
}

/** Formats a millisecond duration as "d HH:MM:SS", omitting the day part when it is zero. Negative clamps to 0. */
export function fmtCountdown(ms: number): string {
  const clamped = ms < 0 ? 0 : ms;
  const s = Math.floor(clamped / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (d ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(x);
}
