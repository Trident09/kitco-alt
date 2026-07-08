import type { ReactNode } from "react";

export interface StashCover {
  id: string;
  label: string;
  svg: ReactNode;
}

// All illustrations use a 120×80 viewBox, currentColor for strokes/fills so
// they can be tinted by the parent. The palette stays within the site's
// dark/violet aesthetic: semi-transparent violet strokes + subtle fills.

export const STASH_COVERS: StashCover[] = [
  {
    id: "grid",
    label: "Grid",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Dot grid */}
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={10 + col * 13}
              cy={10 + row * 13}
              r="1.5"
              fill="currentColor"
              opacity={0.25 + (row + col) * 0.04}
            />
          ))
        )}
        {/* Accent square */}
        <rect x="36" y="24" width="48" height="32" rx="4" fill="currentColor" opacity="0.08" />
        <rect x="36" y="24" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        {/* Inner lines */}
        <line x1="60" y1="24" x2="60" y2="56" stroke="currentColor" strokeWidth="1" opacity="0.25" />
        <line x1="36" y1="40" x2="84" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      </svg>
    ),
  },
  {
    id: "orbit",
    label: "Orbit",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Rings */}
        <ellipse cx="60" cy="40" rx="44" ry="26" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />
        <ellipse cx="60" cy="40" rx="30" ry="18" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
        <ellipse cx="60" cy="40" rx="15" ry="9" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        {/* Core */}
        <circle cx="60" cy="40" r="4" fill="currentColor" opacity="0.7" />
        {/* Orbiting dots */}
        <circle cx="16" cy="40" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="75" cy="22" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="94" cy="50" r="1.5" fill="currentColor" opacity="0.3" />
        {/* Diagonal slash through rings */}
        <line x1="25" y1="20" x2="95" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.12" strokeDasharray="4 3" />
      </svg>
    ),
  },
  {
    id: "wave",
    label: "Wave",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M0 55 Q15 40 30 55 Q45 70 60 55 Q75 40 90 55 Q105 70 120 55" stroke="currentColor" strokeWidth="1.5" opacity="0.5" fill="none" />
        <path d="M0 45 Q15 30 30 45 Q45 60 60 45 Q75 30 90 45 Q105 60 120 45" stroke="currentColor" strokeWidth="1.5" opacity="0.35" fill="none" />
        <path d="M0 35 Q15 20 30 35 Q45 50 60 35 Q75 20 90 35 Q105 50 120 35" stroke="currentColor" strokeWidth="1.5" opacity="0.2" fill="none" />
        {/* Filled wave area at bottom */}
        <path d="M0 65 Q15 50 30 65 Q45 80 60 65 Q75 50 90 65 Q105 80 120 65 L120 80 L0 80 Z" fill="currentColor" opacity="0.06" />
      </svg>
    ),
  },
  {
    id: "prism",
    label: "Prism",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Main triangle */}
        <polygon points="60,8 100,72 20,72" fill="currentColor" opacity="0.07" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
        {/* Inner triangle */}
        <polygon points="60,22 88,65 32,65" fill="currentColor" opacity="0.07" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
        {/* Refracted lines */}
        <line x1="60" y1="8" x2="60" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        <line x1="60" y1="8" x2="100" y2="72" stroke="currentColor" strokeWidth="0.75" opacity="0.15" />
        <line x1="60" y1="8" x2="20" y2="72" stroke="currentColor" strokeWidth="0.75" opacity="0.15" />
        {/* Apex glow dot */}
        <circle cx="60" cy="8" r="3" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "scatter",
    label: "Scatter",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Scattered geometric shapes */}
        <rect x="12" y="15" width="14" height="14" rx="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" transform="rotate(12 19 22)" />
        <rect x="78" y="42" width="18" height="18" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" transform="rotate(-8 87 51)" />
        <circle cx="55" cy="20" r="8" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.45" />
        <circle cx="28" cy="55" r="5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
        <polygon points="90,12 98,28 82,28" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx="70" cy="65" r="3.5" fill="currentColor" opacity="0.3" />
        <rect x="44" y="52" width="10" height="10" rx="1.5" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" transform="rotate(20 49 57)" />
        {/* Connecting dotted lines */}
        <line x1="19" y1="22" x2="55" y2="20" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.2" />
        <line x1="55" y1="20" x2="87" y2="51" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "circuit",
    label: "Circuit",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Circuit board traces */}
        <path d="M10 40 H30 V20 H60 V40 H90 V60 H110" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 20 V10 H50" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
        <path d="M60 40 V60 H80" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
        <path d="M10 60 H25 V50 H45 V70 H70" stroke="currentColor" strokeWidth="1" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Nodes */}
        <circle cx="30" cy="40" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="60" cy="40" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="90" cy="60" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="30" cy="20" r="2.5" fill="currentColor" opacity="0.45" />
        <circle cx="60" cy="60" r="2.5" fill="currentColor" opacity="0.45" />
        {/* IC chip */}
        <rect x="42" y="30" width="20" height="20" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      </svg>
    ),
  },
  {
    id: "hexfield",
    label: "Hexfield",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Hexagons in a grid pattern */}
        {[
          [30, 24], [60, 24], [90, 24],
          [15, 48], [45, 48], [75, 48], [105, 48],
          [30, 72], [60, 72],
        ].map(([cx, cy], i) => {
          const r = 14;
          const pts = Array.from({ length: 6 }, (_, k) => {
            const angle = (Math.PI / 180) * (60 * k - 30);
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(" ");
          return (
            <polygon
              key={i}
              points={pts}
              fill="currentColor"
              opacity={i === 4 ? 0.15 : 0.06}
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity={i === 4 ? 0.5 : 0.25}
            />
          );
        })}
        {/* Center dot */}
        <circle cx="45" cy="48" r="3" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "crosshatch",
    label: "Crosshatch",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Diagonal lines */}
        {[-40, -20, 0, 20, 40, 60, 80, 100, 120, 140].map((x, i) => (
          <line key={`a${i}`} x1={x} y1="0" x2={x + 80} y2="80" stroke="currentColor" strokeWidth="0.75" opacity="0.12" />
        ))}
        {[-40, -20, 0, 20, 40, 60, 80, 100, 120, 140].map((x, i) => (
          <line key={`b${i}`} x1={x + 80} y1="0" x2={x} y2="80" stroke="currentColor" strokeWidth="0.75" opacity="0.12" />
        ))}
        {/* Centered diamond highlight */}
        <rect x="45" y="25" width="30" height="30" rx="2" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(45 60 40)" />
        <circle cx="60" cy="40" r="4" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "constellation",
    label: "Constellation",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Stars */}
        {[
          [20, 15, 2.5], [50, 10, 1.5], [80, 20, 2], [100, 12, 1.5],
          [35, 40, 3], [65, 35, 2], [90, 45, 1.5],
          [15, 60, 1.5], [45, 65, 2.5], [70, 60, 1.5], [100, 65, 2],
          [55, 50, 3.5],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" opacity={0.3 + (i % 3) * 0.15} />
        ))}
        {/* Constellation lines */}
        <line x1="20" y1="15" x2="50" y2="10" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
        <line x1="50" y1="10" x2="80" y2="20" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
        <line x1="80" y1="20" x2="100" y2="12" stroke="currentColor" strokeWidth="0.75" opacity="0.15" />
        <line x1="35" y1="40" x2="55" y2="50" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />
        <line x1="55" y1="50" x2="65" y2="35" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
        <line x1="55" y1="50" x2="45" y2="65" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
        <line x1="45" y1="65" x2="70" y2="60" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
        <line x1="70" y1="60" x2="100" y2="65" stroke="currentColor" strokeWidth="0.75" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "stack",
    label: "Stack",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Layered cards */}
        <rect x="20" y="30" width="80" height="44" rx="6" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.2" />
        <rect x="15" y="22" width="80" height="44" rx="6" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.28" />
        <rect x="10" y="14" width="80" height="44" rx="6" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.45" />
        {/* Content lines on top card */}
        <line x1="20" y1="28" x2="60" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
        <line x1="20" y1="36" x2="50" y2="36" stroke="currentColor" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
        <line x1="20" y1="42" x2="55" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
        {/* Dot accent */}
        <circle cx="76" cy="28" r="4" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: "spiral",
    label: "Spiral",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Fibonacci-ish spiral */}
        <path
          d="M60 40 C60 34 54 28 48 28 C36 28 24 40 24 52 C24 68 40 76 60 76 C86 76 96 56 96 40 C96 16 76 8 60 8"
          stroke="currentColor" strokeWidth="1.5" opacity="0.45" fill="none" strokeLinecap="round"
        />
        <path
          d="M60 40 C60 37 58 34 55 34 C50 34 46 38 46 43 C46 50 52 54 60 54 C70 54 74 46 74 40 C74 30 66 26 60 26"
          stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" strokeLinecap="round"
        />
        <circle cx="60" cy="40" r="3" fill="currentColor" opacity="0.65" />
        {/* Guide squares */}
        <rect x="46" y="28" width="14" height="12" stroke="currentColor" strokeWidth="0.75" opacity="0.12" fill="none" />
        <rect x="24" y="28" width="22" height="24" stroke="currentColor" strokeWidth="0.75" opacity="0.1" fill="none" />
      </svg>
    ),
  },
  {
    id: "terrain",
    label: "Terrain",
    svg: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Layered mountain ridges */}
        <path d="M0 80 L20 50 L35 62 L55 30 L75 55 L90 38 L110 55 L120 45 L120 80 Z" fill="currentColor" opacity="0.06" />
        <path d="M0 80 L15 58 L30 68 L50 42 L70 62 L85 48 L105 62 L120 52 L120 80 Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
        <path d="M0 80 L10 65 L25 72 L45 55 L65 68 L80 58 L100 68 L120 60 L120 80 Z" fill="currentColor" opacity="0.14" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
        {/* Stars */}
        <circle cx="30" cy="18" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="70" cy="12" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="95" cy="22" r="1.5" fill="currentColor" opacity="0.35" />
        <circle cx="50" cy="8" r="1" fill="currentColor" opacity="0.25" />
      </svg>
    ),
  },
];

export const DEFAULT_COVER = "grid";

export function getCoverById(id: string): StashCover {
  return STASH_COVERS.find((c) => c.id === id) ?? STASH_COVERS[0];
}
