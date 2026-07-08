// Chemistry-layer tint ramp: the theme ink fading into the background paper.
// t=0 is the ink itself, t=1 is the paper, everything between an ink/paper mix.
// Built with color-mix so it tracks the live --ink and --paper — in dark mode
// the two swap (ink goes light, paper goes dark) and the ramp still spans the
// full contrast. The FX panel exposes both the named stops and a slider.
export const PRESETS: { label: string; t: number }[] = [
  { label: "25% bg", t: 0.25 },
  { label: "50% bg", t: 0.5 },
  { label: "75% bg", t: 0.75 },
  { label: "bg", t: 1 },
];

export function ramp(t: number): string {
  const inkPct = Math.round((1 - Math.min(1, Math.max(0, t))) * 100);
  return `color-mix(in srgb, var(--ink) ${inkPct}%, var(--paper))`;
}
