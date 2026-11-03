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
      xmlns="http://www.w3.org/2000/svg"
      version="1.0"
      viewBox="0 0 192 192"
      width="192"
      height="192"
      id="Star of life"
      className={className}
      aria-label={title}
    >
      <defs id="defs2886" />
      <g id="cross">
        <path
          d="m 74,133 0,52 44,0 0,-52 44,26 22,-38 L 140,96 184,70 162,32 117,58 117,7 74,7 74,58 30,32 8,70 52,96 8,121 30,159 z"
          id="outline"
          style={{ fill: 'none', stroke: '#3333bb', strokeWidth: 6 }}
        />
        <path
          d="m 74,133 0,52 44,0 0,-52 44,26 22,-38 L 140,96 184,70 162,32 117,58 117,7 74,7 74,58 30,32 8,70 52,96 8,121 30,159 z"
          id="inner"
          style={{
            fill: '#0000bb',
            fillRule: 'evenodd',
            stroke: '#ffffff',
            strokeWidth: 2,
          }}
        />
      </g>
      <g
        id="symbols"
        style={{
          fill: '#ffffff',
          fillRule: 'evenodd',
          stroke: '#3333bb',
          strokeWidth: 2,
        }}
      >
        <path
          d="m 93,166 c 0,7 6,7 6,0 l 3,-138 c 0,-8 -12,-8 -12,0 l 3,135 0,3 z"
          id="rod"
        />
        <g id="snake">
          <path
            d="m 100,153 c 7,4 3,15 -3,15 2,-5 3,-9 3,-15 z m 1,-40 c 10,9 4,22 -3,26 -6,3 -6,7 -6,15 -9,-10 -4,-19 4,-24 5,-4 5,-10 5,-17 z m 1,-30 c 0,11 -17,14 -17,22 0,3 1,9 6,12 0,-11 9,-12 15,-18 7,-7 7,-19 -4,-28 0,4 0,8 0,12 z M 90,77 C 80,69 76,55 80,46 c 3,-10 20,-11 20,-3 0,8 -20,3 -13,16 l 3,5 0,13 z"
            id="body"
          />
          <path
            d="m 95,43 c 7,-3 -7,-3 0,0 z"
            id="eye"
            style={{ fill: '#3333bb', fillRule: 'evenodd', stroke: 'none' }}
          />
        </g>
      </g>
    </svg>
  );
}
