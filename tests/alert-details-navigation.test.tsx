import type { ReactNode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  EmergencyScreenProvider,
  useScreenNavigation,
} from '@/react/screens/context';

function Wrapper({ children }: { readonly children: ReactNode }) {
  return <EmergencyScreenProvider>{children}</EmergencyScreenProvider>;
}

function setup() {
  return renderHook(() => useScreenNavigation(), { wrapper: Wrapper });
}

afterEach(() => {
  cleanup();
});

describe('screen navigation params', () => {
  it('carries the history filter when navigating to history', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('history', { filter: 'top-ups' });
    });

    expect(result.current.screen).toBe('history');
    expect(result.current.params.filter).toBe('top-ups');
  });

  it('restores the previous params when going back', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('history', { filter: 'top-ups' });
    });
    act(() => {
      result.current.navigate('details');
    });

    expect(result.current.params.filter).toBeUndefined();

    act(() => {
      result.current.back();
    });

    expect(result.current.screen).toBe('history');
    expect(result.current.params.filter).toBe('top-ups');
  });

  it('clears the params and history on reset', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('history', { filter: 'alerts' });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.screen).toBe('primary');
    expect(result.current.params.filter).toBeUndefined();
    expect(result.current.history).toHaveLength(0);
  });

  it('updates the view when the same screen receives another filter', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('history', { filter: 'alerts' });
    });
    act(() => {
      result.current.navigate('history', { filter: 'top-ups' });
    });

    expect(result.current.screen).toBe('history');
    expect(result.current.params.filter).toBe('top-ups');
    expect(result.current.history.map((entry) => entry.screen)).toEqual([
      'primary',
      'history',
    ]);
  });

  it('does not duplicate history when the screen and params match', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('history', { filter: 'alerts' });
    });
    act(() => {
      result.current.navigate('history', { filter: 'alerts' });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]?.screen).toBe('primary');
  });

  it('replaces the current screen without stacking it on the history', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('history', { filter: 'top-ups' });
    });
    act(() => {
      result.current.replace('details');
    });

    expect(result.current.screen).toBe('details');
    expect(result.current.history.map((entry) => entry.screen)).toEqual([
      'primary',
    ]);

    act(() => {
      result.current.back();
    });

    expect(result.current.screen).toBe('primary');
  });
});
