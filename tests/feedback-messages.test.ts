import { describe, expect, it } from 'vitest';
import { copy } from '@/core/copy';
import { createEmergencyError } from '@/core/errors';
import type { EmergencyErrorCode } from '@/core/types';
import {
  resolveEmergencyErrorMessage,
  resolveFeedbackMessage,
} from '@/react/support/messages';

function activation(code: EmergencyErrorCode, message = 'Raw BFF message') {
  return resolveFeedbackMessage({
    abortResult: null,
    simulationResult: null,
    geolocationError: null,
    activationError: createEmergencyError(code, message),
  });
}

function geolocation(code: EmergencyErrorCode, message = '') {
  return resolveFeedbackMessage({
    abortResult: null,
    simulationResult: null,
    geolocationError: createEmergencyError(code, message),
    activationError: null,
  });
}

describe('resolveFeedbackMessage', () => {
  it('returns null when no feedback source is present', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: null,
        simulationResult: null,
        geolocationError: null,
        activationError: null,
      }),
    ).toBeNull();
  });

  it('resolves a successful abort', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: { ok: true, message: copy.abortResultOk, at: 1 },
        simulationResult: null,
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'success',
      icon: 'check-circle',
      title: copy.abortSuccessTitle,
      text: copy.abortSuccessText,
    });
  });

  it('resolves a failed abort', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: { ok: false, message: copy.abortResultFail, at: 1 },
        simulationResult: null,
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title: copy.abortErrorTitle,
      text: copy.abortErrorText,
    });
  });

  it('resolves an abort that failed because of insufficient credits', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: {
          ok: false,
          message: copy.abortCreditsText,
          at: 1,
          code: 'insufficient_credits',
        },
        simulationResult: null,
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title: copy.abortCreditsTitle,
      text: copy.abortCreditsText,
    });
  });

  it('resolves a partial abort without claiming every contact was notified', () => {
    const resolved = resolveFeedbackMessage({
      abortResult: {
        ok: true,
        message: copy.abortResultPartial,
        at: 1,
        partial: true,
      },
      simulationResult: null,
      geolocationError: null,
      activationError: null,
    });

    expect(resolved).toEqual({
      variant: 'warning',
      icon: 'alert-triangle',
      title: copy.abortPartialTitle,
      text: copy.abortPartialText,
    });
    expect(resolved?.text).not.toBe(copy.abortSuccessText);
  });

  it('resolves an already-completed abort', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: {
          ok: true,
          message: copy.abortAlreadyDone,
          at: 1,
          code: 'emergency_not_found',
        },
        simulationResult: null,
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'success',
      icon: 'check-circle',
      title: copy.abortAlreadyTitle,
      text: copy.abortAlreadyText,
    });
  });

  it('resolves a successful simulation', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: null,
        simulationResult: {
          ok: true,
          message: copy.simulateResultOk,
          at: 1,
        },
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'success',
      icon: 'check-circle',
      title: copy.simulateSuccessTitle,
      text: copy.simulateSuccessText,
    });
  });

  it('resolves a partially successful simulation', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: null,
        simulationResult: {
          ok: true,
          message: copy.partialFailure,
          at: 1,
          partial: true,
        },
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'success',
      icon: 'check-circle',
      title: copy.simulatePartialTitle,
      text: copy.simulatePartialText,
    });
  });

  it('resolves a failed simulation', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: null,
        simulationResult: {
          ok: false,
          message: copy.simulateResultFail,
          at: 1,
          code: 'upstream_error',
        },
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title: copy.simulateErrorTitle,
      text: copy.simulateErrorText,
    });
  });

  it('resolves a simulation without credits', () => {
    expect(
      resolveFeedbackMessage({
        abortResult: null,
        simulationResult: {
          ok: false,
          message: copy.insufficientCredits,
          at: 1,
          code: 'insufficient_credits',
        },
        geolocationError: null,
        activationError: null,
      }),
    ).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title: copy.simulateCreditsTitle,
      text: copy.simulateCreditsText,
    });
  });

  it.each([
    [
      'geolocation_denied',
      copy.geolocationDeniedTitle,
      copy.geolocationDeniedText,
    ],
    [
      'geolocation_timeout',
      copy.geolocationTimeoutTitle,
      copy.geolocationTimeoutText,
    ],
    [
      'geolocation_unsupported',
      copy.geolocationUnsupportedTitle,
      copy.geolocationUnsupportedText,
    ],
    [
      'geolocation_unavailable',
      copy.geolocationUnavailableTitle,
      copy.geolocationUnavailableText,
    ],
  ] as const)('resolves the %s geolocation error', (code, title, text) => {
    expect(geolocation(code)).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title,
      text,
    });
  });

  it.each([
    ['network', copy.activationErrorTitle, copy.activationErrorText],
    ['invalid_response', copy.activationErrorTitle, copy.activationErrorText],
    ['upstream_error', copy.activationErrorTitle, copy.activationErrorText],
    ['emergency_error', copy.activationErrorTitle, copy.activationErrorText],
    ['internal_error', copy.activationErrorTitle, copy.activationErrorText],
    ['unknown', copy.activationErrorTitle, copy.activationErrorText],
    ['cancelled', copy.activationErrorTitle, copy.activationErrorText],
    ['destroyed', copy.activationErrorTitle, copy.activationErrorText],
    [
      'insufficient_credits',
      copy.activationCreditsTitle,
      copy.activationCreditsText,
    ],
    [
      'missing_emergency_contacts',
      copy.activationContactsTitle,
      copy.activationContactsText,
    ],
    [
      'missing_medical_profile',
      copy.activationProfileTitle,
      copy.activationProfileText,
    ],
    [
      'validation_failed',
      copy.activationValidationTitle,
      copy.activationValidationText,
    ],
    ['unauthenticated', copy.sessionInvalidTitle, copy.sessionInvalidText],
    ['rate_limited', copy.rateLimitedTitle, copy.rateLimitedText],
    [
      'whatsapp_delivery_failed',
      copy.activationWhatsappTitle,
      copy.activationWhatsappText,
    ],
    ['csrf_failed', copy.activationSessionTitle, copy.activationSessionText],
    [
      'cross_origin_denied',
      copy.activationSessionTitle,
      copy.activationSessionText,
    ],
    [
      'configuration',
      copy.serviceUnavailableTitle,
      copy.serviceUnavailableText,
    ],
    ['not_found', copy.activationNotFoundTitle, copy.activationNotFoundText],
    [
      'method_not_allowed',
      copy.activationNotFoundTitle,
      copy.activationNotFoundText,
    ],
  ] as const)('resolves the %s activation error', (code, title, text) => {
    expect(activation(code)).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title,
      text,
    });
  });

  it('falls back to the retry copy for an unmapped activation code', () => {
    expect(activation('invalid_transition', 'raw upstream message')).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title: copy.activationErrorTitle,
      text: copy.activationErrorRetryText,
    });
  });

  it('ignores the raw message of an activation error', () => {
    expect(activation('upstream_error', 'BFF exploded')).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title: copy.activationErrorTitle,
      text: copy.activationErrorText,
    });
  });

  it('uses the retry copy when a mapped activation error has an empty message', () => {
    expect(activation('whatsapp_delivery_failed', '')).toEqual({
      variant: 'error',
      icon: 'alert-triangle',
      title: copy.activationErrorTitle,
      text: copy.activationErrorRetryText,
    });
  });
});

