import styles from "./StretchTitle.module.scss";

// "COLD HARD" over "SCIENCE", each stretched to the full container width via SVG
// textLength — so the two lines are exactly equal width at any screen size
// (SCIENCE tracks out to match COLD HARD). Used by the mobile home variants.
export function StretchTitle({ className }: { className?: string }) {
  return (
    <svg
      className={[styles.svg, className].filter(Boolean).join(" ")}
      viewBox="0 0 100 33"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Cold Hard Science"
    >
      <text className={styles.l1} x="0" y="14.5" textLength="100" lengthAdjust="spacingAndGlyphs">
        COLD HARD
      </text>
      <text className={styles.l2} x="0" y="32" textLength="100" lengthAdjust="spacingAndGlyphs">
        SCIENCE
      </text>
    </svg>
  );
}
