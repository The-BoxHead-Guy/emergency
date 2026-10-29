/**
 * Neutral inline illustration used by the idle panel.
 */
export function ParamedicalMark({
  className,
  title,
}: {
  readonly className?: string;
  readonly title: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="48" cy="48" r="46" fill="#ff0000" />
      <circle cx="48" cy="48" r="37" fill="#fff" />
      <path d="M42 26h12v16h16v12H54v16H42V54H26V42h16z" fill="#ff0000" />
    </svg>
  );
}
