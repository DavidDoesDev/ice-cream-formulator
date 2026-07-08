import { useEffect, useRef, type RefObject } from "react";
import styles from "./SparkleCone.module.scss";
import { SCOOP_X, SCOOP_Y, SPREAD_X, SPREAD_Y, gauss, domeZ, centerFade } from "./scatter";

type Satellite = { dist: number; ang: number; spd: number; r: number };

type Atom = {
  x: number;
  y: number;
  hx: number;
  hy: number;
  z: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  sats: Satellite[];
};

// Weak spring pulling each atom back to its home point, so the drift orbits
// the scoop instead of dispersing over the whole box.
const SPRING = 0.00008;
const DAMPING = 0.998;

// Extra per-atom parallax travel at the dome's apex, in px, on top of the
// plane's uniform drift. Each atom's slice is scaled by its dome-z, so crown
// atoms swing past rim atoms and the cloud reads as wrapped over a sphere.
const DEPTH_SHIFT = 30;

// The back plane is the far side of that sphere: its swing runs opposite the
// front (so the ball reads as rotating, not sliding) and gentler, and its
// depth gradient inverts — the crown sits farthest, so smallest and faintest.
const BACK_SWING = 0.7;

// Size/opacity spread across the sphere: nearness runs +1 (front crown, near)
// to -1 (back crown, far), 0 at the shared rim so the two planes meet cleanly.
const SIZE_DEPTH = 0.4;
const ALPHA_DEPTH = 0.15;

// Hub-and-spoke molecule mix: lone atoms, diatomic pairs, and water/ammonia-
// style hubs with 2–3 satellites, weighted toward the simpler species.
function makeSatellites(size: number): Satellite[] {
  const roll = Math.random();
  const n = roll < 0.45 ? 0 : roll < 0.7 ? 1 : roll < 0.88 ? 2 : 3;
  return Array.from({ length: n }, () => ({
    dist: (7 + Math.random() * 6) * size,
    ang: Math.random() * Math.PI * 2,
    spd: (Math.random() - 0.5) * 0.02,
    r: (0.7 + Math.random() * 1) * size,
  }));
}

// Slow-drifting "atom" dots in the callout ink, some clustered into small
// molecules with drawn bonds. `size` scales every radius and bond length
// linearly; `opacity` is the target level (each atom jitters ±30% around it)
// and applies live at draw time without re-dealing the field.
export function Atoms({
  density,
  size,
  opacity,
  pointer,
  color,
  back = false,
}: {
  density: number;
  size: number;
  opacity: number;
  pointer: RefObject<{ x: number; y: number }>;
  color: string;
  back?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const opacityRef = useRef(opacity);
  // Draw colour resolved to a concrete rgb: canvas fillStyle can't take
  // var()/color-mix(), so parking the expression on the element's `color` and
  // reading it back off getComputedStyle resolves it for us.
  const inkRef = useRef("#241a35");

  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.style.color = color;
    inkRef.current = getComputedStyle(canvas).color || "#241a35";
  }, [color]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const fit = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const atoms: Atom[] = Array.from({ length: Math.round(22 * density) }, () => {
      const fx = gauss(SCOOP_X, SPREAD_X);
      const fy = gauss(SCOOP_Y, SPREAD_Y);
      const z = domeZ(fx, fy);
      const hx = fx * w;
      const hy = fy * h;
      // Nearness toward the viewer: the front plane bulges out (+z), the back
      // plane recedes (−z), both meeting at the rim (0). Drives size + alpha so
      // the two planes read as the near and far faces of one sphere.
      const near = back ? -z : z;
      return {
        x: hx,
        y: hy,
        hx,
        hy,
        z,
        r: (1 + Math.random() * 1.6) * size * (1 + SIZE_DEPTH * near),
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        // Back plane fades toward the scoop centre so it doesn't ghost through.
        alpha: (0.7 + Math.random() * 0.6) * (1 + ALPHA_DEPTH * near) * (back ? centerFade(z) : 1),
        sats: makeSatellites(size),
      };
    });

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = inkRef.current;
      ctx.strokeStyle = inkRef.current;
      ctx.lineWidth = 1;
      const level = opacityRef.current;
      const p = pointer.current;
      // Front swings against the pointer; the back plane swings with it (and
      // gentler), so the near and far faces counter-rotate like one sphere.
      const swing = back ? -DEPTH_SHIFT * BACK_SWING : DEPTH_SHIFT;
      for (const a of atoms) {
        a.vx = (a.vx + (a.hx - a.x) * SPRING) * DAMPING;
        a.vy = (a.vy + (a.hy - a.y) * SPRING) * DAMPING;
        a.x += a.vx;
        a.y += a.vy;
        // Dome parallax: crown atoms (z→1) swing further than rim atoms (z→0),
        // on top of the plane's uniform drift.
        const bx = a.x - p.x * a.z * swing;
        const by = a.y - p.y * a.z * swing;
        ctx.globalAlpha = Math.min(1, a.alpha * level);
        ctx.beginPath();
        ctx.arc(bx, by, a.r, 0, Math.PI * 2);
        ctx.fill();
        for (const s of a.sats) {
          s.ang += s.spd;
          const sx = bx + Math.cos(s.ang) * s.dist;
          const sy = by + Math.sin(s.ang) * s.dist;
          ctx.globalAlpha = Math.min(1, a.alpha * level * 0.7);
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density, size, pointer, back]);

  return <canvas ref={ref} className={styles.atoms} />;
}
