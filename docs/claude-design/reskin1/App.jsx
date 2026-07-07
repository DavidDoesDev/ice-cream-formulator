/* =========================================================================
   App — routing, the top bar, tweak → token application, and the mount.
   ========================================================================= */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "press",
  "theme": "light",
  "accent": "#4b39f2",
  "headline": "Anton",
  "marqueeOn": true,
  "marqueeSpeed": 26,
  "density": "regular",
  "w1": "Cold",
  "w2": "Hard",
  "w3": "Science",
  "leadA": "Ice Cream Lab is a test kitchen for frozen formulas.",
  "leadMark": "Dial in the grams,",
  "leadB": "watch the macros move, and invent a flavor that's yours."
}/*EDITMODE-END*/;

const ACCENTS = ["#4b39f2", "#6d2cf0", "#2a4bf0", "#e5322b", "#0e8f6e"];
const HEADLINES = ["Anton", "Archivo Black", "Bricolage Grotesque"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ name: "home" });

  // apply tweaks → DOM tokens
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-dir", t.direction);
    el.setAttribute("data-theme", t.theme);
    el.setAttribute("data-density", t.density);
    el.style.setProperty("--accent", t.accent);
    el.style.setProperty("--font-poster", "'" + t.headline + "','Arial Narrow',system-ui,sans-serif");
  }, [t.direction, t.theme, t.density, t.accent, t.headline]);

  const openRecipe = useCallback((r) => {
    setRoute({ name: "work", initial: { id: r.id, name: r.name, style: r.style, rows: r.rows.map((x) => ({ ...x })) } });
    window.scrollTo(0, 0);
  }, []);
  const startFromArchetype = useCallback(({ name, archetype }) => {
    setRoute({ name: "work", initial: { name, style: archetype.name, rows: archetype.rows.map((x) => ({ ...x })) } });
    window.scrollTo(0, 0);
  }, []);
  const goHome = useCallback(() => { setRoute({ name: "home" }); window.scrollTo(0, 0); }, []);
  const goNew = useCallback(() => { setRoute({ name: "new" }); window.scrollTo(0, 0); }, []);
  const random = useCallback(() => openRecipe(RECIPES[Math.floor(Math.random() * RECIPES.length)]), [openRecipe]);

  const copy = { w1: t.w1, w2: t.w2, w3: t.w3, leadA: t.leadA, leadMark: t.leadMark, leadB: t.leadB };
  const marquee = { on: t.marqueeOn, speed: t.marqueeSpeed, tone: t.direction === "specimen" ? "lilac" : "pink", tilt: t.direction === "specimen" ? 0 : -2 };

  return (
    <div className="app">
      {/* top bar */}
      <header className="topbar">
        <div className="brand" onClick={goHome}>
          <span className="brand__mark">Ice Cream Lab</span>
          <span className="brand__sub">Frozen formula studio</span>
        </div>
        <nav className="nav">
          <div className="seg" title="Art direction — your two options" aria-label="Direction">
            <button className={t.direction === "press" ? "on" : ""} onClick={() => setTweak("direction", "press")}>PRESS</button>
            <button className={t.direction === "specimen" ? "on" : ""} onClick={() => setTweak("direction", "specimen")}>SPEC</button>
          </div>
          <div className="seg" aria-label="Theme">
            <button className={t.theme === "light" ? "on" : ""} onClick={() => setTweak("theme", "light")}>☀</button>
            <button className={t.theme === "dark" ? "on" : ""} onClick={() => setTweak("theme", "dark")}>☾</button>
          </div>
          <Pill tone="accent" size="sm" className="cta-top" onClick={goNew}><Icon name="plus" size={16} /> New formula</Pill>
        </nav>
      </header>

      {/* routed screen */}
      {route.name === "home" && <Home copy={copy} marquee={marquee} onOpen={openRecipe} onNew={goNew} onRandom={random} />}
      {route.name === "new" && <NewFormula onBack={goHome} onStart={startFromArchetype} />}
      {route.name === "work" && <Workspace initial={route.initial} onBack={goHome} />}

      {/* footer */}
      <footer style={{ borderTop: "2.5px solid var(--ink)", background: "var(--paper-2)", padding: "22px clamp(16px,4vw,44px)",
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span className="brand__mark" style={{ fontSize: 26 }}>Ice Cream Lab</span>
        <span className="eyebrow">Churn · Balance · Taste · Repeat</span>
        <span className="eyebrow" style={{ marginLeft: "auto" }}>© 2026 · A frozen formula studio</span>
      </footer>

      {/* tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Art direction" />
        <TweakRadio label="Direction" value={t.direction} options={["press", "specimen"]} onChange={(v) => setTweak("direction", v)} />
        <TweakRadio label="Theme" value={t.theme} options={["light", "dark"]} onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="Ink / accent" value={t.accent} options={ACCENTS} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Type & density" />
        <TweakSelect label="Headline font" value={t.headline} options={HEADLINES} onChange={(v) => setTweak("headline", v)} />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "roomy"]} onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Marquee" />
        <TweakToggle label="Show marquee" value={t.marqueeOn} onChange={(v) => setTweak("marqueeOn", v)} />
        <TweakSlider label="Speed" value={t.marqueeSpeed} min={8} max={60} unit="s" onChange={(v) => setTweak("marqueeSpeed", v)} />
        <TweakSection label="Hero copy" />
        <TweakText label="Word 1" value={t.w1} onChange={(v) => setTweak("w1", v)} />
        <TweakText label="Word 2" value={t.w2} onChange={(v) => setTweak("w2", v)} />
        <TweakText label="Word 3 (outline)" value={t.w3} onChange={(v) => setTweak("w3", v)} />
        <TweakText label="Lead — start" value={t.leadA} onChange={(v) => setTweak("leadA", v)} />
        <TweakText label="Lead — highlight" value={t.leadMark} onChange={(v) => setTweak("leadMark", v)} />
        <TweakText label="Lead — end" value={t.leadB} onChange={(v) => setTweak("leadB", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
