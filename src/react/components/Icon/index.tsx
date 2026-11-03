import type { ReactNode } from 'react';

export type IconName =
  | 'close'
  | 'alert-triangle'
  | 'check-circle'
  | 'x-circle'
  | 'exclamation-circle'
  | 'flag'
  | 'double-check'
  | 'rotate'
  | 'list-check'
  | 'eye'
  | 'message'
  | 'clock'
  | 'info'
  | 'arrow-left'
  | 'emergency';

interface IconProps {
  readonly name: IconName;
  readonly className?: string;
  readonly title?: string;
}

/** Icons whose artwork does not fit the default 24x24 grid need their own canvas. */
const viewBoxes: Readonly<Partial<Record<IconName, string>>> = {
  emergency: '0 0 640 640',
};

/** Icons rendered as a solid shape instead of a stroked outline. */
const filledIcons: ReadonlySet<IconName> = new Set<IconName>(['emergency']);

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
  'x-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
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
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  emergency: (
    <>
      <path d="M272.5 96C272.5 78.3 286.8 64 304.5 64L336.5 64C354.2 64 368.5 78.3 368.5 96L368.5 236.9L490.5 166.5C505.8 157.7 525.4 162.9 534.2 178.2L550.2 205.9C559 221.2 553.8 240.8 538.5 249.6L416.5 320L538.5 390.4C553.8 399.2 559.1 418.8 550.2 434.1L534.2 461.8C525.4 477.1 505.8 482.4 490.5 473.5L368.5 403.1L368.5 544C368.5 561.7 354.2 576 336.5 576L304.5 576C286.8 576 272.5 561.7 272.5 544L272.5 403.1L150.5 473.5C135.2 482.3 115.6 477.1 106.8 461.8L90.8 434.1C82 418.8 87.2 399.2 102.5 390.4L224.5 320L102.5 249.6C87.2 240.8 82 221.2 90.8 205.9L106.8 178.2C115.6 162.9 135.2 157.7 150.5 166.5L272.5 236.9L272.5 96z" />
    </>
  ),
};

export function Icon({ name, className, title }: IconProps) {
  const stroked = !filledIcons.has(name);

  return (
    <svg
      className={className}
      viewBox={viewBoxes[name] ?? '0 0 24 24'}
      width="1rem"
      height="1rem"
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
