import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { readCollapsed, useCollapsed } from './collapsed';

beforeEach(() => localStorage.clear());

describe('useCollapsed', () => {
  it('applies the per-element default until toggled', () => {
    const { result } = renderHook(() => useCollapsed());
    expect(result.current.isCollapsed('start-c1')).toBe(false);
    expect(result.current.isCollapsed('start-sources', true)).toBe(true);
    act(() => result.current.toggle('start-sources', true));
    expect(result.current.isCollapsed('start-sources', true)).toBe(false);
  });

  it('persists toggles and bulk changes to localStorage', () => {
    const { result } = renderHook(() => useCollapsed());
    act(() => result.current.toggle('start-c1'));
    act(() => result.current.setMany(['a', 'b'], true));
    expect(readCollapsed()).toEqual({ 'start-c1': true, a: true, b: true });
    const again = renderHook(() => useCollapsed());
    expect(again.result.current.isCollapsed('start-c1')).toBe(true);
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem('aion2.collapsed', '[1,2]');
    expect(readCollapsed()).toEqual({});
  });
});
