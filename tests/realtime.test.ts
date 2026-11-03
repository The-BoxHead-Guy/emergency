import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const bindGlobal = vi.fn();
  const subscribe = vi.fn(() => ({ bind_global: bindGlobal }));
  const unsubscribe = vi.fn();
  const connectionBind = vi.fn();
  const disconnect = vi.fn();

  return {
    bindGlobal,
    subscribe,
    unsubscribe,
    connectionBind,
    disconnect,
  };
});

vi.mock('pusher-js', () => ({
  default: class {
    readonly connection = { bind: mocks.connectionBind };
    readonly subscribe = mocks.subscribe;
    readonly unsubscribe = mocks.unsubscribe;
    readonly disconnect = mocks.disconnect;
  },
}));

import { channelForPhone, createPusherRealtimeProvider } from '@/core/realtime';

describe('channelForPhone', () => {
  it('normalizes a leading plus and separators to digits only', () => {
    expect(channelForPhone('whatsapp.{phone}', '+57 300 123 4567')).toBe(
      'whatsapp.573001234567',
    );
    expect(channelForPhone('whatsapp.{phone}', '57-300-123-4567')).toBe(
      'whatsapp.573001234567',
    );
  });

  it('leaves a bare digits string unchanged', () => {
    expect(channelForPhone('whatsapp.{phone}', '573001234567')).toBe(
      'whatsapp.573001234567',
    );
  });

  it('supports a custom pattern', () => {
    expect(channelForPhone('user.{phone}.emergency', '+57 300 123 4567')).toBe(
      'user.573001234567.emergency',
    );
  });
});

describe('createPusherRealtimeProvider', () => {
  beforeEach(() => {
    mocks.subscribe.mockClear();
  });

  it('subscribes to the default channel pattern', () => {
    const provider = createPusherRealtimeProvider();

    provider.subscribe(
      { key: 'demo-key', cluster: 'us2' },
      ['+57 300 123 4567'],
      { onEvent: vi.fn(), onStatus: vi.fn() },
    );

    expect(mocks.subscribe).toHaveBeenCalledWith('whatsapp.573001234567');
  });

  it('subscribes to a custom channel pattern', () => {
    const provider = createPusherRealtimeProvider();

    provider.subscribe(
      {
        key: 'demo-key',
        cluster: 'us2',
        channelPattern: 'emergency.{phone}',
      },
      ['573001234567'],
      { onEvent: vi.fn(), onStatus: vi.fn() },
    );

    expect(mocks.subscribe).toHaveBeenCalledWith('emergency.573001234567');
  });
});
