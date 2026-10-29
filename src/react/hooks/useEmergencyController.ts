import { useEmergencyContext } from '@/react/context';
import type { EmergencyClient } from '@/core/types';

export function useEmergencyController(): EmergencyClient {
  return useEmergencyContext().client;
}
