import Pusher from 'pusher-js';
import type { RealtimePublicConfig } from '@/core/bff-types';
import type { RealtimeStatus } from '@/core/types';

export interface RealtimeHandlers {
  readonly onEvent: (channel: string, event: string, data: unknown) => void;
  readonly onStatus: (status: RealtimeStatus) => void;
}

export interface RealtimeSubscription {
  disconnect(): void;
}

export interface RealtimeProvider {
  /**
   * Subscribes to the public channels for the given responder phone numbers.
   * Returns `null` when the realtime configuration is unusable, in which case
   * the client keeps working in pull mode.
   */
  subscribe(
    config: RealtimePublicConfig,
    phones: readonly string[],
    handlers: RealtimeHandlers,
  ): RealtimeSubscription | null;
}

export function channelForPhone(pattern: string, phone: string): string {
  return pattern.replace('{phone}', phone.replace(/^\+/, ''));
}

type PusherConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected';

function toStatus(state: PusherConnectionState): RealtimeStatus {
  switch (state) {
    case 'connected':
      return 'connected';
    case 'connecting':
    case 'initialized':
      return 'connecting';
    case 'unavailable':
    case 'failed':
      return 'unavailable';
    case 'disconnected':
      return 'disconnected';
    default:
      return 'idle';
  }
}

export function createPusherRealtimeProvider(): RealtimeProvider {
  return {
    subscribe(config, phones, handlers) {
      if (
        typeof window === 'undefined' ||
        !config.pusher.key ||
        !config.pusher.cluster
      ) {
        return null;
      }

      let pusher: Pusher;

      try {
        pusher = new Pusher(config.pusher.key, {
          cluster: config.pusher.cluster,
          forceTLS: true,
        });
      } catch {
        handlers.onStatus('unavailable');

        return null;
      }

      handlers.onStatus('connecting');

      pusher.connection.bind(
        'state_change',
        (change: { current: PusherConnectionState }) => {
          handlers.onStatus(toStatus(change.current));
        },
      );

      const channels = [...new Set(phones.filter((phone) => phone !== ''))].map(
        (phone) => {
          const channelName = channelForPhone(
            config.pusher.channel_pattern,
            phone,
          );
          const channel = pusher.subscribe(channelName);

          channel.bind_global((eventName: string, data: unknown) => {
            handlers.onEvent(channelName, eventName, data);
          });

          return channelName;
        },
      );

      return {
        disconnect() {
          for (const channelName of channels) {
            pusher.unsubscribe(channelName);
          }

          pusher.disconnect();
        },
      };
    },
  };
}
