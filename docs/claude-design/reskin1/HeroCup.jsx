/* =========================================================================
   PintCup — the hero "specimen". A proper squat ice-cream pint (rolled rim +
   overhanging lid). Filled bottom→top with flat candy macro layers drawn as
   real tapered trapezoids (NO clip-path — so the layers render identically in
   every browser and capture tool), separated by thin ink rules. Thick ink
   outline + offset misregistration shadow + a gently rippling top surface.
   ========================================================================= */

// geometry (viewBox 0 0 220 260 — squat pint, wide top, slight taper to base)
const CUP = { topL: 28, topR: 192, botL: 46, botR: 174, top: 62, bot: 232, r: 15 };
const LID = { x: 20, y: 30, w: 180, h: 26, r: 11 };
const cupPath = () =>
  `M ${CUP.topL} ${CUP.top} L ${CUP.topR} ${CUP.top} L ${CUP.botR} ${CUP.bot - CUP.r}` +
  ` Q ${CUP.botR} ${CUP.bot} ${CUP.botR - CUP.r} ${CUP.bot} L ${CUP.botL + CUP.r} ${CUP.bot}` +
  ` Q ${CUP.botL} ${CUP.bot} ${CUP.botL} ${CUP.bot - CUP.r} Z`;
const lidPath = () =>
  `M ${LID.x + LID.r} ${LID.y} L ${LID.x + LID.w - LID.r} ${LID.y}` +
  ` Q ${LID.x + LID.w} ${LID.y} ${LID.x + LID.w} ${LID.y + LID.r} L ${LID.x + LID.w} ${LID.y + LID.h}` +
  ` L ${LID.x} ${LID.y + LID.h} L ${LID.x} ${LID.y + LID.r} Q ${LID.x} ${LID.y} ${LID.x + LID.r} ${LID.y} Z`;

function HeroCup({ ratios, size = "full", width, swatch = "mint" }) {
  const mini = size === "mini";
  const w = width || (mini ? 96 : size === "hero" ? 320 : 190);
  const inset = mini ? 2.6 : 3.6;                 // pull layers inside the outline stroke
  const interiorTop = CUP.top + 3, interiorBot = CUP.bot - 3;
  const fillH = (interiorBot - interiorTop) * 0.9;

  // left/right interior edge at any y (linear taper)
  const edgesAt = (y) => {
    const t = (y - CUP.top) / (CUP.bot - CUP.top);
    return { l: CUP.topL + (CUP.botL - CUP.topL) * t + inset, r: CUP.topR + (CUP.botR - CUP.topR) * t - inset };
  };
  const poly = (yTop, yBot) => {
    const a = edgesAt(yTop), b = edgesAt(yBot);
    return `M ${a.l.toFixed(1)} ${yTop.toFixed(1)} L ${a.r.toFixed(1)} ${yTop.toFixed(1)} L ${b.r.toFixed(1)} ${yBot.toFixed(1)} L ${b.l.toFixed(1)} ${yBot.toFixed(1)} Z`;
  };

  // stack the layers bottom→top
  const total = MACRO_KEYS.reduce((s, k) => s + (ratios[k] || 0), 0) || 1;
  let y = interiorBot;
  const bands = [];
  for (const m of MACROS) {
    const h = ((ratios[m.key] || 0) / total) * fillH;
    if (h <= 0.4) continue;
    bands.push({ key: m.key, cvar: m.cvar, yTop: y - h, yBot: y });
    y -= h;
  }
  const surfaceY = y;
  const topBand = bands[bands.length - 1];

  // ripple the top surface
  const waveRef = useRef(null);
  const amp = mini ? 1.4 : 2.6;
  const wavePoly = (meanY, t) => {
    const e = edgesAt(meanY), x0 = e.l, x1 = e.r, k = (2 * Math.PI) / Math.max(48, x1 - x0);
    const phase = 0.9 * Math.sin(0.9 * t);
    let d = `M ${x0.toFixed(1)} ${(meanY + 5).toFixed(1)} L ${x0.toFixed(1)} ${(meanY + amp * Math.sin(k * x0 + phase)).toFixed(2)}`;
    for (let x = x0 + 4; x <= x1; x += 4) d += ` L ${x.toFixed(1)} ${(meanY + amp * Math.sin(k * x + phase)).toFixed(2)}`;
    return d + ` L ${x1.toFixed(1)} ${(meanY + 5).toFixed(1)} Z`;
  };
  useEffect(() => {
    const el = waveRef.current;
    if (!el) return;
    if (mini || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.setAttribute("d", wavePoly(surfaceY, 0)); return; }
    let raf;
    const tick = () => { el.setAttribute("d", wavePoly(surfaceY, performance.now() / 1000)); raf = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [surfaceY, amp, mini]);

  const sw = mini ? 3 : 4;         // outline weight
  const sep = mini ? 1.4 : 2;      // layer separator weight

  return (
    <div className={`cup cup--${size}`} style={{ width: w }}>
      <svg viewBox="0 0 220 260" role="img" aria-label="Macro composition, layered by weight" className="cup__svg">
        {/* empty carton interior */}
        <path d={poly(interiorTop, interiorBot)} fill="var(--paper-2)" />

        {/* macro layers (real trapezoids, bottom→top) */}
        {bands.map((b) => (
          <path key={b.key} d={poly(b.yTop, b.yBot)} fill={`var(${b.cvar})`} className="cup__band" />
        ))}
        {/* rippling top surface, tinted like the top layer */}
        {topBand && <path ref={waveRef} d={wavePoly(surfaceY, 0)} fill={`var(${topBand.cvar})`} />}
        {/* thin ink rules between the layers */}
        {bands.slice(0, -1).map((b) => {
          const e = edgesAt(b.yTop);
          return <line key={"sep" + b.key} x1={e.l.toFixed(1)} y1={b.yTop.toFixed(1)} x2={e.r.toFixed(1)} y2={b.yTop.toFixed(1)} stroke="var(--ink)" strokeWidth={sep} opacity="0.32" />;
        })}
        {/* screenprint sheen down the left */}
        {(() => { const a = edgesAt(interiorTop), c = edgesAt(interiorBot); const wdt = mini ? 8 : 13;
          return <path d={`M ${a.l} ${interiorTop} L ${a.l + wdt} ${interiorTop} L ${c.l + wdt} ${interiorBot} L ${c.l} ${interiorBot} Z`} fill="#fff" opacity="0.12" />; })()}

        {/* outlines */}
        <path d={cupPath()} fill="none" stroke="var(--ink)" strokeWidth={sw} strokeLinejoin="round" />
        <line x1={CUP.topL + 2} y1={CUP.top} x2={CUP.topR - 2} y2={CUP.top} stroke="var(--ink)" strokeWidth={sw} strokeLinecap="round" />
        <path d={lidPath()} fill="none" stroke="var(--ink)" strokeWidth={sw} strokeLinejoin="round" />
        <line x1={LID.x + 4} y1={LID.y + LID.h} x2={LID.x + LID.w - 4} y2={LID.y + LID.h} stroke="var(--ink)" strokeWidth={sep} opacity="0.4" />
      </svg>
    </div>
  );
}

Object.assign(window, { HeroCup });
