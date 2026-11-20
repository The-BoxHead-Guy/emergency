import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copy } from '@/core/copy';
import { createEmergencyError } from '@/core/errors';
import {
  ABORT_CREDITS_FEEDBACK_AUTO_DISMISS_MS,
  EmergencyFeedback,
  FEEDBACK_AUTO_DISMISS_MS,
  GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS,
} from '@/react/components/EmergencyFeedback';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('emergency feedback auto-dismiss', () => {
  it('dismisses a result after the feedback timeout', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <EmergencyFeedback
        abortResult={{ ok: true, message: copy.abortResultOk, at: 1 }}
        simulationResult={null}
        geolocationError={null}
        activationError={null}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_AUTO_DISMISS_MS - 1);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('keeps an abort credit error on screen longer than a regular result', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <EmergencyFeedback
        abortResult={{
          ok: false,
          message: copy.abortCreditsText,
          at: 1,
          code: 'insufficient_credits',
        }}
        simulationResult={null}
        geolocationError={null}
        activationError={null}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_AUTO_DISMISS_MS);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(
        ABORT_CREDITS_FEEDBACK_AUTO_DISMISS_MS - FEEDBACK_AUTO_DISMISS_MS,
      );
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses a geolocation error with the geolocation timeout', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <EmergencyFeedback
        abortResult={null}
        simulationResult={null}
        geolocationError={createEmergencyError(
          'geolocation_denied',
          'User denied geolocation.',
        )}
        activationError={null}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS - 1);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses an activation error with the geolocation timeout', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <EmergencyFeedback
        abortResult={null}
        simulationResult={null}
        geolocationError={null}
        activationError={createEmergencyError(
          'upstream_error',
          'Activation failed.',
        )}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS - 1);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('restarts the timeout when a new result arrives', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    const { rerender } = render(
      <EmergencyFeedback
        abortResult={{ ok: true, message: copy.abortResultOk, at: 1 }}
        simulationResult={null}
        geolocationError={null}
        activationError={null}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_AUTO_DISMISS_MS / 2);
    });

    rerender(
      <EmergencyFeedback
        abortResult={{ ok: true, message: copy.abortResultOk, at: 2 }}
        simulationResult={null}
        geolocationError={null}
        activationError={null}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_AUTO_DISMISS_MS / 2);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_AUTO_DISMISS_MS / 2);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
