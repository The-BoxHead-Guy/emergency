import type {
  EmergencyFontFamilyFlags,
  EmergencyFontLoading,
} from '@/core/types';

export type EmergencyFontFamily = 'googleSans' | 'montserrat' | 'poppins';

export interface ResolvedEmergencyFontLoading {
  readonly load: boolean;
  readonly fonts: Required<EmergencyFontFamilyFlags>;
}

/**
 * The exact Google Fonts query segment for each family. Family order matters:
 * with every family enabled the generated href is the documented stylesheet
 * URL, byte for byte.
 */
const FONT_FAMILY_PARAMS: Record<EmergencyFontFamily, string> = {
  googleSans:
    'family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700',
  montserrat: 'family=Montserrat:ital,wght@0,100..900;1,100..900',
  poppins:
    'family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900',
};

const FONT_FAMILY_ORDER: readonly EmergencyFontFamily[] = [
  'googleSans',
  'montserrat',
  'poppins',
];

const FONT_STYLESHEET_BASE = 'https://fonts.googleapis.com/css2';
const FONT_ORIGIN = 'https://fonts.googleapis.com';
const FONT_STATIC_ORIGIN = 'https://fonts.gstatic.com';

/** Marks every link the client injects so repeated mounts stay idempotent. */
export const FONT_LINK_ATTRIBUTE = 'data-de-emergency-fonts';

export function normalizeFontLoading(
  input?: EmergencyFontLoading,
): ResolvedEmergencyFontLoading {
  const flags = input?.fonts ?? {};

  return {
    load: input?.load ?? true,
    fonts: {
      googleSans: flags.googleSans ?? true,
      montserrat: flags.montserrat ?? true,
      poppins: flags.poppins ?? true,
    },
  };
}

/**
 * Builds the stylesheet URL for the enabled families, or `null` when the
 * master switch is off or no family is enabled. A disabled family is left out
 * of the request entirely.
 */
export function buildFontStylesheetHref(
  input?: EmergencyFontLoading,
): string | null {
  const { load, fonts } = normalizeFontLoading(input);

  if (!load) {
    return null;
  }

  const params = FONT_FAMILY_ORDER.filter((family) => fonts[family]).map(
    (family) => FONT_FAMILY_PARAMS[family],
  );

  if (params.length === 0) {
    return null;
  }

  return `${FONT_STYLESHEET_BASE}?${params.join('&')}&display=swap`;
}

function createFontLink(
  rel: string,
  href: string,
  crossorigin = false,
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;

  if (crossorigin) {
    link.crossOrigin = 'anonymous';
  }

  link.setAttribute(FONT_LINK_ATTRIBUTE, '');

  return link;
}

/**
 * Injects the preconnect and stylesheet links the panel needs, once per page.
 * The first successful mount wins: later mounts, including mounts from a
 * duplicated copy of the library, reuse the links already present. The links
 * are page-level assets and are intentionally not removed on `destroy()`.
 */
export function installEmergencyFonts(input?: EmergencyFontLoading): void {
  if (typeof document === 'undefined') {
    return;
  }

  const href = buildFontStylesheetHref(input);

  if (href === null) {
    return;
  }

  if (document.querySelector(`link[${FONT_LINK_ATTRIBUTE}]`)) {
    return;
  }

  const head = document.head ?? document.documentElement;

  head.append(
    createFontLink('preconnect', FONT_ORIGIN),
    createFontLink('preconnect', FONT_STATIC_ORIGIN, true),
    createFontLink('stylesheet', href),
  );
}
