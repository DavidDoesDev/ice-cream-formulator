import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "SelectableTile",
  tier: "molecule",
  description: "Pickable tile — icon + name + blurb with a selected state. Config recipe-type / equipment grids.",
  props: {
    name: { control: "text", default: "Philadelphia" },
    blurb: { control: "text", default: "Egg-free, clean and milky." },
    selected: { control: "boolean", default: false },
    disabled: { control: "boolean", default: false },
  },
};
