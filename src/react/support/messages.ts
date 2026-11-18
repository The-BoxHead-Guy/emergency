import { copy } from '@/core/copy';
import type {
  AbortResult,
  EmergencyError,
  EmergencyErrorCode,
  SimulationResult,
} from '@/core/types';
import type { IconName } from '@/react/components/Icon';

export interface ResolvedMessage {
  readonly variant: 'success' | 'error';
  readonly icon: IconName;
  readonly title: string;
  readonly text: string;
}

export interface FeedbackInput {
  readonly abortResult: AbortResult | null;
  readonly simulationResult: SimulationResult | null;
  readonly geolocationError: EmergencyError | null;
  readonly activationError?: EmergencyError | null;
}

interface MessageCopy {
  readonly title: string;
  readonly text: string;
}

/** Copy shared by several codes whose message is identical. */
const sharedMessages = {
  serviceUnavailable: {
    title: copy.serviceUnavailableTitle,
    text: copy.serviceUnavailableText,
  },
  sessionInvalid: {
    title: copy.sessionInvalidTitle,
    text: copy.sessionInvalidText,
  },
  rateLimited: {
    title: copy.rateLimitedTitle,
    text: copy.rateLimitedText,
  },
  activationFailed: {
    title: copy.activationErrorTitle,
    text: copy.activationErrorText,
  },
} satisfies Record<string, MessageCopy>;

const geolocationMessages: Readonly<
  Partial<Record<EmergencyErrorCode, MessageCopy>>
> = {
  geolocation_denied: {
    title: copy.geolocationDeniedTitle,
    text: copy.geolocationDeniedText,
  },
  geolocation_timeout: {
    title: copy.geolocationTimeoutTitle,
    text: copy.geolocationTimeoutText,
  },
  geolocation_unsupported: {
    title: copy.geolocationUnsupportedTitle,
    text: copy.geolocationUnsupportedText,
  },
};

const defaultGeolocationMessage: MessageCopy = {
  title: copy.geolocationUnavailableTitle,
  text: copy.geolocationUnavailableText,
};

const activationMessages: Readonly<
  Partial<Record<EmergencyErrorCode, MessageCopy>>
> = {
  network: sharedMessages.activationFailed,
  invalid_response: sharedMessages.activationFailed,
  upstream_error: sharedMessages.activationFailed,
  emergency_error: sharedMessages.activationFailed,
  internal_error: sharedMessages.activationFailed,
  unknown: sharedMessages.activationFailed,
  cancelled: sharedMessages.activationFailed,
  destroyed: sharedMessages.activationFailed,
  insufficient_credits: {
    title: copy.activationCreditsTitle,
    text: copy.activationCreditsText,
  },
  missing_emergency_contacts: {
    title: copy.activationContactsTitle,
    text: copy.activationContactsText,
  },
  missing_medical_profile: {
    title: copy.activationProfileTitle,
    text: copy.activationProfileText,
  },
  validation_failed: {
    title: copy.activationValidationTitle,
    text: copy.activationValidationText,
  },
  unauthenticated: sharedMessages.sessionInvalid,
  rate_limited: sharedMessages.rateLimited,
  whatsapp_delivery_failed: {
    title: copy.activationWhatsappTitle,
    text: copy.activationWhatsappText,
  },
  csrf_failed: {
    title: copy.activationSessionTitle,
    text: copy.activationSessionText,
  },
  cross_origin_denied: {
    title: copy.activationSessionTitle,
    text: copy.activationSessionText,
  },
  configuration: sharedMessages.serviceUnavailable,
  not_found: {
    title: copy.activationNotFoundTitle,
    text: copy.activationNotFoundText,
  },
  method_not_allowed: {
    title: copy.activationNotFoundTitle,
    text: copy.activationNotFoundText,
  },
};

const defaultActivationMessage: MessageCopy = {
  title: copy.activationErrorTitle,
  text: copy.activationErrorRetryText,
};

const emergencyErrorMessages: Readonly<
  Partial<Record<EmergencyErrorCode, MessageCopy>>
