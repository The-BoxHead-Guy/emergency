import type { EmergencyPhase, EmergencyPhaseName } from '@/core/types';

export const EMERGENCY_PHASE_NAMES: readonly EmergencyPhaseName[] = [
  'idle',
  'initializing',
  'ready',
  'activating',
  'simulating',
  'active',
  'refreshing',
  'aborting',
  'error',
] as const;

/**
 * Every allowed transition. `idle` is reachable from every phase so `destroy()`
 * and a hard reset always leave the store in a known state.
 */
export const EMERGENCY_TRANSITIONS: Readonly<
  Record<EmergencyPhaseName, readonly EmergencyPhaseName[]>
> = {
  idle: ['initializing'],
  initializing: ['idle', 'ready', 'active', 'error'],
  ready: [
    'idle',
    'initializing',
    'activating',
    'simulating',
    'active',
    'refreshing',
    'error',
  ],
  activating: ['idle', 'ready', 'active', 'error'],
  simulating: ['idle', 'ready', 'error'],
  active: ['idle', 'ready', 'refreshing', 'aborting', 'error'],
  refreshing: ['idle', 'active', 'error'],
  aborting: ['idle', 'ready', 'active', 'error'],
  error: ['idle', 'initializing', 'ready'],
};

export function phaseName(phase: EmergencyPhase): EmergencyPhaseName {
  return phase.kind;
}

export function isEmergencyPhaseName(
  value: unknown,
): value is EmergencyPhaseName {
  return (
    typeof value === 'string' &&
    EMERGENCY_PHASE_NAMES.some((name) => name === value)
  );
}

export function canTransition(
  from: EmergencyPhaseName,
  to: EmergencyPhaseName,
): boolean {
  return EMERGENCY_TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  readonly from: EmergencyPhaseName;
  readonly to: EmergencyPhaseName;

  constructor(from: EmergencyPhaseName, to: EmergencyPhaseName) {
    super(`Invalid emergency phase transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

export function assertTransition(
  from: EmergencyPhaseName,
  to: EmergencyPhaseName,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
