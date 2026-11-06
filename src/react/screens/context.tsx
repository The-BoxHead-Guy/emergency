import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type {
  EmergencyScreenId,
  EmergencyScreenParams,
} from '@/react/screens/types';

export interface EmergencyScreenHistoryEntry {
  readonly screen: EmergencyScreenId;
  readonly params: EmergencyScreenParams;
}

export interface EmergencyScreenNavigation {
  readonly screen: EmergencyScreenId;
  readonly params: EmergencyScreenParams;
  readonly history: readonly EmergencyScreenHistoryEntry[];
  readonly navigate: (
    screen: EmergencyScreenId,
    params?: EmergencyScreenParams,
  ) => void;
  readonly replace: (
    screen: EmergencyScreenId,
    params?: EmergencyScreenParams,
  ) => void;
  readonly back: () => void;
  readonly reset: () => void;
}

interface NavigationState {
  readonly screen: EmergencyScreenId;
  readonly params: EmergencyScreenParams;
  readonly history: readonly EmergencyScreenHistoryEntry[];
}

const EMPTY_PARAMS: EmergencyScreenParams = {};

const EmergencyScreenContext = createContext<EmergencyScreenNavigation | null>(
  null,
);

export interface EmergencyScreenProviderProps {
  readonly children: ReactNode;
  readonly initialScreen?: EmergencyScreenId;
}

function paramsEqual(
  first: EmergencyScreenParams,
  second: EmergencyScreenParams,
): boolean {
  return first.messageId === second.messageId;
}

export function EmergencyScreenProvider({
  children,
  initialScreen = 'primary',
}: EmergencyScreenProviderProps) {
  const [state, setState] = useState<NavigationState>({
    screen: initialScreen,
    params: EMPTY_PARAMS,
    history: [],
  });

  const navigate = useCallback(
    (next: EmergencyScreenId, params: EmergencyScreenParams = EMPTY_PARAMS) => {
      setState((current) => {
        if (current.screen === next && paramsEqual(current.params, params)) {
          return current;
        }

        return {
          screen: next,
          params,
          history: [
            ...current.history,
            { screen: current.screen, params: current.params },
          ],
        };
      });
    },
    [],
  );

  const back = useCallback(() => {
    setState((current) => {
      const previous = current.history.at(-1);

      if (!previous) {
        return current;
      }

      return {
        screen: previous.screen,
        params: previous.params,
        history: current.history.slice(0, -1),
      };
    });
  }, []);

  const replace = useCallback(
    (next: EmergencyScreenId, params: EmergencyScreenParams = EMPTY_PARAMS) => {
      setState((current) => {
        if (current.screen === next && paramsEqual(current.params, params)) {
          return current;
        }

        const history =
          current.history.at(-1)?.screen === next
            ? current.history.slice(0, -1)
            : current.history;

        return { screen: next, params, history };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setState((current) => {
      if (
        current.screen === 'primary' &&
        current.params.messageId === undefined &&
        current.history.length === 0
      ) {
        return current;
      }

      return { screen: 'primary', params: EMPTY_PARAMS, history: [] };
    });
  }, []);

  const value = useMemo<EmergencyScreenNavigation>(
    () => ({
      screen: state.screen,
      params: state.params,
      history: state.history,
      navigate,
      replace,
      back,
      reset,
    }),
    [back, navigate, replace, reset, state.history, state.params, state.screen],
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
