import { createContext, useContext, type ReactNode } from 'react';
import type {
  EmergencyClient,
  EmergencyConfig,
  EmergencyError,
} from '@/core/types';
import type { EmergencyStore } from '@/core/store';

export interface EmergencyContextValue {
  readonly store: EmergencyStore;
  readonly client: EmergencyClient;
  readonly config: EmergencyConfig;
}

const EmergencyContext = createContext<EmergencyContextValue | null>(null);

export function EmergencyProvider({
  value,
  children,
}: {
  readonly value: EmergencyContextValue;
  readonly children: ReactNode;
}) {
  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergencyContext(): EmergencyContextValue {
  const value = useContext(EmergencyContext);

  if (value === null) {
    throw new Error(
      'Emergency components must be rendered inside an emergency client.',
    );
  }

  return value;
}

export function errorMessage(error: EmergencyError): string {
  return error.message;
}
