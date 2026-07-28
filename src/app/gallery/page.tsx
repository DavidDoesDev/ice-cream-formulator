"use client";

import { useState } from "react";
import { Plus, Search, Trash2, Milk, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { manifest as buttonManifest } from "@/components/ui/Button/Button.manifest";
import { Card } from "@/components/ui/Card";
import { manifest as cardManifest } from "@/components/ui/Card/Card.manifest";
import { Tag } from "@/components/ui/Tag";
import { manifest as tagManifest } from "@/components/ui/Tag/Tag.manifest";
import { Input } from "@/components/ui/Input";
import { manifest as inputManifest } from "@/components/ui/Input/Input.manifest";
import { Modal } from "@/components/ui/Modal";
import { manifest as modalManifest } from "@/components/ui/Modal/Modal.manifest";
import { Tabs } from "@/components/ui/Tabs";
import { manifest as tabsManifest } from "@/components/ui/Tabs/Tabs.manifest";
import { Stat } from "@/components/ui/Stat";
import { manifest as statManifest } from "@/components/ui/Stat/Stat.manifest";
import { Callout } from "@/components/ui/Callout";
import { manifest as calloutManifest } from "@/components/ui/Callout/Callout.manifest";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { manifest as sectionHeaderManifest } from "@/components/ui/SectionHeader/SectionHeader.manifest";
import { InlineNote } from "@/components/ui/InlineNote";
import { manifest as inlineNoteManifest } from "@/components/ui/InlineNote/InlineNote.manifest";
import { LineItem } from "@/components/ui/LineItem";
import { manifest as lineItemManifest } from "@/components/ui/LineItem/LineItem.manifest";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { manifest as featureCardManifest } from "@/components/ui/FeatureCard/FeatureCard.manifest";
import { SelectableTile } from "@/components/ui/SelectableTile";
import { manifest as selectableTileManifest } from "@/components/ui/SelectableTile/SelectableTile.manifest";
import type { ComponentManifest } from "@/components/ui/manifest";
import styles from "./page.module.scss";

function Section({ manifest, children }: { manifest: ComponentManifest; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.name}>{manifest.name}</h2>
        <span className={styles.tier}>{manifest.tier}</span>
      </div>
      <p className={styles.desc}>{manifest.description}</p>
      <div className={styles.axes}>
        {Object.entries(manifest.props).map(([key, ctrl]) => (
          <span key={key} className={styles.axis}>
            {key}
            {ctrl.options ? `: ${ctrl.options.join(" | ")}` : ""}
          </span>
        ))}
      </div>
      <div className={styles.stage}>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowItems}>{children}</div>
    </div>
  );
}

