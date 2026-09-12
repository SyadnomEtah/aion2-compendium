import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// tracker.ts fetches the base task list through lib/content.ts; stub it so tests never hit the network
// and control exactly which tasks exist for the wipe/autoReset scenarios below.
vi.mock('./content', () => ({
  fetchTasks: vi.fn().mockResolvedValue([
    {
      id: 'd1',
      name: 'Daily Task',
      scope: 'daily',
      per: 'character',
      max: null,
      unit: '',
      minLevel: null,
      group: 'g',
      note: '',
      src: '',
      srcLabel: '',
      confidence: '',
      krEra: false,
    },
    {
      id: 'w1',
      name: 'Weekly Task',
      scope: 'weekly',
      per: 'character',
      max: null,
      unit: '',
      minLevel: null,
      group: 'g',
      note: '',
      src: '',
      srcLabel: '',
      confidence: '',
      krEra: false,
    },
  ]),
}));

// tracker.ts holds its state at module scope (shared across every useTracker() consumer, by design). To
// get a clean slate per test we reset the module registry and re-import fresh in every test, so module
// init re-reads (the just-cleared) localStorage.
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
});

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useTracker bump', () => {
  it('clamps a counter to [0, max]', async () => {
    const { useTracker } = await import('./tracker');
    const { result } = renderHook(() => useTracker());
    const task = {
      id: 't1',
      name: 'Test',
      scope: 'daily' as const,
      per: 'character' as const,
      max: 2,
      unit: '',
      minLevel: null,
      group: 'g',
      note: '',
      src: '',
      srcLabel: '',
      confidence: '' as const,
      krEra: false,
    };

    act(() => result.current.bump(task, 'c1', 5));
    expect(result.current.counts.t1.c1).toBe(2);

    act(() => result.current.bump(task, 'c1', -10));
    expect(result.current.counts.t1.c1).toBe(0);
  });
});

describe('useTracker wipe', () => {
  it('wipes counters only for the given scope', async () => {
    const { useTracker } = await import('./tracker');
    const { result } = renderHook(() => useTracker());
    await flushMicrotasks();

    const daily = result.current.tasks.find((t) => t.scope === 'daily')!;
    const weekly = result.current.tasks.find((t) => t.scope === 'weekly')!;
    expect(daily).toBeTruthy();
    expect(weekly).toBeTruthy();

    act(() => {
      result.current.bump(daily, 'c1', 3);
      result.current.bump(weekly, 'c1', 4);
    });
    expect(result.current.counts[daily.id]?.c1).toBe(3);
    expect(result.current.counts[weekly.id]?.c1).toBe(4);

    act(() => result.current.wipe('daily'));
    expect(result.current.counts[daily.id]).toBeUndefined();
    expect(result.current.counts[weekly.id]?.c1).toBe(4);
  });
});

describe('autoReset', () => {
  it('wipes daily counters once the stored boundary predates the current daily reset', async () => {
    const { useTracker, autoReset, rebase } = await import('./tracker');
    const { result } = renderHook(() => useTracker());
    await flushMicrotasks();

    const daily = result.current.tasks.find((t) => t.scope === 'daily')!;
    act(() => result.current.bump(daily, 'c1', 1));
    expect(result.current.counts[daily.id]?.c1).toBe(1);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-06T10:00:00'));
    act(() => rebase()); // records yesterday's 09:00 boundary as "last known"

    vi.setSystemTime(new Date('2026-01-07T12:00:00')); // now a full day later, past today's reset too
    act(() => {
      autoReset();
    });

    expect(result.current.counts[daily.id]).toBeUndefined();
  });

  it('does not wipe when the stored boundary already matches the current one', async () => {
    const { useTracker, autoReset, rebase } = await import('./tracker');
    const { result } = renderHook(() => useTracker());
    await flushMicrotasks();

    const daily = result.current.tasks.find((t) => t.scope === 'daily')!;
    act(() => result.current.bump(daily, 'c1', 1));

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-07T12:00:00'));
    act(() => rebase());

    const changed = autoReset();
    expect(changed).toBe(false);
    expect(result.current.counts[daily.id]?.c1).toBe(1);
  });
});
