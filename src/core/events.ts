import type {
  EmergencyEventHandler,
  EmergencyEventMap,
  EmergencyEventName,
} from '@/core/types';

type StoredHandler = (payload: never) => void;

/**
 * Typed, dependency-free event bus used by the controller and by `mount()`.
 * DOM custom events are not used so the core stays framework agnostic.
 */
export const EMERGENCY_EVENT_NAMES: readonly EmergencyEventName[] = [
  'session:ready',
  'emergency:activated',
  'emergency:simulated',
  'emergency:resumed',
  'emergency:updated',
  'emergency:aborted',
  'emergency:failed',
  'emergency:fallback',
  'panel:opened',
  'panel:closed',
] as const;

export class EmergencyEventEmitter {
  private readonly handlers = new Map<EmergencyEventName, Set<StoredHandler>>();

  on<K extends EmergencyEventName>(
    event: K,
    handler: EmergencyEventHandler<K>,
  ): () => void {
    const set = this.handlers.get(event) ?? new Set<StoredHandler>();
    // A handler for a specific payload type is assignable to a `never`
    // parameter by contravariance, but the stored-map type erases `K`, so the
    // assertion is the only way to keep the public API strongly typed.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    set.add(handler as StoredHandler);
    this.handlers.set(event, set);

    return () => {
      this.off(event, handler);
    };
  }

  off<K extends EmergencyEventName>(
    event: K,
    handler: EmergencyEventHandler<K>,
  ): void {
    const set = this.handlers.get(event);

    if (!set) {
      return;
    }

    // Same type erasure as `on()`: the stored handler accepts `never`, so
    // deleting requires restoring the erased signature.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    set.delete(handler as StoredHandler);

    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  emit<K extends EmergencyEventName>(
    event: K,
    payload: EmergencyEventMap[K],
  ): void {
    const set = this.handlers.get(event);

    if (!set) {
      return;
    }

    for (const handler of set) {
      try {
        // Same type erasure as `on()`: the stored handler accepts `never`, so
        // restoring the specific handler signature cannot avoid the assertion.
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (handler as EmergencyEventHandler<K>)(payload);
      } catch {
        // A failing host handler must never break the emergency flow.
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export function createEventEmitter(): EmergencyEventEmitter {
  return new EmergencyEventEmitter();
}