describe('resolveEmergencyErrorMessage', () => {
  function resolve(code: EmergencyErrorCode, message = 'Raw BFF message') {
    return resolveEmergencyErrorMessage(createEmergencyError(code, message));
  }

  it.each([
    ['invalid_code', copy.errorInvalidCodeTitle, copy.errorInvalidCodeText],
    ['inactive_code', copy.errorInactiveCodeTitle, copy.errorInactiveCodeText],
    [
      'configuration',
      copy.serviceUnavailableTitle,
      copy.serviceUnavailableText,
    ],
    ['network', copy.errorNetworkTitle, copy.errorNetworkText],
  ] as const)('resolves the %s copy', (code, title, text) => {
    expect(resolve(code)).toEqual({
      variant: 'error',
      icon: 'exclamation-circle',
      title,
      text,
    });
  });

  it.each([
    ['not_found', copy.serviceUnavailableTitle, copy.serviceUnavailableText],
    [
      'method_not_allowed',
      copy.serviceUnavailableTitle,
      copy.serviceUnavailableText,
    ],
    ['unauthenticated', copy.sessionInvalidTitle, copy.sessionInvalidText],
    ['csrf_failed', copy.sessionInvalidTitle, copy.sessionInvalidText],
    ['cross_origin_denied', copy.sessionInvalidTitle, copy.sessionInvalidText],
    ['rate_limited', copy.rateLimitedTitle, copy.rateLimitedText],
    [
      'geolocation_denied',
      copy.geolocationUnavailableTitle,
      copy.geolocationUnavailableText,
    ],
    [
      'geolocation_timeout',
      copy.geolocationUnavailableTitle,
      copy.geolocationUnavailableText,
    ],
  ] as const)('shares the %s copy', (code, title, text) => {
    expect(resolve(code)).toEqual({
      variant: 'error',
      icon: 'exclamation-circle',
      title,
      text,
    });
  });

  it.each(['unknown', 'emergency_already_active'] as const)(
    'falls back for the unmapped %s code',
    (code) => {
      expect(resolve(code)).toEqual({
        variant: 'error',
        icon: 'exclamation-circle',
        title: copy.errorGenericTitle,
        text: copy.errorGenericText,
      });
    },
  );

  it('never exposes the raw upstream message', () => {
    const resolved = resolve('invalid_code', 'The code is invalid.');

    expect(resolved.text).not.toContain('The code is invalid.');
    expect(resolved.title).not.toContain('The code is invalid.');
  });
});
