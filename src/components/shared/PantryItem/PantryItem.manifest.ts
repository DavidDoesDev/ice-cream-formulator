import type { ComponentManifest } from "@/components/ui/manifest";

export const manifest: ComponentManifest = {
  name: "PantryItem",
  tier: "domain",
  description:
    "A pantry catalog card: name + description + a two-column mono macro-stat grid (fat/sugar/nfs · stabilizer/alcohol). The whole card is the add affordance. Shared by the Config drill-down and standalone Recipe-panel pantry.",
  props: {},
  preview: "collection",
};
