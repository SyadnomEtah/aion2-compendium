import { describe, expect, it } from 'vitest';
import type { PhaseBlock } from '../content-types';
import { phaseStats } from './progress';

function makePhase(keys: string[]): PhaseBlock {
  return {
    type: 'phase',
    id: 'p0',
    num: '0',
    title: 'Before launch',
    goalHtml: '<p>Goal</p>',
    milestones: keys.map((key) => ({ key, labelHtml: key, whyHtml: '' })),
    extraHtml: '',
  };
}

describe('phaseStats', () => {
  it('counts done/total and rounds the percent', () => {
    const phase = makePhase(['r-p0-01', 'r-p0-02', 'r-p0-03']);
    const chk = { 'r-p0-01': true, 'r-p0-02': false };
    expect(phaseStats(phase, chk)).toEqual({ done: 1, total: 3, pct: 33 });
  });

  it('treats a missing key as unticked', () => {
    const phase = makePhase(['r-p0-01', 'r-p0-02']);
    expect(phaseStats(phase, {})).toEqual({ done: 0, total: 2, pct: 0 });
  });

  it('is 100% when every milestone is ticked', () => {
    const phase = makePhase(['r-p0-01', 'r-p0-02']);
    const chk = { 'r-p0-01': true, 'r-p0-02': true };
    expect(phaseStats(phase, chk)).toEqual({ done: 2, total: 2, pct: 100 });
  });

  it('is 0% (not NaN) for a phase with no milestones', () => {
    const phase = makePhase([]);
    expect(phaseStats(phase, {})).toEqual({ done: 0, total: 0, pct: 0 });
  });
});
