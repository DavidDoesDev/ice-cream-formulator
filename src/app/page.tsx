"use client";

import { useSyncExternalStore } from "react";
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

// Hydration-safe viewport check. The server (and first client paint) assume
// desktop; once mounted, matchMedia takes over and the mobile hero swaps in on
// narrow screens. Below 900px matches the rest of the redesign's mobile cutoff.
const MOBILE_QUERY = "(max-width: 899px)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

const CTA = (
  <Button hierarchy="primary" size="lg" icon={<Plus size={18} />} href="/new">
    New batch
  </Button>
);

// Desktop (>= 900px): the original hero — stacked title with the cone as a
// backdrop resting against the right of the page-width column.
function DesktopHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>
            <span className={styles.titleRow}>Cold</span>
            <span className={styles.titleRow}>Hard</span>
            <span className={`${styles.titleRow} ${styles.sci}`}>Science</span>
          </h1>
          <p className={styles.lead}>
            Ice Cream Lab is a recipe designer for frozen desserts. Set how rich,
            how sweet, and how firm you want a batch to be, and it works out the
            exact ingredients — to the gram — and shows you how it&apos;ll scoop
            before you churn a thing.
          </p>
          <div className={styles.cta}>{CTA}</div>
        </div>
        <div className={styles.heroCone} aria-hidden>
          <SparkleCone />
        </div>
      </div>
    </section>
  );
}

// Mobile (< 900px): the Variant-2 hero — stretch headline, a big centred cone
// (callouts fanning to each dot's side), a subheadline, the lead, and a
// full-width CTA.
function MobileHero() {
  return (
    <section className={styles.mHero}>
      <StretchTitle className={styles.mTitle} />

      <div className={styles.coneBox} aria-hidden>
        <SparkleCone mobile="hero" calloutOverride={{ trailAuto: true }} />
      </div>

      <h2 className={styles.leadTitle}>A recipe designer for frozen desserts</h2>

      <p className={styles.mLead}>
        Set how rich, how sweet, and how firm you want a batch to be, and it works
        out the exact ingredients — to the gram — and shows you how it&apos;ll scoop
        before you churn a thing.
      </p>

      <div className={styles.mCta}>{CTA}</div>
    </section>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  return (
    <main className={styles.main}>
      <Header />

      {isMobile ? <MobileHero /> : <DesktopHero />}

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
