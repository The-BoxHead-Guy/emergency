import { act, cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmergencyProvider } from '@/react/context';
import {
  CREDITS_POLL_INTERVAL_MS,
  useCreditsRefresh,
} from '@/react/hooks/useCreditsRefresh';
import { createTestController } from '@/test/fakes';

const mounted: Array<ReturnType<typeof createTestController>> = [];

function setup(): ReturnType<typeof createTestController> {
  const controller = createTestController();
  mounted.push(controller);

  return controller;
}

function wrapperFor(controller: ReturnType<typeof createTestController>) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <EmergencyProvider
        value={{
          store: controller.store,
          client: controller.client,
          config: controller.store.getState().config,
        }}
      >
        {children}
      </EmergencyProvider>
    );
  };
}

function mountHook(
  controller: ReturnType<typeof createTestController>,
  options: { readonly summary?: boolean; readonly history?: boolean } = {},
) {
  return renderHook(() => useCreditsRefresh(options), {
    wrapper: wrapperFor(controller),
  });
}

async function flush(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

afterEach(() => {
  vi.useRealTimers();

  for (const controller of mounted.splice(0)) {
    controller.client.destroy();
  }

  cleanup();
});

describe('useCreditsRefresh', () => {
  it('awaits the session on mount and requests the declared resources', async () => {
    vi.useFakeTimers();
    const controller = setup();
    const refresh = vi.spyOn(controller.client, 'refreshCredits');
    const history = vi.spyOn(controller.client, 'loadCreditHistory');

    mountHook(controller, { summary: true, history: true });
    await flush();

    expect(controller.bff.config).toHaveBeenCalledTimes(1);
    expect(controller.client.getState().sessionReady).toBe(true);
    expect(refresh).toHaveBeenCalledWith({ silent: false });
    expect(history).toHaveBeenCalledWith(1, undefined, { silent: false });
  });

  it('revalidates existing data silently on mount', async () => {
    vi.useFakeTimers();
    const controller = setup();

    await controller.client.ensureSession();
    await controller.client.loadCreditHistory(1);

    const refresh = vi.spyOn(controller.client, 'refreshCredits');
    const history = vi.spyOn(controller.client, 'loadCreditHistory');

    mountHook(controller, { summary: true, history: true });
    await flush();

    expect(refresh).toHaveBeenCalledWith({ silent: true });
    expect(history).toHaveBeenCalledWith(1, undefined, { silent: true });
    expect(controller.client.getState().credits.summaryStatus).toBe('ready');
    expect(controller.client.getState().credits.historyStatus).toBe('ready');
  });

  it('refreshes both resources every 10 seconds', async () => {
    vi.useFakeTimers();
    const controller = setup();

    await controller.client.ensureSession();

    const refresh = vi.spyOn(controller.client, 'refreshCredits');
    const history = vi.spyOn(controller.client, 'loadCreditHistory');

    mountHook(controller, { summary: true, history: true });
    await flush();

    refresh.mockClear();
    history.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CREDITS_POLL_INTERVAL_MS);
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith({ silent: true });
    expect(history).toHaveBeenCalledTimes(1);
    expect(history).toHaveBeenCalledWith(1, undefined, { silent: true });
  });

  it('skips hidden ticks and refreshes when the document becomes visible', async () => {
    vi.useFakeTimers();
    const controller = setup();
    const original = Object.getOwnPropertyDescriptor(
      document,
      'visibilityState',
    );

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    await controller.client.ensureSession();

    const history = vi.spyOn(controller.client, 'loadCreditHistory');

    mountHook(controller, { summary: true, history: true });
    await flush();
    history.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CREDITS_POLL_INTERVAL_MS);
    });
    expect(history).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(history).toHaveBeenCalledTimes(1);
    expect(history).toHaveBeenCalledWith(1, undefined, { silent: true });

    if (original) {
      Object.defineProperty(document, 'visibilityState', original);
    }
  });

  it('stops polling after unmount', async () => {
    vi.useFakeTimers();
    const controller = setup();

    await controller.client.ensureSession();

    const history = vi.spyOn(controller.client, 'loadCreditHistory');
    const { unmount } = mountHook(controller, { summary: true, history: true });

    await flush();
    history.mockClear();
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CREDITS_POLL_INTERVAL_MS * 2);
    });

    expect(history).not.toHaveBeenCalled();
  });
});
