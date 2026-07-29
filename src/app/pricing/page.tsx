"use client";

import { useState } from "react";
import { Plus, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Header } from "@/components/shared/Header";
import styles from "./page.module.scss";

type Billing = "annual" | "monthly";

interface Tier {
  id: string;
  name: string;
  tagline: string;
  price: { monthly: number; annual: number }; // per-month in USD
  billedNote: (b: Billing) => string;
  badge?: string;
  highlight?: boolean;
  cta: { label: string; href: string; hierarchy: "primary" | "secondary" };
  features: string[];
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Home Lab",
    tagline: "For dialing in recipes at home.",
    price: { monthly: 0, annual: 0 },
    billedNote: () => "Free forever · no card",
    cta: { label: "Start free", href: "/new", hierarchy: "secondary" },
    features: [
      "The live formulator — six sliders, grams re-solve as you drag",
      "Full ingredient pantry, searchable and filtered",
      "Machine-tuned targets — home churn, Creami, compressor",
      "Recipe archetypes to start from, not a blank page",
      "Balance check — scoopability and sweetness readouts",
      "Scale any batch to a target yield",
      "Up to 10 saved batches",
    ],
  },
  {
    id: "pro",
    name: "Production",
    tagline: "For selling what you make.",
    price: { monthly: 6, annual: 4 },
    billedNote: (b) => (b === "annual" ? "Billed annually — $48/yr" : "Billed monthly"),
    badge: "Most popular",
    highlight: true,
    cta: { label: "Go Pro", href: "#", hierarchy: "primary" },
    features: [
      "Everything in Home Lab",
      "Unlimited saved batches",
      "Cloud sync across every device",
      "Cost & COGS per batch",
      "Overrun & yield modeling",
      "Export to PDF + printable pint labels",
      "Recipe versioning & history",
    ],
  },
];

// Feature-by-feature comparison. `true`/`false` render a check / dash; a string
// renders as its own value (e.g. batch caps).
const COMPARE: { label: string; free: boolean | string; pro: boolean | string }[] = [
  { label: "Live formulator + pantry", free: true, pro: true },
  { label: "Machine-tuned targets", free: true, pro: true },
  { label: "Balance check (scoopability + sweetness)", free: true, pro: true },
  { label: "Scale to a target yield", free: true, pro: true },
  { label: "Saved batches", free: "10", pro: "Unlimited" },
  { label: "Cloud sync across devices", free: false, pro: true },
  { label: "Cost & COGS per batch", free: false, pro: true },
  { label: "Overrun & yield modeling", free: false, pro: true },
  { label: "Export to PDF + pint labels", free: false, pro: true },
  { label: "Recipe versioning & history", free: false, pro: true },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is the free tier actually free?",
    a: "Yes. The whole formulator — sliders, pantry, machine targets, and the balance check — is free forever, up to ten saved batches. No card, no trial clock.",
  },
  {
    q: "Who is Pro for?",
    a: "Serious hobbyists and micro-producers who sell what they make. If you need to price a batch, hit a consistent overrun, and hand a spec to a co-packer, that's Pro.",
  },
  {
    q: "Why not charge for the science?",
    a: "Because good design shouldn't cost money, and the formula engine is the same either way. Pro pays for the money-adjacent tools — cost, yield, export — not the math.",
  },
  {
    q: "Can I cancel anytime?",
    a: "One click. You keep every recipe and simply drop back to the free tier — nothing is deleted, nothing is held hostage.",
  },
  {
    q: "Do you own or sell my recipes?",
    a: "No. Your formulas are yours. We never sell your data, and export means you can always take them with you.",
  },
];

function price(tier: Tier, billing: Billing): string {
  const v = tier.price[billing];
  return v === 0 ? "$0" : `$${v}`;
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className={styles.yes} size={18} strokeWidth={2.5} aria-label="Included" />;
  if (value === false) return <Minus className={styles.no} size={18} strokeWidth={2} aria-label="Not included" />;
  return <span className={styles.cellText}>{value}</span>;
}

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <main className={styles.main}>
      <Header />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Pricing</p>
        <h1 className={styles.title}>
          <span className={styles.titleRow}>Free to formulate.</span>
          <span className={`${styles.titleRow} ${styles.sci}`}>Pay when you produce.</span>
        </h1>
        <p className={styles.lead}>
          The formulator is free forever. Upgrade when your kitchen turns into a business —
          when you need costing, overrun, and specs you can actually hand to a co-packer.
        </p>

        <div className={styles.toggle} role="group" aria-label="Billing period">
          <button
            type="button"
            className={styles.toggleBtn}
            data-active={billing === "annual" ? "" : undefined}
            onClick={() => setBilling("annual")}
          >
            Annual
          </button>
          <button
            type="button"
            className={styles.toggleBtn}
            data-active={billing === "monthly" ? "" : undefined}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <Tag size="sm" tone="ok">Save 33%</Tag>
        </div>
      </section>

      <section className={styles.tiers}>
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={styles.tier}
            data-highlight={tier.highlight ? "" : undefined}
          >
            <div className={styles.tierHead}>
              <div className={styles.tierName}>
                <h2 className={styles.tierTitle}>{tier.name}</h2>
                {tier.badge && <Tag size="sm" tone="normal">{tier.badge}</Tag>}
              </div>
              <p className={styles.tagline}>{tier.tagline}</p>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.priceNum}>{price(tier, billing)}</span>
              {tier.price[billing] > 0 && <span className={styles.priceUnit}>/mo</span>}
            </div>
            <p className={styles.billedNote}>{tier.billedNote(billing)}</p>

            <Button
              hierarchy={tier.cta.hierarchy}
              size="lg"
              href={tier.cta.href}
              icon={tier.id === "free" ? <Plus size={18} /> : undefined}
              className={styles.tierCta}
            >
              {tier.cta.label}
            </Button>

            <ul className={styles.featureList}>
              {tier.features.map((f) => (
                <li key={f} className={styles.feature}>
                  <Check className={styles.featureCheck} size={17} strokeWidth={2.5} aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className={styles.compareSection}>
        <SectionHeader label="Compare plans" />
        <table className={styles.compare}>
          <thead>
            <tr>
              <th className={styles.compareFeature} scope="col">Feature</th>
              <th scope="col">Home Lab</th>
              <th className={styles.comparePro} scope="col">Production</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((row) => (
              <tr key={row.label}>
                <th className={styles.compareFeature} scope="row">{row.label}</th>
                <td><Cell value={row.free} /></td>
                <td className={styles.comparePro}><Cell value={row.pro} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.faqSection}>
        <SectionHeader label="Questions" />
        <div className={styles.faq}>
          {FAQ.map((item) => (
            <div key={item.q} className={styles.faqItem}>
              <h3 className={styles.faqQ}>{item.q}</h3>
              <p className={styles.faqA}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.closer}>
        <h2 className={styles.closerTitle}>Start in the free lab.</h2>
        <p className={styles.closerLead}>
          Build a batch to the gram, see how it&apos;ll scoop, and upgrade the day you sell your first pint.
        </p>
        <Button hierarchy="primary" size="lg" icon={<Plus size={18} />} href="/new">
          New batch
        </Button>
      </section>
    </main>
  );
}