export default function Gallery() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tile, setTile] = useState("phila");
  const [note, setNote] = useState("");

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>UI primitives</h1>

      <Section manifest={buttonManifest}>
        <Row label="hierarchy">
          <Button hierarchy="primary">Primary</Button>
          <Button hierarchy="secondary">Secondary</Button>
          <Button hierarchy="tertiary">Tertiary</Button>
          <div className={styles.inverseBed}>
            <Button hierarchy="inverse">Inverse</Button>
          </div>
        </Row>
        <Row label="tone (primary)">
          <Button tone="normal">Normal</Button>
          <Button tone="critical">Critical</Button>
          <Button tone="neutral">Neutral</Button>
        </Row>
        <Row label="size">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="icon">
          <Button icon={<Plus size={16} />}>Before</Button>
          <Button icon={<Plus size={16} />} iconPosition="after">
            After
          </Button>
          <Button icon={<Plus size={16} />} iconPosition="only" aria-label="Add" />
          <Button hierarchy="tertiary" icon={<Plus size={16} />}>
            Peanuts
          </Button>
        </Row>
        <Row label="state">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button href="#gallery">Link</Button>
        </Row>
      </Section>

      <Section manifest={cardManifest}>
        <Row label="elevation">
          <Card elevation="outlined">Outlined</Card>
          <Card elevation="raised">Raised</Card>
          <Card elevation="flat">Flat</Card>
        </Row>
        <Row label="state / tone">
          <Card selected>Selected</Card>
          <Card tone="critical">Critical</Card>
          <Card tone="ok">Ok</Card>
          <Card href="#gallery">Link card</Card>
        </Row>
      </Section>

      <Section manifest={tagManifest}>
        <Row label="tone">
          <Tag>Normal</Tag>
          <Tag tone="critical">Critical</Tag>
          <Tag tone="ok">Ok</Tag>
          <Tag tone="neutral">Neutral</Tag>
        </Row>
        <Row label="shape / size">
          <Tag shape="pill" size="sm">
            Pill sm
          </Tag>
          <Tag shape="pill">Pill md</Tag>
          <Tag icon={<Search size={12} />}>With icon</Tag>
        </Row>
        <Row label="interactive">
          <Tag onClick={() => {}}>Filter</Tag>
          <Tag selected onClick={() => {}}>
            Selected
          </Tag>
          <Tag removable onRemove={() => {}} icon={<Trash2 size={12} />}>
            Removable
          </Tag>
        </Row>
      </Section>

      <Section manifest={inputManifest}>
        <Row label="size">
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium" />
          <Input size="lg" placeholder="Large" />
        </Row>
        <Row label="state">
          <Input placeholder="Normal" />
          <Input invalid placeholder="Invalid" />
          <Input disabled placeholder="Disabled" />
          <Input icon={<Search size={16} />} placeholder="Search…" />
        </Row>
        <Row label="multiline">
          <Input multiline placeholder="Notes…" />
        </Row>
      </Section>

      <Section manifest={tabsManifest}>
        <Tabs
          tabs={[
            { id: "recipe", label: "Recipe", content: <p className={styles.tabDemo}>Recipe panel content stacks here.</p> },
            { id: "macros", label: "Macros", content: <p className={styles.tabDemo}>Macros panel content stacks here.</p> },
          ]}
        />
      </Section>

      <Section manifest={statManifest}>
        <Row label="tone">
          <Stat label="Scoopability" value="21" />
          <Stat label="Sweetness" value="21" tone="ok" />
          <Stat label="Overrun" value="18%" tone="critical" delta="−4" direction="down" />
        </Row>
      </Section>

      <Section manifest={calloutManifest}>
        <Row label="tone">
          <Callout icon={<Milk size={16} />}>Select ingredients for your milk base</Callout>
          <Callout tone="ok" title="Balanced">4 of 4 macros in range.</Callout>
          <Callout tone="critical" title="Can't hit that target">Lower the fat or raise the yield.</Callout>
        </Row>
      </Section>

      <Section manifest={modalManifest}>
        <Row label="placement">
          <Button hierarchy="secondary" onClick={() => setModalOpen(true)}>
            Open dialog
          </Button>
          <Button hierarchy="secondary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </Row>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Config"
          footer={
            <>
              <Button hierarchy="tertiary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Done</Button>
            </>
          }
        >
          <p className={styles.tabDemo}>Centered dialog body. Content stacks and scrolls.</p>
        </Modal>
        <Modal
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          placement="sheet"
          title="Pantry"
        >
          <Callout icon={<Milk size={16} />}>Select ingredients for your milk base</Callout>
          <p className={styles.tabDemo}>Drawer body.</p>
        </Modal>
      </Section>

      <h1 className={styles.title} style={{ marginTop: "var(--space-16)" }}>
        Molecules
      </h1>

      <Section manifest={sectionHeaderManifest}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <SectionHeader label="Ingredients" />
          <SectionHeader
            label="Composition"
            icon={<FlaskConical size={15} />}
            actions={
              <Button size="sm" hierarchy="tertiary" icon={<Plus size={14} />}>
                Add
              </Button>
            }
          />
        </div>
      </Section>

      <Section manifest={lineItemManifest}>
        <div style={{ width: "100%" }}>
          <LineItem
            label="Whole milk (3.6% fat)"
            note={<InlineNote value={note} onChange={setNote} />}
            trailing={<Input size="sm" defaultValue="635.5" style={{ width: 90 }} />}
          />
          <LineItem label="Sugar blend" trailing={<Input size="sm" defaultValue="150" style={{ width: 90 }} />} />
          <LineItem label="Sucrose" indent size="sm" trailing={<span className={styles.tabDemo}>120 g</span>} />
          <LineItem label="Glucose syrup" indent size="sm" trailing={<span className={styles.tabDemo}>30 g</span>} />
        </div>
      </Section>

      <Section manifest={inlineNoteManifest}>
        <InlineNote value={note} onChange={setNote} />
      </Section>

      <Section manifest={featureCardManifest}>
        <div className={styles.featureGrid}>
          <FeatureCard eyebrow="The Lab" title="Six sliders, one live recipe" icon={<FlaskConical size={20} />}>
            <p>Drag a macro and the grams re-solve underneath, in real time.</p>
          </FeatureCard>
          <FeatureCard eyebrow="Stocked Pantry" title="Every ingredient, weighed" href="#gallery">
            <p>Build a base from a searchable, category-filtered pantry.</p>
          </FeatureCard>
        </div>
      </Section>

      <Section manifest={selectableTileManifest}>
        <div className={styles.featureGrid}>
          <SelectableTile
            name="Philadelphia"
            blurb="Egg-free, clean and milky."
            icon={<Milk size={18} />}
            selected={tile === "phila"}
            onClick={() => setTile("phila")}
          />
          <SelectableTile
            name="French Custard"
            blurb="Egg-yolk rich, dense and smooth."
            icon={<FlaskConical size={18} />}
            selected={tile === "custard"}
            onClick={() => setTile("custard")}
          />
        </div>
      </Section>
    </main>
  );
}