> = {
  invalid_code: {
    title: copy.errorInvalidCodeTitle,
    text: copy.errorInvalidCodeText,
  },
  inactive_code: {
    title: copy.errorInactiveCodeTitle,
    text: copy.errorInactiveCodeText,
  },
  configuration: sharedMessages.serviceUnavailable,
  not_found: sharedMessages.serviceUnavailable,
  method_not_allowed: sharedMessages.serviceUnavailable,
  unauthenticated: sharedMessages.sessionInvalid,
  csrf_failed: sharedMessages.sessionInvalid,
  cross_origin_denied: sharedMessages.sessionInvalid,
  network: { title: copy.errorNetworkTitle, text: copy.errorNetworkText },
  rate_limited: sharedMessages.rateLimited,
};

const defaultEmergencyErrorMessage: MessageCopy = {
  title: copy.errorGenericTitle,
  text: copy.errorGenericText,
};

function successMessage(title: string, text: string): ResolvedMessage {
  return { variant: 'success', icon: 'check-circle', title, text };
}

function errorMessage(copyValue: MessageCopy, icon: IconName): ResolvedMessage {
  return {
    variant: 'error',
    icon,
    title: copyValue.title,
    text: copyValue.text,
  };
}

function isGeolocationCode(code: EmergencyErrorCode): boolean {
  return code.startsWith('geolocation_');
}

function resolveSimulationMessage(
  simulationResult: SimulationResult,
): ResolvedMessage {
  if (simulationResult.ok) {
    return simulationResult.partial
      ? successMessage(copy.simulatePartialTitle, copy.simulatePartialText)
      : successMessage(copy.simulateSuccessTitle, copy.simulateSuccessText);
  }

  return simulationResult.code === 'insufficient_credits'
    ? errorMessage(
        {
          title: copy.simulateCreditsTitle,
          text: copy.simulateCreditsText,
        },
        'alert-triangle',
      )
    : errorMessage(
        {
          title: copy.simulateErrorTitle,
          text: copy.simulateErrorText,
        },
        'alert-triangle',
      );
}

function resolveResult(
  abortResult: AbortResult | null,
  simulationResult: SimulationResult | null,
): ResolvedMessage | null {
  if (abortResult) {
    return abortResult.ok
      ? successMessage(copy.abortSuccessTitle, copy.abortSuccessText)
      : errorMessage(
          {
            title: copy.abortErrorTitle,
            text: copy.abortErrorText,
          },
          'alert-triangle',
        );
  }

  return simulationResult ? resolveSimulationMessage(simulationResult) : null;
}

function resolveActivationMessage(error: EmergencyError): MessageCopy {
  if (error.message.trim() === '') {
    return defaultActivationMessage;
  }

  return activationMessages[error.code] ?? defaultActivationMessage;
}

/**
 * Resolves the contextual feedback surface copy from its most recent source.
 * The raw upstream message is never shown.
 */
export function resolveFeedbackMessage(
  input: FeedbackInput,
): ResolvedMessage | null {
  const resolvedResult = resolveResult(
    input.abortResult,
    input.simulationResult,
  );

  if (resolvedResult) {
    return resolvedResult;
  }

  if (input.activationError) {
    return errorMessage(
      resolveActivationMessage(input.activationError),
      'alert-triangle',
    );
  }

  if (input.geolocationError) {
    return errorMessage(
      geolocationMessages[input.geolocationError.code] ??
        defaultGeolocationMessage,
      'alert-triangle',
    );
  }

  return null;
}

/**
 * Resolves the standalone error surface copy. Geolocation codes intentionally
 * collapse to the shared fallback on this surface. The raw upstream message is
 * never shown.
 */
export function resolveEmergencyErrorMessage(
  error: EmergencyError,
): ResolvedMessage {
  const message = isGeolocationCode(error.code)
    ? defaultGeolocationMessage
    : (emergencyErrorMessages[error.code] ?? defaultEmergencyErrorMessage);

  return errorMessage(message, 'exclamation-circle');
}
