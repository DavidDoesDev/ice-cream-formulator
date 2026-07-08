// Where the ice cream actually is: the scoop fills the top portion of the
// scene box, so the chemistry layers cluster their elements around it.
// Mean/spread are fractions of the box; gauss() bell-curves via summed
// uniforms (bounded to mean ± 3sd, no long tails to clamp).
// Spreads are deliberately loose — a gentle lean toward the scoop, not a
// tight halo around it.
export const SCOOP_X = 0.5;
export const SCOOP_Y = 0.24;
export const SPREAD_X = 0.35;
export const SPREAD_Y = 0.24;

export function gauss(mean: number, sd: number) {
  return mean + (Math.random() + Math.random() + Math.random() - 1.5) * 2 * sd;
}
