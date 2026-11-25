import { describe, expect, it } from 'vitest';
import { isCreditResourcePending } from '@/react/screens/credits-view';

describe('isCreditResourcePending', () => {
  it('is pending while the first value is idle or loading', () => {
    expect(isCreditResourcePending('idle', false)).toBe(true);
    expect(isCreditResourcePending('loading', false)).toBe(true);
  });

  it('is not pending once a value exists', () => {
    expect(isCreditResourcePending('idle', true)).toBe(false);
    expect(isCreditResourcePending('loading', true)).toBe(false);
    expect(isCreditResourcePending('ready', true)).toBe(false);
  });

  it('is not pending after a finished request without a value', () => {
    expect(isCreditResourcePending('ready', false)).toBe(false);
    expect(isCreditResourcePending('error', false)).toBe(false);
  });
});
