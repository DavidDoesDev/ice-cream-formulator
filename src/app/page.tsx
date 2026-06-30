import styles from "./page.module.scss";

const MACROS = [
  { label: "Sugar", token: "--color-macro-sugar" },
  { label: "Fat", token: "--color-macro-fat" },
  { label: "Nonfat Solids", token: "--color-macro-nonfat" },
  { label: "Stabilizers", token: "--color-macro-stabilizer" },
  { label: "Emulsifiers", token: "--color-macro-emulsifier" },
  { label: "Alcohol", token: "--color-macro-alcohol" },
];

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <p className={styles.label}>Bricolage Grotesque</p>
        <div className={styles.typeStack}>
          {WEIGHTS.map((w) => (
            <p key={w} className={styles.typeSample} style={{ fontWeight: w }}>
              {w} — The quick brown fox
            </p>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Macro colors</p>
        <div className={styles.swatchRow}>
          {MACROS.map(({ label, token }) => (
            <div key={label} className={styles.swatch}>
              <div
                className={styles.swatchColor}
                style={{ background: `var(${token})` }}
              />
              <span className={styles.swatchLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Accent</p>
        <div className={styles.accentChip} />
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Container query</p>
        <div className={styles.cqOuter}>
          <div className={styles.cqBox}>
            <p className={styles.cqText}>Resize me — text adapts to container width.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
