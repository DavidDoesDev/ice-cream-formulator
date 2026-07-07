/* =========================================================================
   Home — the Lab Bench. Oversized poster hero, marquee, and the recipe
   "vault". Built-in formulas + anything the user has saved (localStorage),
   each card computing its own macro ratios live.
   ========================================================================= */
function Home({ copy, onOpen, onNew, onRandom, marquee }) {
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState(() => loadSaved());

  const all = useMemo(
    () => [...saved, ...RECIPES.filter((r) => !saved.some((s) => s.id === r.id))],
    [saved]
  );
  const removeSaved = (e, id) => { e.stopPropagation(); e.preventDefault(); deleteSaved(id); setSaved(loadSaved()); };

  const styles = ["All", "Philadelphia", "French Custard", "Gelato", "Sorbet"];
  const list = all.filter((r) => {
    if (filter !== "All" && r.style !== filter) return false;
    if (!q.trim()) return true;
    const s = (r.name + " " + r.style + " " + (r.blurb || "")).toLowerCase();
    return s.includes(q.toLowerCase().trim());
  });

  return (
    <div className="screen">
      <div className="container">

        {/* ---- hero ---- */}
        <section className="hero rise">
          <div className="hero__kicker">
            <Pill tone="mint" size="sm" as="span"><Icon name="flask" size={16} /> Test kitchen</Pill>
            <span className="eyebrow">Est. 2026 · Batch 06</span>
          </div>

          <h1 className="hero__title">
            <span className="row">{copy.w1}</span>
            <span className="row"><span className="shift">{copy.w2}</span></span>
            <span className="row"><em>{copy.w3}</em></span>
          </h1>

          <p className="hero__lead">
            {copy.leadA} <Mark color="yellow">{copy.leadMark}</Mark> {copy.leadB}
          </p>

          <div className="hero__cta">
            <Pill tone="accent" size="lg" onClick={onNew}><Icon name="plus" size={20} /> New formula</Pill>
            <Pill tone="ghost" size="lg" onClick={() => {
              const el = document.getElementById("vault");
              if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
            }}>
              Open the vault
            </Pill>
            <button className="iconbtn" title="Surprise me" onClick={onRandom} style={{ width: 52, height: 52 }}>
              <Icon name="dice" size={22} />
            </button>
          </div>
        </section>
      </div>

      {/* ---- marquee band ---- */}
      <Marquee {...marquee} words={[
        { text: "Churn", icon: "snow" }, { text: "Balance", icon: "diamond" },
        { text: "Taste", icon: "spoon" }, { text: "Freeze", icon: "bolt" },
        { text: "Repeat", icon: "flask" },
      ]} />

      <div className="container">
        {/* ---- vault ---- */}
        <section className="lib" id="vault">
          <div className="lib__head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                The vault · {all.length} formulas on file{saved.length ? ` · ${saved.length} saved` : ""}
              </div>
              <div className="lib__title">Your cold cases</div>
            </div>
            <div style={{ flex: 1, minWidth: 240, maxWidth: 380 }}>
              <div className="searchbar">
                <Icon name="search" size={20} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search formulas…" aria-label="Search formulas" />
              </div>
            </div>
          </div>

          <div className="row wrap gap-s" style={{ marginBottom: 22 }}>
            {styles.map((s) => (
              <Pill key={s} tone={filter === s ? "ink" : "ghost"} size="sm" active={filter === s} onClick={() => setFilter(s)}>{s}</Pill>
            ))}
          </div>

          <div className="grid">
            {list.map((r, i) => {
              const ratios = computeRatios(r.rows);
              return (
                <button className="specimen rise" key={r.id} onClick={() => onOpen(r)} style={{ animationDelay: i * 40 + "ms" }}>
                  {r.saved && (
                    <span className="specimen__del" role="button" title="Remove from vault" onClick={(e) => removeSaved(e, r.id)}>
                      <Icon name="close" size={15} />
                    </span>
                  )}
                  <div className="specimen__top">
                    {r.saved
                      ? <span className="specimen__saved"><Icon name="check" size={13} /> Saved</span>
                      : <span className="specimen__no">{r.kicker}</span>}
                    <Pill tone={r.swatch} size="sm" as="span">{r.style}</Pill>
                  </div>
                  <div className="specimen__cupwrap">
                    <HeroCup ratios={ratios} size="mini" width={120} swatch={r.swatch} />
                  </div>
                  <div className="specimen__name">{r.name}</div>
                  <div className="specimen__blurb">{r.blurb}</div>
                  <div className="specimen__stats">
                    <span className="chip"><MacroDot mkey="fat" /> <b>{pct(ratios.fat, 0)}%</b> fat</span>
                    <span className="chip"><MacroDot mkey="sugar" /> <b>{pct(ratios.sugar, 0)}%</b> sugar</span>
                    <span className="chip"><b>{pct(totalSolids(ratios), 0)}%</b> solids</span>
                  </div>
                </button>
              );
            })}
          </div>
          {list.length === 0 && (
            <p style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", padding: "40px 0" }}>
              Nothing on file matches “{q}”. Start a new formula →
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
Object.assign(window, { Home });
