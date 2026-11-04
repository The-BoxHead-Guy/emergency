import { describe, expect, it } from 'vitest';
import { validateBaseUrl, validateConfig } from '@/core/config';
import type { EmergencyConfig } from '@/core/types';

const base: EmergencyConfig = {
  bffBaseUrl: 'https://example.com/de-bff/emergency',
  code: 'DABC12',
};

describe('validateBaseUrl', () => {
  it('accepts https URLs and same-origin paths', () => {
    expect(validateBaseUrl('https://example.com/de-bff/emergency')).toBeNull();
    expect(validateBaseUrl('/de-bff/emergency')).toBeNull();
    expect(
      validateBaseUrl('http://localhost:8787/de-bff/emergency'),
    ).toBeNull();
    expect(validateBaseUrl('http://app.localhost:8787')).toBeNull();
  });

  it('rejects plaintext, protocol-relative and embedded credentials', () => {
    expect(validateBaseUrl('http://example.com/de-bff')).toContain('https:');
    expect(validateBaseUrl('//example.com/de-bff')).toContain(
      'protocol-relative',
    );
    expect(validateBaseUrl('https://user:pw@example.com')).toContain(
      'credentials',
    );
  });

  it('rejects non-http schemes and relative paths without a slash', () => {
    expect(validateBaseUrl('javascript:alert(1)')).toContain('https:');
    expect(validateBaseUrl('file:///etc/passwd')).toContain('https:');
    expect(validateBaseUrl('example.com/de-bff')).toContain('absolute URL');
  });
});

describe('validateConfig base URL', () => {
  it('returns a configuration error for an insecure base URL', () => {
    const result = validateConfig({
      ...base,
      bffBaseUrl: 'http://example.com',
    });

    expect(result.ok).toBe(false);
    expect(result.config).toBeNull();
    expect(result.error).toMatchObject({ code: 'configuration' });
  });

  it('accepts a same-origin path', () => {
    const result = validateConfig({
      ...base,
      bffBaseUrl: '/de-bff/emergency/',
    });

    expect(result.ok).toBe(true);
    expect(result.config?.bffBaseUrl).toBe('/de-bff/emergency');
  });
});

describe('validateConfig realtime', () => {
  const invalid = (realtime: unknown) =>
    validateConfig({
      ...base,
      realtime,
    });

  it('leaves realtime undefined when the option is absent', () => {
    const result = validateConfig(base);

    expect(result.ok).toBe(true);
    expect(result.config?.realtime).toBeUndefined();
  });

  it('normalizes the channel pattern default', () => {
    const result = validateConfig({
      ...base,
      realtime: { key: 'demo-key', cluster: 'us2' },
    });

    expect(result.ok).toBe(true);
    expect(result.config?.realtime).toEqual({
      key: 'demo-key',
      cluster: 'us2',
      channelPattern: 'whatsapp.{phone}',
    });
  });

  it('keeps a custom channel pattern', () => {
    const result = validateConfig({
      ...base,
      realtime: {
        key: 'demo-key',
        cluster: 'us2',
        channelPattern: 'emergency.{phone}',
      },
    });

    expect(result.ok).toBe(true);
    expect(result.config?.realtime?.channelPattern).toBe('emergency.{phone}');
  });

  it.each([
    ['a missing key', { cluster: 'us2' }],
    ['a missing cluster', { key: 'demo-key' }],
    ['an empty key', { key: '', cluster: 'us2' }],
    ['an empty cluster', { key: 'demo-key', cluster: '  ' }],
    [
      'a blank channel pattern',
      { key: 'demo-key', cluster: 'us2', channelPattern: '' },
    ],
    [
      'a pattern without the phone placeholder',
      { key: 'demo-key', cluster: 'us2', channelPattern: 'whatsapp' },
    ],
  ])('rejects %s with a configuration error', (_label, realtime) => {
    const result = invalid(realtime);

    expect(result.ok).toBe(false);
    expect(result.config).toBeNull();
    expect(result.error).toMatchObject({ code: 'configuration' });
  });
});
