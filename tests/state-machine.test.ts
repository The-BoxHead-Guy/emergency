import { describe, expect, it } from 'vitest';
import {
  EMERGENCY_PHASE_NAMES,
  EMERGENCY_TRANSITIONS,
  InvalidTransitionError,
  assertTransition,
  canTransition,
  phaseName,
} from '@/core/state-machine';
import type { EmergencyPhase } from '@/core/types';

describe('emergency state machine', () => {
  it('exposes every phase name', () => {
    expect(EMERGENCY_PHASE_NAMES).toContain('idle');
    expect(EMERGENCY_PHASE_NAMES).toContain('active');
    expect(EMERGENCY_PHASE_NAMES).toContain('error');
  });

  it('allows the documented lifecycle transitions', () => {
    expect(canTransition('idle', 'initializing')).toBe(true);
    expect(canTransition('initializing', 'ready')).toBe(true);
    expect(canTransition('ready', 'activating')).toBe(true);
    expect(canTransition('ready', 'active')).toBe(true);
    expect(canTransition('activating', 'active')).toBe(true);
    expect(canTransition('active', 'refreshing')).toBe(true);
    expect(canTransition('refreshing', 'active')).toBe(true);
    expect(canTransition('active', 'aborting')).toBe(true);
    expect(canTransition('aborting', 'ready')).toBe(true);
    expect(canTransition('error', 'initializing')).toBe(true);
  });

  it('rejects transitions that skip required phases', () => {
    expect(canTransition('idle', 'active')).toBe(false);
    expect(canTransition('simulating', 'refreshing')).toBe(false);
    expect(canTransition('active', 'activating')).toBe(false);
    expect(canTransition('simulating', 'active')).toBe(false);
    expect(canTransition('aborting', 'activating')).toBe(false);
  });

  it('reports the phase name and transition table lookup', () => {
    const phase: EmergencyPhase = {
      kind: 'active',
      emergencyId: 'emg-1',
      simulated: false,
    };

    expect(phaseName(phase)).toBe('active');
    expect(EMERGENCY_TRANSITIONS.active).toEqual([
      'idle',
      'ready',
      'refreshing',
      'aborting',
      'error',
    ]);
  });

  it('throws a typed error from assertTransition', () => {
    expect(() => assertTransition('idle', 'aborting')).toThrow(
      InvalidTransitionError,
    );
    expect(() => assertTransition('idle', 'initializing')).not.toThrow();
  });
});
