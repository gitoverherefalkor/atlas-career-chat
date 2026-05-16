import React from 'react';

// A cairn that builds one stone per completed survey section. Gold stones to
// match the section-complete checkmarks; a small hexagon crown appears once
// all seven are placed. The newest stone drops in to mark the moment.

// Base rock — a flattish slab with defined ends, centred at the origin (~150 x 36).
const ROCK =
  'M -73,-1 C -74,-10 -68,-16 -57,-15 L -30,-16 C -6,-17 22,-16 45,-15 ' +
  'L 60,-14 C 71,-13 76,-6 74,2 C 75,10 68,16 57,16 L 22,17 ' +
  'C -2,18 -32,17 -53,15 L -63,14 C -72,13 -72,7 -73,-1 Z';

// Per-stone placement, bottom (index 0) to top (index 6):
// [scale, centreY, xOffset, rotationDeg, flipX]
const STONES: ReadonlyArray<[number, number, number, number, number]> = [
  [1.0, 298, 0, -2, 1],
  [0.92, 266, -8, 3, -1],
  [0.85, 235, 7, -3, 1],
  [0.75, 206, -5, 2, -1],
  [0.65, 178, 8, -4, 1],
  [0.54, 152, -4, 3, -1],
  [0.44, 128, 3, -2, 1],
];

const CX = 120;
const GOLD = '#D4A024';
const GOLD_ALT = '#C8951E';
const GOLD_EDGE = '#A87C16';

interface CairnProgressProps {
  /** How many stones to show (0-7). */
  stones: number;
  /** When true, the topmost shown stone drops in and the crown pops. */
  animateNewest?: boolean;
  className?: string;
}

const CairnProgress = ({ stones, animateNewest = true, className }: CairnProgressProps) => {
  const count = Math.max(0, Math.min(STONES.length, Math.round(stones)));

  return (
    <svg
      viewBox="0 0 240 340"
      className={className}
      role="img"
      aria-label={`Cairn progress: ${count} of ${STONES.length} stones placed`}
    >
      {STONES.slice(0, count).map(([s, cy, dx, rot, flip], i) => {
        const isNewest = animateNewest && i === count - 1;
        return (
          <g
            key={i}
            transform={`translate(${CX + dx},${cy}) rotate(${rot}) scale(${s * flip},${s})`}
          >
            <g className={isNewest ? 'cairn-stone-drop' : undefined}>
              <path
                d={ROCK}
                fill={i % 2 === 0 ? GOLD : GOLD_ALT}
                stroke={GOLD_EDGE}
                strokeWidth={2.5}
              />
            </g>
          </g>
        );
      })}

      {count >= STONES.length && (
        <path
          className={animateNewest ? 'cairn-crown-pop' : undefined}
          d="M120,84 l16,9 v18 l-16,9 l-16,-9 v-18 Z"
          fill="none"
          stroke={GOLD}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

export default CairnProgress;
