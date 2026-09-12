import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup, type BackupTracker } from './backup';

const tracker: BackupTracker = {
  chars: [{ id: 'c1', name: 'Daeva', cls: 'templar', level: 12 }],
  custom: [],
  counts: { 't1': { c1: 2 } },
  hidden: { t2: true },
  settings: { daily: '09:00', wday: 3, showAll: false, showHidden: false, showDetails: true },
};

describe('buildBackup / parseBackup round trip', () => {
  it('parses back to the same chk, profile, page and tracker data', () => {
    const chk = { 'r-p0-01': true, 'r-p0-02': false };
    const profile = { name: 'Test', class: 'templar' };
    const built = buildBackup(chk, profile, 'roadmap', tracker);
    const text = JSON.stringify(built);

    const parsed = parseBackup(text);

    expect(parsed.version).toBe(2);
    expect(parsed.chk).toEqual(chk);
    expect(parsed.profile).toEqual(profile);
    expect(parsed.page).toBe('roadmap');
    expect(parsed.tracker).toEqual(tracker);
  });

  it('fills in defaults for a backup missing optional fields', () => {
    const text = JSON.stringify({ version: 2, chk: {} });
    const parsed = parseBackup(text);
    expect(parsed.profile).toEqual({});
    expect(parsed.page).toBe('home');
    expect(parsed.tracker).toBeUndefined();
  });

  it('fills in defaults for a present tracker missing its own optional fields', () => {
    const text = JSON.stringify({ version: 2, chk: {}, tracker: {} });
    const parsed = parseBackup(text);
    expect(parsed.tracker?.chars).toEqual([]);
    expect(parsed.tracker?.settings.daily).toBe('09:00');
  });

  it('returns tracker: undefined when the backup file has no tracker field, so importing an older backup does not wipe the current tracker', () => {
    const text = JSON.stringify({ version: 2, chk: { 'r-p0-01': true }, profile: { name: 'Test' } });
    const parsed = parseBackup(text);
    expect(parsed.tracker).toBeUndefined();
  });
});

describe('parseBackup invalid input', () => {
  it('throws on text that is not JSON', () => {
    expect(() => parseBackup('not json')).toThrow();
  });

  it('throws when chk is missing', () => {
    expect(() => parseBackup(JSON.stringify({ version: 2 }))).toThrow();
  });

  it('throws when chk is not an object', () => {
    expect(() => parseBackup(JSON.stringify({ version: 2, chk: 'nope' }))).toThrow();
  });

  it('throws on a JSON value that is not an object at all', () => {
    expect(() => parseBackup(JSON.stringify([1, 2, 3]))).toThrow();
  });
});
