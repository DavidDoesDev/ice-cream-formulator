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

// Scoop modelled as a hemisphere for depth. SCOOP_R is its radius as a
// fraction of box width, centred on (SCOOP_X, SCOOP_Y). domeZ maps a point to
// its height on that dome — 1 at the apex (nearest the viewer), easing to 0 at
// the rim and staying 0 past it (the cone below the scoop is flat). Layers
// scale each element's parallax travel by this z, so near-crown particles
// swing further than rim ones and the field reads as rounded. y is stretched
// by the box aspect so the dome is circular in rendered pixels, not in
// fraction space (the box is far taller than it is wide).
export const SCOOP_R = 0.5;
const ASPECT = 1280 / 720;

export function domeZ(x: number, y: number) {
  const dx = (x - SCOOP_X) / SCOOP_R;
  const dy = ((y - SCOOP_Y) * ASPECT) / SCOOP_R;
  const rho2 = dx * dx + dy * dy;
  return rho2 < 1 ? Math.sqrt(1 - rho2) : 0;
}

// Under the multiply blend the scoop can't occlude the back plane, so back
// particles behind its bright centre ghost straight through the ice cream.
// This fades a back-plane element out as it nears the centre (high dome-z),
// leaving the rim halo and the surrounding volume — all you'd see behind a
// solid ball. 0 at the apex, 1 at the rim and beyond; the exponent steepens
// the cutoff so mid-dome elements don't linger visibly over the scoop.
export function centerFade(z: number) {
  return Math.pow(Math.max(0, 1 - z), 1.5);
}
