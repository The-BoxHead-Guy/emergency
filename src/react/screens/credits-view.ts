import type { CreditsStatus } from '@/core/credits';

/** Presentation state of one credit resource. */
export type CreditResourceView = 'idle' | 'loading' | 'error' | 'ready';

export function creditResourceView(
  status: CreditsStatus,
  hasValue: boolean,
): CreditResourceView {
  if (hasValue) {
    return 'ready';
  }

  if (status === 'loading') {
    return 'loading';
  }

  if (status === 'error') {
    return 'error';
  }

  return status === 'ready' ? 'ready' : 'idle';
}
