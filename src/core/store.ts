import { createStore, type StoreApi } from 'zustand/vanilla';
import type { EmergencyClientState, EmergencyConfig } from '@/core/types';

export type EmergencyStore = StoreApi<EmergencyClientState>;

export function createEmergencyStore(config: EmergencyConfig): EmergencyStore {
  return createStore<EmergencyClientState>(() => ({
    config,
    phase: { kind: 'idle' },
    panelOpen: false,
    sessionReady: false,
    resumeAvailable: false,
    snapshot: null,
    responders: [],
    failures: [],
    messages: [],
    lastError: null,
    geolocation: null,
    geolocationError: null,
    realtimeStatus: 'idle',
    abortResult: null,
    simulationResult: null,
    abortConfirmation: false,
    simulationConfirmation: false,
    destroyed: false,
  }));
}
