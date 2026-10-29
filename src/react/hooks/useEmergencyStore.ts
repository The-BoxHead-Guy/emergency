import { useStore } from 'zustand';
import { useEmergencyContext } from '@/react/context';
import type { EmergencyStore } from '@/core/store';
import type { EmergencyClientState } from '@/core/types';

export function useEmergencyStore<T>(
  selector: (state: EmergencyClientState) => T,
): T {
  const { store } = useEmergencyContext();

  return useStore<EmergencyStore, T>(store, selector);
}
