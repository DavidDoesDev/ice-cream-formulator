import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "FeatureCard",
  tier: "molecule",
  description: "Marketing feature tile — eyebrow + title + body on a Card. Renders a link when href is set.",
  props: {
    title: { control: "text", default: "Six sliders, one live recipe" },
    eyebrow: { control: "text", default: "The Lab" },
    href: { control: "text", default: "" },
  },
  slots: { default: "Body copy" },
};
