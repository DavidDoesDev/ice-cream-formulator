import { PintCup } from "ice-cream-formulator";
import { ARCHETYPES } from "@/data/archetypes";

// The PintCup fills a 16oz container with the formula's macro composition,
// bottom-to-top, with a living waterline. Fed here from real archetype ratios so
// the layer proportions and colors are the ones the app actually renders.
const byId = (id: string) => ARCHETYPES.find((a) => a.id === id)!.ratios;

export const Vanilla = () => <PintCup ratios={byId("philly-vanilla")} width={180} />;
export const Chocolate = () => <PintCup ratios={byId("custard-chocolate")} width={180} />;
export const MangoSorbet = () => <PintCup ratios={byId("sorbet-mango")} width={180} />;
export const Mini = () => <PintCup ratios={byId("gelato-pistachio")} size="mini" />;
