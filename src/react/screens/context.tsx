import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { EmergencyScreenId } from '@/react/screens/types';

export interface EmergencyScreenNavigation {
  readonly screen: EmergencyScreenId;
  readonly history: readonly EmergencyScreenId[];
  readonly navigate: (screen: EmergencyScreenId) => void;
  readonly back: () => void;
  readonly reset: () => void;
}

interface NavigationState {
  readonly screen: EmergencyScreenId;
  readonly history: readonly EmergencyScreenId[];
}

const EmergencyScreenContext = createContext<EmergencyScreenNavigation | null>(
  null,
);

export interface EmergencyScreenProviderProps {
  readonly children: ReactNode;
  readonly initialScreen?: EmergencyScreenId;
}

export function EmergencyScreenProvider({
  children,
  initialScreen = 'primary',
}: EmergencyScreenProviderProps) {
  const [state, setState] = useState<NavigationState>({
    screen: initialScreen,
    history: [],
  });

  const navigate = useCallback((next: EmergencyScreenId) => {
    setState((current) => {
      if (current.screen === next) {
        return current;
      }

      return {
        screen: next,
        history: [...current.history, current.screen],
      };
    });
  }, []);

  const back = useCallback(() => {
    setState((current) => {
      const previous = current.history.at(-1);

      if (!previous) {
        return current;
      }

      return {
        screen: previous,
        history: current.history.slice(0, -1),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((current) => {
      if (current.screen === 'primary' && current.history.length === 0) {
        return current;
      }

      return { screen: 'primary', history: [] };
    });
  }, []);

  const value = useMemo<EmergencyScreenNavigation>(
    () => ({
      screen: state.screen,
      history: state.history,
      navigate,
      back,
      reset,
    }),
    [back, navigate, reset, state.history, state.screen],
  );

  return (
    <EmergencyScreenContext.Provider value={value}>
      {children}
    </EmergencyScreenContext.Provider>
  );
}

export function useScreenNavigation(): EmergencyScreenNavigation {
  const value = useContext(EmergencyScreenContext);

  if (!value) {
    throw new Error(
      'useScreenNavigation must be used inside EmergencyScreenProvider.',
    );
  }

  return value;
}
