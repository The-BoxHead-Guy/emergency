import type { ReactNode } from 'react';

export type IconName =
  | 'close'
  | 'alert-triangle'
  | 'check-circle'
  | 'check-circle-filled'
  | 'x-circle'
  | 'x-circle-filled'
  | 'exclamation-circle'
  | 'flag'
  | 'double-check'
  | 'rotate'
  | 'list-check'
  | 'eye'
  | 'message'
  | 'clock'
  | 'info'
  | 'inbox'
  | 'arrow-left'
  | 'chevron-down'
  | 'chevron-up'
  | 'emergency'
  | 'credit-card-plus'
  | 'map-pin'
  | 'return-on-investment';

interface IconProps {
  readonly name: IconName;
  readonly className?: string;
  readonly title?: string;
  readonly size?: number | string;
}

/** Icons whose artwork does not fit the default 24x24 grid need their own canvas. */
const viewBoxes: Readonly<Partial<Record<IconName, string>>> = {
  emergency: '0 0 640 640',
  'return-on-investment': '0 0 512 512',
};

/** Icons rendered as a solid shape instead of a stroked outline. */
const filledIcons: ReadonlySet<IconName> = new Set<IconName>([
  'check-circle-filled',
  'x-circle-filled',
  'emergency',
  'return-on-investment',
]);

const paths: Readonly<Record<IconName, ReactNode>> = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  'alert-triangle': (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  'check-circle-filled': (
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM7.91 11.69 10.6 14.39 16.09 8.89 17.51 10.31 9.89 16.51 6.49 13.11Z"
    />
  ),
  'x-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  'x-circle-filled': (
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.5 7 12 10.5 15.5 7 17 8.5 13.5 12 17 15.5 15.5 17 12 13.5 8.5 17 7 15.5 10.5 12 7 8.5Z"
    />
  ),
  'exclamation-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <path d="M12 17h.01" />
    </>
  ),
  flag: (
    <>
      <path d="M5 3v18" />
      <path d="M5 4h12l-2.5 4L17 12H5" />
    </>
  ),
  'double-check': <path d="m2 13 4 4 8-9M11 16l1 1 9-10" />,
  rotate: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ),
  'list-check': (
    <>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  message: (
    <>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7h.01" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-up': <path d="m18 15-6-6-6 6" />,
  'map-pin': (
    <>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  'credit-card-plus': (
    <>
      <path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />
      <path d="M18 12h.01" />
      <path d="M19 22v-6" />
      <path d="m22 19-3-3-3 3" />
      <path d="M6 12h.01" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  emergency: (
    <>
      <path d="M272.5 96C272.5 78.3 286.8 64 304.5 64L336.5 64C354.2 64 368.5 78.3 368.5 96L368.5 236.9L490.5 166.5C505.8 157.7 525.4 162.9 534.2 178.2L550.2 205.9C559 221.2 553.8 240.8 538.5 249.6L416.5 320L538.5 390.4C553.8 399.2 559.1 418.8 550.2 434.1L534.2 461.8C525.4 477.1 505.8 482.4 490.5 473.5L368.5 403.1L368.5 544C368.5 561.7 354.2 576 336.5 576L304.5 576C286.8 576 272.5 561.7 272.5 544L272.5 403.1L150.5 473.5C135.2 482.3 115.6 477.1 106.8 461.8L90.8 434.1C82 418.8 87.2 399.2 102.5 390.4L224.5 320L102.5 249.6C87.2 240.8 82 221.2 90.8 205.9L106.8 178.2C115.6 162.9 135.2 157.7 150.5 166.5L272.5 236.9L272.5 96z" />
    </>
  ),
  'return-on-investment': (
    <g transform="translate(0 512) scale(0.1 -0.1)">
      <path d="M2365 5014 c-591 -63 -1093 -285 -1481 -656 l-92 -88 -4 136 -3 136 -33 29 c-44 40 -93 40 -133 0 l-29 -29 0 -295 0 -294 25 -25 c14 -14 39 -28 56 -32 41 -8 497 -8 538 0 80 16 109 108 52 165 l-29 29 -161 0 c-89 0 -161 4 -161 9 0 16 190 189 285 261 814 612 1916 612 2730 0 497 -374 828 -969 885 -1595 71 -770 -271 -1543 -885 -2005 -888 -667 -2108 -600 -2918 160 -468 440 -732 1088 -704 1725 4 77 10 165 13 196 6 52 5 58 -24 90 -25 28 -37 34 -72 34 -35 0 -47 -6 -70 -32 -37 -41 -45 -117 -44 -393 0 -240 17 -372 74 -596 113 -442 343 -834 682 -1159 372 -358 830 -581 1358 -662 160 -24 520 -24 680 0 459 71 857 244 1205 524 125 101 319 300 412 424 255 340 414 719 480 1149 24 160 24 520 0 680 -66 429 -225 809 -479 1148 -89 118 -264 301 -388 404 -337 283 -779 479 -1220 543 -110 16 -458 28 -545 19z" />
      <path d="M2429 4040 c-193 -18 -344 -61 -524 -149 -153 -75 -274 -161 -394 -281 -120 -120 -206 -241 -282 -395 -92 -190 -130 -328 -149 -539 -23 -264 26 -517 150 -771 320 -659 1079 -982 1785 -759 115 36 306 132 409 205 311 222 535 581 601 964 23 132 23 357 1 490 -36 210 -138 452 -263 627 -119 167 -312 335 -494 432 -265 141 -558 203 -840 176z m178 -500 c37 -22 53 -67 53 -151 0 -57 0 -57 34 -63 56 -11 172 -74 205 -112 63 -71 23 -167 -69 -167 -18 0 -48 13 -75 32 -60 43 -118 62 -192 63 -241 2 -374 -227 -227 -391 58 -65 116 -89 246 -100 160 -14 261 -61 354 -164 212 -234 99 -601 -214 -697 l-57 -18 -5 -82 c-4 -71 -8 -84 -29 -101 -38 -31 -70 -34 -110 -13 -42 22 -60 63 -60 141 l-1 51 -56 18 c-67 21 -154 76 -218 136 -41 39 -46 50 -46 87 0 34 6 49 29 72 46 46 84 40 162 -22 92 -74 138 -93 229 -93 98 0 164 28 224 95 91 101 81 231 -23 321 -51 43 -116 65 -221 73 -149 12 -259 62 -353 164 -154 165 -150 404 9 571 59 62 162 123 230 136 l34 6 0 80 c0 89 8 111 48 132 37 20 61 20 99 -4z" />
    </g>
  ),
};

export function Icon({ name, className, title, size = '1rem' }: IconProps) {
  const stroked = !filledIcons.has(name);
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      className={className}
      viewBox={viewBoxes[name] ?? '0 0 24 24'}
      width={dimension}
      height={dimension}
      fill={stroked ? 'none' : 'currentColor'}
      stroke={stroked ? 'currentColor' : 'none'}
      strokeWidth={stroked ? 2 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
