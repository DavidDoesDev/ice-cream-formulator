import { useEffect, useRef } from "react";
import styles from "./SparkleCone.module.scss";

type Atom = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  bond?: { dist: number; ang: number; spd: number; r: number };
};

// Slow-drifting "atom" dots in theme colors; about a third carry a smaller
// partner orbiting on a drawn bond, reading as loose molecules.
export function Atoms({ density }: { density: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas can't reference CSS custom properties, so resolve them once.
    const root = getComputedStyle(document.documentElement);
    const palette = [
      root.getPropertyValue("--ink").trim() || "#241a35",
      root.getPropertyValue("--accent").trim() || "#4338ff",
      root.getPropertyValue("--c-yellow").trim() || "#f5c518",
    ];

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

    const atoms: Atom[] = Array.from({ length: Math.round(22 * density) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.5 + Math.random() * 3.5,
      // Slight upward bias, like bubbles out of solution.
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25 - 0.05,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: 0.35 + Math.random() * 0.45,
      bond:
        Math.random() < 0.35
          ? {
              dist: 9 + Math.random() * 9,
              ang: Math.random() * Math.PI * 2,
              spd: (Math.random() - 0.5) * 0.02,
              r: 1.2 + Math.random() * 2,
            }
          : undefined,
    }));

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, w, h);
      for (const a of atoms) {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < -10) a.x = w + 10;
        if (a.x > w + 10) a.x = -10;
        if (a.y < -10) a.y = h + 10;
        if (a.y > h + 10) a.y = -10;
        ctx.globalAlpha = a.alpha;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
        if (a.bond) {
          a.bond.ang += a.bond.spd;
          const bx = a.x + Math.cos(a.bond.ang) * a.bond.dist;
          const by = a.y + Math.sin(a.bond.ang) * a.bond.dist;
          ctx.globalAlpha = a.alpha * 0.7;
          ctx.strokeStyle = a.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(bx, by, a.bond.r, 0, Math.PI * 2);
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
  }, [density]);

  return <canvas ref={ref} className={styles.atoms} />;
}
