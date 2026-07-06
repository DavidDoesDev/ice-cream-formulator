import { ArchetypeTile } from "ice-cream-formulator";
import { ARCHETYPES } from "@/data/archetypes";

// A selectable starting-point card: a mini PintCup of the archetype's macro
// composition, its style tag, name, description, and headline fat/sugar stats.
// Real archetypes so the cup fill and stats are the app's actual values.
const byId = (id: string) => ARCHETYPES.find((a) => a.id === id)!;
const noop = () => {};

export const ClassicVanilla = () => <ArchetypeTile archetype={byId("philly-vanilla")} onClick={noop} />;
export const Pistachio = () => <ArchetypeTile archetype={byId("gelato-pistachio")} onClick={noop} />;
export const MangoSorbet = () => <ArchetypeTile archetype={byId("sorbet-mango")} onClick={noop} />;
export const RumRaisin = () => <ArchetypeTile archetype={byId("custard-rum-raisin")} onClick={noop} />;
