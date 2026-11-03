import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FONT_LINK_ATTRIBUTE,
  buildFontStylesheetHref,
  installEmergencyFonts,
} from '@/core/fonts';

const ALL_FAMILIES_HREF =
  'https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';

function injectedLinks(): HTMLLinkElement[] {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>(`link[${FONT_LINK_ATTRIBUTE}]`),
  );
}

beforeEach(() => {
  for (const link of injectedLinks()) {
    link.remove();
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildFontStylesheetHref', () => {
  it('loads every family by default and matches the documented URL', () => {
    expect(buildFontStylesheetHref()).toBe(ALL_FAMILIES_HREF);
    expect(buildFontStylesheetHref({ load: true })).toBe(ALL_FAMILIES_HREF);
  });

  it('only requests the enabled families', () => {
    const href = buildFontStylesheetHref({
      fonts: { googleSans: false, montserrat: false },
    });

    expect(href).toContain('family=Poppins');
    expect(href).not.toContain('family=Google+Sans');
    expect(href).not.toContain('family=Montserrat');
    expect(href?.endsWith('&display=swap')).toBe(true);
  });

  it('returns null when loading is off or no family is enabled', () => {
    expect(buildFontStylesheetHref({ load: false })).toBeNull();
    expect(
      buildFontStylesheetHref({
        fonts: { googleSans: false, montserrat: false, poppins: false },
      }),
    ).toBeNull();
  });
});

describe('installEmergencyFonts', () => {
  it('injects two preconnects and the stylesheet once', () => {
    installEmergencyFonts();
    installEmergencyFonts();

    const links = injectedLinks();

    expect(links).toHaveLength(3);

    const [googleFonts, googleStatic, stylesheet] = links;

    expect(googleFonts?.rel).toBe('preconnect');
    expect(googleFonts?.href).toBe('https://fonts.googleapis.com/');
    expect(googleStatic?.rel).toBe('preconnect');
    expect(googleStatic?.href).toBe('https://fonts.gstatic.com/');
    expect(googleStatic?.crossOrigin).toBe('anonymous');
    expect(stylesheet?.rel).toBe('stylesheet');
    expect(stylesheet?.href).toBe(ALL_FAMILIES_HREF);
  });

  it('injects nothing when loading is disabled', () => {
    installEmergencyFonts({ load: false });

    expect(injectedLinks()).toHaveLength(0);
  });

  it('is a no-op without a document', () => {
    vi.stubGlobal('document', undefined);

    expect(() => installEmergencyFonts()).not.toThrow();
  });
});
