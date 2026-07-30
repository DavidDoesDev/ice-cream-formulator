"use client";

// TEMPORARY mobile home variant #2 — big centred cone hero. For review only.
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Header } from "@/components/shared/Header";
import { SparkleCone } from "@/components/home/SparkleCone";
import { StretchTitle } from "@/components/home/StretchTitle";
import styles from "./page.module.scss";

const FEATURES = [
  { eyebrow: "The Lab", title: "Six sliders, one live recipe", body: "Drag fat, sugar, and milk solids and the grams re-solve underneath in real time." },
  { eyebrow: "Stocked Pantry", title: "Every ingredient, weighed", body: "Build a base from a searchable, category-filtered pantry of dairy, sugars, and stabilizers." },
  { eyebrow: "Equipment Optimized", title: "Tuned to your machine", body: "Targets shift for a home churn, a Creami, or a compressor — so it scoops the way you expect." },
  { eyebrow: "Batch Scaling", title: "Scale to any yield", body: "Set a batch size and every ingredient moves together, to the gram." },
  { eyebrow: "Recipe Library", title: "Start from an archetype", body: "Philadelphia, custard, gelato, sorbet — begin from a sensible base, not a blank page." },
  { eyebrow: "Balance Check", title: "Know before you churn", body: "Scoopability and sweetness readouts flag an out-of-range mix before it hits the freezer." },
  { eyebrow: "Label Maker", title: "Print the pint", body: "Generate a press-styled label with the batch number, macros, and process notes." },
];

export default function HomeVariant2() {
  return (
    <main className={styles.main}>
      <Header />

      <section className={styles.hero}>
        <StretchTitle className={styles.title} />

        <div className={styles.coneBox} aria-hidden>
          <SparkleCone mobile="hero" />
        </div>

        <p className={styles.lead}>
          Ice Cream Lab is a recipe designer for frozen desserts. Set how rich, how
          sweet, and how firm you want a batch to be, and it works out the exact
          ingredients — to the gram — and shows you how it&apos;ll scoop before you
          churn a thing.
        </p>

        <div className={styles.cta}>
          <Button hierarchy="primary" size="lg" icon={<Plus size={18} />} href="/new">
            New batch
          </Button>
        </div>
      </section>

      <section className={styles.features}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.eyebrow} eyebrow={f.eyebrow} title={f.title}>
            <p>{f.body}</p>
          </FeatureCard>
        ))}
      </section>
    </main>
  );
}
