import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "InlineNote",
  tier: "molecule",
  description: "Pencil toggle that expands into a textarea — a per-row note for any line item.",
  props: {
    value: { control: "text", default: "" },
    placeholder: { control: "text", default: "Add a note" },
  },
};
