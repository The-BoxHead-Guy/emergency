import { createEmergencyError } from '@/core/errors';
import type { EmergencyGeolocation } from '@/core/types';

export interface GeolocationProvider {
  getCurrentPosition(timeoutMs: number): Promise<EmergencyGeolocation>;
}

interface GeolocationErrorLike {
  readonly code?: number;
  readonly message?: string;
}

function mapFailure(error: GeolocationErrorLike): Error {
  const mapped = createEmergencyError(
    error.code === 1
      ? 'geolocation_denied'
      : error.code === 3
        ? 'geolocation_timeout'
        : 'geolocation_unavailable',
    error.message ?? 'The current position could not be determined.',
  );

  return Object.assign(new Error(mapped.message), { emergencyError: mapped });
}

export function createBrowserGeolocationProvider(): GeolocationProvider {
  return {
    getCurrentPosition(timeoutMs: number): Promise<EmergencyGeolocation> {
      return new Promise((resolve, reject) => {
        if (
          typeof navigator === 'undefined' ||
          typeof navigator.geolocation === 'undefined' ||
          typeof navigator.geolocation.getCurrentPosition !== 'function'
        ) {
          reject(
            Object.assign(
              new Error('Geolocation is not supported in this environment.'),
              {
                emergencyError: createEmergencyError(
                  'geolocation_unsupported',
                  'Geolocation is not supported in this environment.',
                ),
              },
            ),
          );

          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            reject(mapFailure(error));
          },
          {
            enableHighAccuracy: true,
            timeout: timeoutMs,
          },
        );
      });
    },
  };
}

export function createStaticGeolocationProvider(
  position: EmergencyGeolocation | null,
): GeolocationProvider {
  return {
    getCurrentPosition: () =>
      position
        ? Promise.resolve(position)
        : Promise.reject(
            Object.assign(new Error('Geolocation is unavailable.'), {
              emergencyError: createEmergencyError(
                'geolocation_unavailable',
                'Geolocation is unavailable.',
              ),
            }),
          ),
  };
}
