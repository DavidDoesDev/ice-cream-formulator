/* =========================================================================
   Workspace — the lab bench where a formula gets tuned.
   LEFT  : the Recipe, in grams (type a number or drag to scrub, add / remove).
   RIGHT : the Macros, as live ratios — hero cup + interactive sliders + balance.
   The two are the same data and BOTH editable: edit grams, the macros move;
   drag a macro slider, the grams re-solve behind it.
   ========================================================================= */

/* --- gram scrub field: looks like the import pill, but click to type ----- */
function ScrubField({ grams, onChange, min = 0, big = false }) {
  const [drag, setDrag] = useState(false);
  const [text, setText] = useState(null);   // string while the input is focused
  const inputRef = useRef(null);

  // pointer drag with a small threshold, so a plain click still focuses the input to type
  const down = (e) => {
    const start = { y: e.clientY, g: grams, moved: false };
    const move = (ev) => {
      const dy = start.y - ev.clientY;
      if (!start.moved) { if (Math.abs(dy) < 3) return; start.moved = true; setDrag(true); document.body.classList.add("scrubbing"); if (inputRef.current) inputRef.current.blur(); }
      ev.preventDefault();
      onChange(Math.max(min, Math.round(start.g + dy * 0.5)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (start.moved) { setDrag(false); document.body.classList.remove("scrubbing"); }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const wheel = (e) => { e.preventDefault(); onChange(Math.max(min, grams + (e.deltaY < 0 ? 5 : -5))); };

  return (
    <div className={"scrub" + (drag ? " is-drag" : "")} onPointerDown={down} onWheel={wheel}
      title="Click to type, or drag up / down to tune" style={big ? { padding: "10px 16px" } : null}>
      <input ref={inputRef} className="scrub__val scrub__input" inputMode="numeric" aria-label="Grams"
        style={big ? { fontSize: 24 } : null}
        value={text ?? Math.round(grams)}
        onFocus={(e) => { setText(String(Math.round(grams))); e.target.select(); }}
        onChange={(e) => { const t = e.target.value.replace(/[^0-9]/g, ""); setText(t); if (t !== "") onChange(Math.max(min, parseInt(t, 10))); }}
        onBlur={() => { if (!text) onChange(min); setText(null); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
      <span className="scrub__unit">g</span>
    </div>
  );
}

/* --- macro slider: the ratio bar, made draggable; grams re-solve behind it - */
function MacroSlider({ mkey, value, max, band, style, onChange }) {
  const meta = MACROS.find((m) => m.key === mkey);
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const posPct = Math.max(0, Math.min(100, (value / max) * 100));
  const lenientLo = style === "Sorbet" && band && band.sorbetOk;
  const bandLo = band ? Math.max(0, Math.min(100, ((lenientLo ? 0 : band.lo) / max) * 100)) : 0;
  const bandHi = band ? Math.max(0, Math.min(100, (band.hi / max) * 100)) : 0;
  const set = (cx) => { const el = trackRef.current; if (!el) return; const r = el.getBoundingClientRect(); onChange(Math.max(0, Math.min(1, (cx - r.left) / r.width)) * max); };
  const down = (e) => { e.preventDefault(); setDrag(true); set(e.clientX); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} };
  useEffect(() => {
    if (!drag) return;
    const mv = (e) => set(e.clientX);
    const up = () => setDrag(false);
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
  }, [drag]);
  return (
    <div className="ratio">
      <span className="ratio__k"><MacroDot mkey={mkey} /> {meta.short}</span>
      <span className="ratio__track ratio__track--live" ref={trackRef} onPointerDown={down} title="Drag to tune">
        {band && <span className="ratio__band" style={{ left: bandLo + "%", width: (bandHi - bandLo) + "%" }} title="Target window" />}
        <span className="ratio__fill" style={{ width: posPct + "%", background: `var(${meta.cvar})`, transition: drag ? "none" : undefined }} />
        <span className="ratio__thumb" style={{ left: posPct + "%" }} />
      </span>
      <span className="ratio__v">{pct(value)}%</span>
    </div>
  );
}

/* --- ingredient drawer -------------------------------------------------- */
const CATS = [
  ["all", "All"], ["dairy", "Dairy"], ["sweetener", "Sugars"], ["inclusion", "Flavor"],
  ["fruit", "Fruit"], ["stabilizer", "Stabilizer"], ["emulsifier", "Emulsifier"], ["alcohol", "Alcohol"],
];
function IngredientDrawer({ onAdd, onClose, has }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  const list = INGREDIENTS.filter((i) => {
    if (cat !== "all" && i.category !== cat) return false;
    if (!q.trim()) return true;
    return (i.name + " " + i.note).toLowerCase().includes(q.toLowerCase().trim());
  });
  return (
    <div className="drawer" role="dialog" aria-label="Add ingredient">
      <div className="drawer__scrim" onClick={onClose} />
      <div className="drawer__sheet">
        <div className="drawer__head">
          <div className="drawer__title">Add<br />ingredient</div>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
        </div>
        <div className="drawer__search">
          <div className="searchbar" style={{ boxShadow: "none" }}>
            <Icon name="search" size={20} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the pantry…" />
          </div>
          <div className="row wrap gap-s" style={{ marginTop: 12 }}>
            {CATS.map(([id, label]) => (
              <Pill key={id} tone={cat === id ? "ink" : "ghost"} size="sm" active={cat === id} onClick={() => setCat(id)}>{label}</Pill>
            ))}
          </div>
        </div>
        <div className="drawer__list">
          {list.map((ing) => {
            const keys = MACRO_KEYS.filter((k) => k !== "water" && ing.macros[k] > 0);
            const added = has.has(ing.id);
            return (
              <button className={"ing-card" + (added ? " is-added" : "")} key={ing.id} disabled={added} onClick={() => !added && onAdd(ing)}>
                <div style={{ minWidth: 0 }}>
                  <div className="ic-cat">{ing.category}</div>
                  <div className="ic-name">{ing.name}</div>
                  <div className="ic-note">{ing.note}</div>
                  <div className="ic-macros">{keys.map((k) => <MacroDot key={k} mkey={k} />)}</div>
                </div>
                {added
                  ? <span className="ing-added-tag"><Icon name="check" size={14} /> In recipe</span>
                  : <span className="ing-card__add"><Pill tone="accent" size="sm" as="span"><Icon name="plus" size={16} /> Add</Pill></span>}
              </button>
            );
          })}
          {list.length === 0 && <p style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>No matches.</p>}
        </div>
      </div>
    </div>
  );
}

/* --- balance advice ----------------------------------------------------- */
const ADVICE = {
  fat: { low: "Lean — add cream for body.", high: "Heavy — ease off the cream." },
  sugar: { low: "Firm scoop — bump the sugar.", high: "Will freeze soft — cut sugar back." },
  nonfatSolids: { low: "Watery body — add milk powder.", high: "Sandy risk — reduce milk solids." },
  totalSolids: { low: "Thin — needs more solids.", high: "Dense — add milk or water." },
};
const LABEL = { fat: "Fat", sugar: "Sugar", nonfatSolids: "Milk solids", totalSolids: "Total solids" };

/* bar scaling so small macros stay legible */
const BAR_MAX = { fat: 0.26, sugar: 0.32, nonfatSolids: 0.16, stabilizer: 0.012, emulsifier: 0.009, alcohol: 0.08, water: 1 };
const EDIT_MACROS = ["fat", "sugar", "nonfatSolids"];   // these become live sliders when a source exists
const QUICK = [["sucrose", "Sugar"], ["egg-yolk", "Yolk"], ["lbg", "Stabilizer"], ["heavy-cream", "Cream"], ["vanilla-bean", "Vanilla"]];

function verdictOf(key, r, style) {
  const b = BANDS[key]; if (!b) return "ok";
  const v = key === "totalSolids" ? totalSolids(r) : r[key];
  const lenient = style === "Sorbet" && b.sorbetOk;
  if (v < b.lo) return lenient ? "ok" : "low";
  if (v > b.hi) return "high";
  return "ok";
}

function Workspace({ initial, onBack }) {
  const [name, setName] = useState(initial.name);
  const [style] = useState(initial.style);           // base style is set at creation
  const [rows, setRows] = useState(() => initial.rows.map((r) => ({ ...r })));
  const [drawer, setDrawer] = useState(false);
  const [editName, setEditName] = useState(false);
  const [savedId, setSavedId] = useState(initial.id || null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const ratios = useMemo(() => computeRatios(rows), [rows]);
  const total = sumGrams(rows);
  const presentIds = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);

  const setGrams = (idx, g) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, grams: g } : r)));
  const remove = (idx) => setRows((rs) => rs.filter((_, i) => i !== idx));
  const addIng = (ing) => { setRows((rs) => [...rs, { id: ing.id, name: ing.name, grams: 50 }]); setDrawer(false); };
  const quickAdd = (id) => { const ing = ingById(id); if (ing) setRows((rs) => [...rs, { id, name: ing.name, grams: 40 }]); };
  const setYield = (target) => {
    const t = sumGrams(rows); if (t <= 0 || target <= 0) return;
    const f = target / t; setRows((rs) => rs.map((r) => ({ ...r, grams: Math.max(1, Math.round(r.grams * f)) })));
  };

  const showToast = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2400); };
  const doSave = () => {
    const id = savedId || (slugify(name) + "-" + Date.now().toString(36));
    saveRecipe({
      id, name: name.trim() || "Untitled batch", style, swatch: styleToSwatch(style), kicker: "Saved",
      blurb: `Custom ${style.toLowerCase()} — ${rows.length} ingredient${rows.length === 1 ? "" : "s"}.`,
      rows: rows.map((r) => ({ id: r.id, grams: Math.round(r.grams), name: r.name })),
    });
    setSavedId(id);
    showToast("Saved to your vault");
  };

  const verdicts = ["fat", "sugar", "nonfatSolids", "totalSolids"].map((k) => ({ k, v: verdictOf(k, ratios, style), val: k === "totalSolids" ? totalSolids(ratios) : ratios[k] }));
  const okCount = verdicts.filter((x) => x.v === "ok").length;
  const quick = QUICK.filter(([id]) => !presentIds.has(id)).slice(0, 3);

  return (
    <div className="screen">
      <div className="container">
        {/* header */}
        <div className="row gap-m wrap" style={{ alignItems: "center", marginBottom: 24 }}>
          <button className="iconbtn" onClick={onBack} title="Back to vault"><Icon name="back" size={20} /></button>
          <span className="eyebrow">Workspace · live formula</span>
          <div style={{ marginLeft: "auto" }} className="row gap-s wrap">
            <Pill tone={okCount === 4 ? "mint" : "surface"} size="sm" as="span"
              title="Fat, Sugar, Milk solids and Total solids each have a healthy target window for this style. This counts how many currently land inside.">
              <Icon name={okCount === 4 ? "check" : "flask"} size={15} /> {okCount === 4 ? "Balanced" : okCount + " / 4 in range"}
            </Pill>
            <Pill tone="ghost" size="sm" onClick={() => setRows(initial.rows.map((r) => ({ ...r })))}>Reset</Pill>
            <Pill tone="ink" size="sm" onClick={doSave}>Save batch</Pill>
          </div>
        </div>

        {/* editable name */}
        <div style={{ margin: "6px 0 4px" }}>
          {editName ? (
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setEditName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditName(false)}
              className="poster" style={{ background: "transparent", border: 0, borderBottom: "3px solid var(--ink)",
                color: "var(--ink)", fontSize: "clamp(36px,7vw,84px)", outline: 0, width: "100%", padding: 0 }} />
          ) : (
            <h1 className="poster" onClick={() => setEditName(true)} title="Click to rename"
              style={{ fontSize: "clamp(36px,7vw,84px)", color: "var(--ink)", cursor: "text", lineHeight: .86 }}>{name}</h1>
          )}
        </div>

        {/* two columns — both editable */}
        <div className="work">
          {/* LEFT — recipe / grams */}
          <div className="panel">
            <div className="panel__bar">
              <span className="panel__kind">Recipe</span>
              <span className="eyebrow">grams · click to type</span>
            </div>

            <div className="sectionhead">
              <span className="sectionhead__dot" style={{ background: "var(--c-sky)" }} />
              <span className="sectionhead__label">Ingredients — {rows.length}</span>
              <span className="sectionhead__rule" />
            </div>

            {rows.map((r, i) => {
              const ing = ingById(r.id);
              const keys = ing ? MACRO_KEYS.filter((k) => k !== "water" && ing.macros[k] > 0).slice(0, 4) : [];
              return (
                <div className="ing-row" key={i}>
                  <div className="ing-main">
                    <span className="ing-name">{r.name || ing?.name}</span>
                    <span className="ing-dots">{keys.map((k) => <MacroDot key={k} mkey={k} size={9} />)}</span>
                    <div className="ing-cat">{ing?.category} · {pct((r.grams / (total || 1)))}% of batch</div>
                  </div>
                  <ScrubField grams={r.grams} onChange={(g) => setGrams(i, g)} min={1} />
                  <button className="trash" onClick={() => remove(i)} aria-label="Remove"><Icon name="close" size={16} /></button>
                </div>
              );
            })}

            <div className="row gap-s wrap" style={{ marginTop: 18, alignItems: "center" }}>
              <Pill tone="accent" size="md" onClick={() => setDrawer(true)}><Icon name="plus" size={18} /> Add ingredient</Pill>
              {quick.length > 0 && <span className="eyebrow" style={{ marginLeft: 2 }}>Try</span>}
              {quick.map(([id, label]) => (
                <Pill key={id} tone="ghost" size="md" onClick={() => quickAdd(id)}>+ {label}</Pill>
              ))}
            </div>

            <div className="sectionhead" style={{ marginTop: 26 }}>
              <span className="sectionhead__dot" style={{ background: "var(--c-yellow)" }} />
              <span className="sectionhead__label">Batch yield</span>
              <span className="sectionhead__rule" />
            </div>
            <div className="row" style={{ alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <span className="hero__lead" style={{ margin: 0, fontSize: 15, maxWidth: 260 }}>Scale the whole recipe up or down — every gram moves together.</span>
              <ScrubField grams={total} onChange={setYield} min={50} big />
            </div>

            <div className="total-row">
              <span className="k">Total mix</span>
              <span className="v">{grams(total)}</span>
            </div>
          </div>

          {/* RIGHT — macros */}
          <div className="panel panel--sticky">
            <div className="panel__bar">
              <span className="panel__kind">Macros</span>
              <span className="eyebrow">live · drag to tune</span>
            </div>

            <div className="cup-stage">
              <HeroCup ratios={ratios} size="full" width={210} swatch={styleToSwatch(style)} />
              <span className="cup-tag">{style}</span>
            </div>

            <div className="sectionhead">
              <span className="sectionhead__dot" style={{ background: "var(--c-pink)" }} />
              <span className="sectionhead__label">Composition</span>
              <span className="sectionhead__rule" />
            </div>
            {MACROS.map((m) => {
              const key = m.key, v = ratios[key];
              const alwaysShow = key === "water" || EDIT_MACROS.includes(key);
              if (!alwaysShow && v < 0.0005) return null;
              if (EDIT_MACROS.includes(key) && macroSource(rows, key)) {
                return <MacroSlider key={key} mkey={key} value={v} max={BAR_MAX[key]} band={BANDS[key]} style={style} onChange={(t) => setRows((rs) => solveMacro(rs, key, t))} />;
              }
              const w = Math.min(100, (v / BAR_MAX[key]) * 100);
              return (
                <div className="ratio" key={key}>
                  <span className="ratio__k"><MacroDot mkey={key} /> {m.short}</span>
                  <span className="ratio__track"><span className="ratio__fill" style={{ width: w + "%", background: `var(${m.cvar})` }} /></span>
                  <span className="ratio__v">{pct(v)}%</span>
                </div>
              );
            })}

            <div className="sectionhead" style={{ marginTop: 22 }}>
              <span className="sectionhead__dot" style={{ background: "var(--c-mint)" }} />
              <span className="sectionhead__label">Balance check</span>
              <span className="sectionhead__rule" />
            </div>
            <p className="balance__note">Each macro is checked against its healthy window for a <b>{style}</b>. <span className="dot dot--ok" />in range · <span className="dot dot--low" />low · <span className="dot dot--high" />high.</p>
            <div className="balance">
              {verdicts.map(({ k, v, val }) => {
                const b = BANDS[k];
                const lenient = style === "Sorbet" && b.sorbetOk;
                const lo = lenient ? 0 : Math.round(b.lo * 100), hi = Math.round(b.hi * 100);
                return (
                  <div className={"bal bal--" + v} key={k}>
                    <span className="bal__ic"><Icon name={v === "ok" ? "check" : v === "low" ? "arrow" : "bolt"} size={16} /></span>
                    <span className="bal__txt"><b>{LABEL[k]}</b> — {v === "ok" ? "Inside the target window." : ADVICE[k][v]}</span>
                    <span className="bal__val"><span>{pct(val, 0)}%</span><span className="bal__target">target {lo}–{hi}%</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {drawer && <IngredientDrawer onAdd={addIng} onClose={() => setDrawer(false)} has={presentIds} />}
      {toast && <div className="toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}
Object.assign(window, { Workspace, ScrubField, MacroSlider, IngredientDrawer });
