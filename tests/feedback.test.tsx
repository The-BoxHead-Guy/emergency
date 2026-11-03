import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copy } from '@/core/copy';
import { createEmergencyError } from '@/core/errors';
import {
  EmergencyFeedback,
  FEEDBACK_AUTO_DISMISS_MS,
  GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS,
} from '@/react/components/EmergencyFeedback';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('emergency feedback', () => {
  it('auto-dismisses a success message after the timeout', () => {
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

    expect(screen.getByText(copy.abortSuccessTitle)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_AUTO_DISMISS_MS);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses an error message after the timeout', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <EmergencyFeedback
        abortResult={{ ok: false, message: copy.abortResultFail, at: 1 }}
        simulationResult={null}
        geolocationError={null}
        activationError={null}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText(copy.errorTitle)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_AUTO_DISMISS_MS);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows geolocation errors as dismissable feedback after five seconds', () => {
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

    expect(screen.getByRole('alert')).toHaveTextContent(copy.errorTitle);
    expect(screen.getByText(copy.geolocationDenied)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS - 1);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows activation errors as dismissable feedback after five seconds', () => {
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

    expect(screen.getByRole('alert')).toHaveTextContent(copy.errorTitle);
    expect(screen.getByText('Activation failed.')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS - 1);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
