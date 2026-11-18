import { useState } from 'react';
import type { EmergencyScreenId } from '@/react/screens/types';

interface FeedbackOriginState {
  origin: EmergencyScreenId | null;
  forcePrimary: boolean;
  feedbackVisible: boolean;
}

function nextFeedbackOriginState(
  state: FeedbackOriginState,
  open: boolean,
  forcePrimary: boolean,
  screen: EmergencyScreenId,
  feedbackVisible: boolean,
): FeedbackOriginState {
  if (!open) {
    return { origin: null, forcePrimary, feedbackVisible: false };
  }

  const next: FeedbackOriginState = {
    origin: state.origin,
    forcePrimary,
    feedbackVisible: state.feedbackVisible,
  };

  if (forcePrimary && !state.forcePrimary && screen !== 'primary') {
    next.origin = screen;
  }

  if (feedbackVisible) {
    return { ...next, feedbackVisible: true };
  }

  if (state.feedbackVisible) {
    return { ...next, origin: null, feedbackVisible: false };
  }

  return next;
}

/**
 * Remembers the screen that was active when a forced-primary episode started,
 * so the footer can tell where the visible feedback came from. The state is
 * adjusted during render (React's derived-state pattern) to return the origin
 * synchronously, before the forced reset commits.
 */
export function useFeedbackOrigin(
  open: boolean,
  forcePrimary: boolean,
  screen: EmergencyScreenId,
  feedbackVisible: boolean,
): EmergencyScreenId | null {
  const [state, setState] = useState<FeedbackOriginState>({
    origin: null,
    forcePrimary,
    feedbackVisible: false,
  });
  const next = nextFeedbackOriginState(
    state,
    open,
    forcePrimary,
    screen,
    feedbackVisible,
  );

  if (
    next.origin !== state.origin ||
    next.forcePrimary !== state.forcePrimary ||
    next.feedbackVisible !== state.feedbackVisible
  ) {
    setState(next);
  }

  return feedbackVisible ? next.origin : null;
}
