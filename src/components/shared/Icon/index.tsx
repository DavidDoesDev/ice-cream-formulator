import type { CSSProperties } from "react";

// Custom flat-geometry lab / candy glyphs for the press character moments
// (brand, marquee, balance verdicts). Functional UI icons stay on lucide-react.
export type IconName =
  | "flask"
  | "bolt"
  | "snow"
  | "diamond"
  | "plus"
  | "check"
  | "arrow"
  | "spoon"
  | "dice"
  | "close";

interface IconProps {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 24, style, className }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "flask":
      return (
        <svg {...p}>
          <path d="M9 3h6M10 3v6l-5 8.5A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-3.5L14 9V3" />
          <path d="M7.5 15h9" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...p}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "snow":
      return (
        <svg {...p}>
          <path d="M12 2v20M4 6l16 12M20 6 4 18" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...p}>
          <path d="M12 2 4 9l8 13 8-13z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <path d="M4 12.5 9 18 20 5" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...p}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "spoon":
      return (
        <svg {...p}>
          <ellipse cx="12" cy="6" rx="4" ry="5" />
          <path d="M12 11v10" />
        </svg>
      );
    case "dice":
      return (
        <svg {...p}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "close":
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    default:
      return null;
  }
}
