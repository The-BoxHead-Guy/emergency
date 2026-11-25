import type { CreditsStatus } from '@/core/credits';

/** Presentation state of one credit resource. */
export type CreditResourceView = 'idle' | 'loading' | 'error' | 'ready';

/** Whether a resource without a value is waiting for its first result. */
export function isCreditResourcePending(
  status: CreditsStatus,
  hasValue: boolean,
): boolean {
  return !hasValue && (status === 'idle' || status === 'loading');
}

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
