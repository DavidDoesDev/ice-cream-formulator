import { useEffect, useRef } from "react";
import styles from "./SparkleCone.module.scss";
import { SCOOP_X, SCOOP_Y, SPREAD_X, SPREAD_Y, gauss } from "./scatter";

type Satellite = { dist: number; ang: number; spd: number; r: number };

type Atom = {
  x: number;
  y: number;
  hx: number;
  hy: number;
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
export function Atoms({ density, size, opacity }: { density: number; size: number; opacity: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const opacityRef = useRef(opacity);

  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas can't reference CSS custom properties, so resolve once. Same
    // ink as the callouts, so the two effects read as one annotation system
    // and follow the theme together.
    const ink = getComputedStyle(canvas).getPropertyValue("--ink").trim() || "#241a35";

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
      const hx = gauss(SCOOP_X, SPREAD_X) * w;
      const hy = gauss(SCOOP_Y, SPREAD_Y) * h;
      return {
        x: hx,
        y: hy,
        hx,
        hy,
        r: (1 + Math.random() * 1.6) * size,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: 0.7 + Math.random() * 0.6,
        sats: makeSatellites(size),
      };
    });

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      const level = opacityRef.current;
      for (const a of atoms) {
        a.vx = (a.vx + (a.hx - a.x) * SPRING) * DAMPING;
        a.vy = (a.vy + (a.hy - a.y) * SPRING) * DAMPING;
        a.x += a.vx;
        a.y += a.vy;
        ctx.globalAlpha = Math.min(1, a.alpha * level);
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
        for (const s of a.sats) {
          s.ang += s.spd;
          const sx = a.x + Math.cos(s.ang) * s.dist;
          const sy = a.y + Math.sin(s.ang) * s.dist;
          ctx.globalAlpha = Math.min(1, a.alpha * level * 0.7);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
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
  }, [density, size]);

  return <canvas ref={ref} className={styles.atoms} />;
}
