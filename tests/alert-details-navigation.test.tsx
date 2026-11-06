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
  it('carries messageId when navigating to a message detail', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('message-detail', { messageId: 'alert-a' });
    });

    expect(result.current.screen).toBe('message-detail');
    expect(result.current.params.messageId).toBe('alert-a');
  });

  it('restores the previous params when going back', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('message-detail', { messageId: 'alert-a' });
    });
    act(() => {
      result.current.navigate('history');
    });

    expect(result.current.params.messageId).toBeUndefined();

    act(() => {
      result.current.back();
    });

    expect(result.current.screen).toBe('message-detail');
    expect(result.current.params.messageId).toBe('alert-a');
  });

  it('clears the params and history on reset', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('message-detail', { messageId: 'alert-a' });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.screen).toBe('primary');
    expect(result.current.params.messageId).toBeUndefined();
    expect(result.current.history).toHaveLength(0);
  });

  it('updates the view when the same screen receives another messageId', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('message-detail', { messageId: 'alert-a' });
    });
    act(() => {
      result.current.navigate('message-detail', { messageId: 'alert-b' });
    });

    expect(result.current.screen).toBe('message-detail');
    expect(result.current.params.messageId).toBe('alert-b');
    expect(result.current.history.map((entry) => entry.screen)).toEqual([
      'primary',
      'message-detail',
    ]);
  });

  it('does not duplicate history when the screen and params match', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('message-detail', { messageId: 'alert-a' });
    });
    act(() => {
      result.current.navigate('message-detail', { messageId: 'alert-a' });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]?.screen).toBe('primary');
  });

  it('replaces the current screen without stacking it on the history', () => {
    const { result } = setup();

    act(() => {
      result.current.navigate('message-detail', { messageId: 'missing' });
    });
    act(() => {
      result.current.replace('history');
    });

    expect(result.current.screen).toBe('history');
    expect(result.current.history.map((entry) => entry.screen)).toEqual([
      'primary',
    ]);

    act(() => {
      result.current.back();
    });

    expect(result.current.screen).toBe('primary');
  });
});
