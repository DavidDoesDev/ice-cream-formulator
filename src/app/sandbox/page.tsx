import styles from "./page.module.scss";
import { PintCup } from "@/components/shared/PintCup";

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
        <p className={styles.label}>Pint cup</p>
        <div className={styles.pintRow}>
          <div>
            <p className={styles.swatchLabel}>Full</p>
            <PintCup
              ratios={{ fat: 0.12, sugar: 0.16, nonfatSolids: 0.10, stabilizer: 0.003, emulsifier: 0.002, alcohol: 0, water: 0.615 }}
            />
          </div>
          <div>
            <p className={styles.swatchLabel}>Mini</p>
            <PintCup
              size="mini"
              ratios={{ fat: 0.12, sugar: 0.16, nonfatSolids: 0.10, stabilizer: 0.003, emulsifier: 0.002, alcohol: 0, water: 0.615 }}
            />
          </div>
          <div>
            <p className={styles.swatchLabel}>High-fat</p>
            <PintCup
              ratios={{ fat: 0.22, sugar: 0.12, nonfatSolids: 0.09, stabilizer: 0.003, emulsifier: 0.002, alcohol: 0, water: 0.565 }}
            />
          </div>
          <div>
            <p className={styles.swatchLabel}>Sorbet</p>
            <PintCup
              ratios={{ fat: 0.0, sugar: 0.22, nonfatSolids: 0.02, stabilizer: 0.003, emulsifier: 0, alcohol: 0.02, water: 0.737 }}
            />
          </div>
        </div>
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
