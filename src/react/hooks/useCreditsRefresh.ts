import { useEffect } from 'react';
import { creditHistoryPage } from '@/core/credits';
import { useEmergencyController } from '@/react/hooks/useEmergencyController';

interface RefreshFlags {
  readonly summarySilent: boolean;
  readonly historySilent: boolean;
}

const POLL_FLAGS: RefreshFlags = {
  summarySilent: true,
  historySilent: true,
};

/** Interval between screen-scoped credit refreshes. */
export const CREDITS_POLL_INTERVAL_MS = 10_000;

export interface CreditsRefreshOptions {
  /** Refreshes the credit summary while the screen is mounted. */
  readonly summary?: boolean;
  /** Refreshes the current credit history page while the screen is mounted. */
  readonly history?: boolean;
}

/**
 * Keeps the declared credit resources fresh while a screen is mounted.
 * Mounts revalidate silently when a value already exists.
 */
export function useCreditsRefresh({
  summary = false,
  history = false,
}: CreditsRefreshOptions = {}): void {
  const client = useEmergencyController();

  useEffect(() => {
    let cancelled = false;
    const credits = client.getState().credits;
    const mountFlags: RefreshFlags = {
      summarySilent: credits.credit !== null,
      historySilent: credits.historyStatus !== 'idle',
    };

    async function revalidate(flags: RefreshFlags): Promise<void> {
      if (cancelled) {
        return;
      }

      await client.ensureSession();

      if (cancelled) {
        return;
      }

      if (summary) {
        void client.refreshCredits({ silent: flags.summarySilent });
      }

      if (history) {
        const page = creditHistoryPage(client.getState().credits);

        void client.loadCreditHistory(page, undefined, {
          silent: flags.historySilent,
        });
      }
    }

    void revalidate(mountFlags);

    const interval = setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      void revalidate(POLL_FLAGS);
    }, CREDITS_POLL_INTERVAL_MS);

    function onVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        void revalidate(POLL_FLAGS);
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      cancelled = true;
      clearInterval(interval);

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [client, history, summary]);
}
