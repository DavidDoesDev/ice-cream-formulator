import { MacroDot, type MacroKey } from "@/components/shared/MacroDot";
import { PintCup } from "@/components/shared/PintCup";
import type { MacroRatios } from "@/lib/formula-engine";
import styles from "./ScienceSection.module.scss";

// A representative Philadelphia-style mix for the figure — the same macro
// stack the batch tiles above render, shown here to scale with labels.
const EXAMPLE_RATIOS: MacroRatios = {
  fat: 0.14,
  sugar: 0.14,
  nonfatSolids: 0.1,
  stabilizer: 0.004,
  emulsifier: 0.002,
  alcohol: 0,
  water: 0.614,
};

const MACROS: { key: MacroKey; name: string; role: string }[] = [
  {
    key: "water",
    name: "Water",
    role: "The part that freezes. Ice crystals form from free water — keeping them small is the whole game.",
  },
  {
    key: "sugar",
    name: "Sugar",
    role: "Sweetness and softness. Dissolved sugar lowers the freezing point, so a scoop stays pliable.",
  },
  {
    key: "fat",
    name: "Fat",
    role: "Creaminess. Carries flavor and melts on the tongue.",
  },
  {
    key: "nonfatSolids",
    name: "Milk solids",
    role: "Body. Milk proteins and lactose add density and chew.",
  },
  {
    key: "stabilizer",
    name: "Stabilizer",
    role: "Insurance, in fractions of a percent. Binds water so crystals can't grow in storage.",
  },
  {
    key: "emulsifier",
    name: "Emulsifier",
    role: "Structure. Arranges fat around air bubbles so the foam holds.",
  },
  {
    key: "alcohol",
    name: "Alcohol",
    role: "Optional. Drops the freezing point fast — a little keeps boozy flavors scoopable.",
  },
];

const STEPS: { title: string; body: string }[] = [
  {
    title: "Start from a style",
    body: "Pick an archetype — gelato, custard, Philadelphia, sherbet, sorbet — and get a formula that already sits in balance.",
  },
  {
    title: "Steer the macros",
    body: "Sliders set the targets. Every move re-solves the mix live and flags anything drifting toward icy, greasy or rock-hard.",
  },
  {
    title: "Get a recipe in grams",
    body: "The solver translates your targets into real ingredients, weighed to the gram and scaled to your batch. Churn, taste, iterate.",
  },
];

export function ScienceSection() {
  return (
    <section className={styles.science} id="science">
      <div className={styles.head}>
        <h2 className={styles.title}>How it works</h2>
      </div>
      <div className={styles.body}>
        <div className={styles.intro}>
          <p className={styles.lead}>
            Gelato, custard, sherbet, sorbet — for all the variety in the
            freezer aisle, every frozen dessert is set by the same handful of
            numbers. Seven macros decide how a mix freezes, scoops and melts;
            the styles just weight them differently. Gelato is ice cream with
            the fat turned down. Sorbet is sugar and water, dairy at zero.
          </p>

          <h3 className={styles.kicker}>The seven macros</h3>
          <ul className={styles.macroList}>
            {MACROS.map((m) => (
              <li key={m.key} className={styles.macro}>
                <span className={styles.macroName}>
                  <MacroDot macro={m.key} size={14} />
                  {m.name}
                </span>
                <span className={styles.macroRole}>{m.role}</span>
              </li>
            ))}
          </ul>
        </div>
        <figure className={styles.figure}>
          <PintCup size="fluid" ratios={EXAMPLE_RATIOS} />
        </figure>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((s, i) => (
          <li key={s.title} className={styles.step}>
            <span className={styles.stepNo} aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={styles.stepText}>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepBody}>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
