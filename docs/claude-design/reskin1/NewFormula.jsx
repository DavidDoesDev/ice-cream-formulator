/* =========================================================================
   NewFormula — "Pick a base". Archetype poster cards → name it → enter lab.
   ========================================================================= */
function NewFormula({ onBack, onStart }) {
  const [sel, setSel] = useState(null);
  const [name, setName] = useState("");

  const start = () => {
    if (!sel) return;
    onStart({ name: (name.trim() || sel.name + " No. 1"), archetype: sel });
  };

  return (
    <div className="screen">
      <div className="container">
        <div className="row gap-m" style={{ alignItems: "center", marginBottom: 26 }}>
          <button className="iconbtn" onClick={onBack} title="Back"><Icon name="back" size={20} /></button>
          <span className="eyebrow">New formula · Step 01 / 02</span>
        </div>

        <h1 className="poster rise" style={{ fontSize: "clamp(46px,9vw,120px)", color: "var(--ink)", marginBottom: 10 }}>
          Pick a<br /><em style={{ WebkitTextStroke: "2.5px var(--ink)", color: "transparent", fontStyle: "normal" }}>base.</em>
        </h1>
        <p className="hero__lead" style={{ marginTop: 8 }}>
          Every great flavor starts from a chassis. Choose one — you can bend all the numbers once you're inside.
        </p>

        <div className="arche-grid">
          {ARCHETYPES.map((a, i) => {
            const r = computeRatios(a.rows);
            const on = sel?.id === a.id;
            return (
              <button className={"arche rise" + (on ? " is-sel" : "")} key={a.id} onClick={() => { setSel(a); }} style={{ animationDelay: i * 50 + "ms" }}>
                <div className="arche__head">
                  <Pill tone={on ? "surface" : a.swatch} size="sm" as="span">{a.tag}</Pill>
                  {on && <Icon name="check" size={22} style={{ color: "#fff" }} />}
                </div>
                <div className="arche__cupwrap">
                  <HeroCup ratios={r} size="mini" width={116} swatch={a.swatch} />
                </div>
                <div className="arche__name">{a.name}</div>
                <div className="arche__blurb">{a.blurb}</div>
                <div className="specimen__stats" style={{ marginTop: 14 }}>
                  <span className="chip" style={on ? { color: "#fff", borderColor: "rgba(255,255,255,.4)" } : null}><MacroDot mkey="fat" /> <b style={on ? { color: "#fff" } : null}>{pct(r.fat, 0)}%</b> fat</span>
                  <span className="chip" style={on ? { color: "#fff", borderColor: "rgba(255,255,255,.4)" } : null}><MacroDot mkey="sugar" /> <b style={on ? { color: "#fff" } : null}>{pct(r.sugar, 0)}%</b> sugar</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="name-field" style={{ opacity: sel ? 1 : 0.4, pointerEvents: sel ? "auto" : "none", transition: "opacity .3s" }}>
          <span className="eyebrow">Step 02 · Name your batch</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={sel ? "Untitled batch" : "Pick a base first"}
            onKeyDown={(e) => e.key === "Enter" && start()} />
        </div>

        <div className="hero__cta" style={{ marginTop: 34 }}>
          <Pill tone="accent" size="lg" onClick={start} style={{ opacity: sel ? 1 : 0.45, pointerEvents: sel ? "auto" : "none" }}>
            Enter the lab <Icon name="arrow" size={20} />
          </Pill>
          <span className="eyebrow" style={{ maxWidth: 260 }}>
            {sel ? `${sel.name} base loaded — ${sel.rows.length} ingredients ready to tune.` : "Nothing loaded yet."}
          </span>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { NewFormula });
