import type { Archetype, StyleCategory, FatTier, SugarSystem } from "@/data/types";
import { ARCHETYPES } from "@/data/archetypes";

export interface MatchMetadata {
  archetypeId: string;
  score: number;
  confidence: "high" | "medium" | "low";
  matchedStyle: boolean;
  matchedFatTier: boolean;
  matchedSugarSystem: boolean;
  matchedTextures: string[];
  matchedInclusions: string[];
  userQuery: string;
}

export interface MatchResult {
  archetype: Archetype;
  metadata: MatchMetadata;
}

const STYLE_KEYWORDS: [string, StyleCategory][] = [
  ["philadelphia", "philadelphia"],
  ["philly", "philadelphia"],
  ["american style", "philadelphia"],
  ["no egg", "philadelphia"],
  ["no-egg", "philadelphia"],
  ["custard", "custard"],
  ["french", "custard"],
  ["egg yolk", "custard"],
  ["gelato", "gelato"],
  ["italian", "gelato"],
  ["sorbet", "sorbet"],
  ["sherbet", "sherbet"],
  ["vegan", "vegan"],
  ["plant-based", "vegan"],
  ["plant based", "vegan"],
  ["dairy-free", "vegan"],
  ["dairy free", "vegan"],
  ["non-dairy", "vegan"],
];

const FAT_TIER_KEYWORDS: [string, FatTier | FatTier[]][] = [
  ["lean", "lean"],
  ["light", "lean"],
  ["low fat", "lean"],
  ["low-fat", "lean"],
  ["diet", "lean"],
  ["lite", "lean"],
  ["high protein", "lean"],
  ["protein", "lean"],
  ["ultra rich", "ultra-rich"],
  ["ultra-rich", "ultra-rich"],
  ["very rich", "ultra-rich"],
  ["decadent", "ultra-rich"],
  ["luxurious", "ultra-rich"],
  ["extra rich", "ultra-rich"],
  ["indulgent", ["rich", "ultra-rich"]],
  ["rich", ["rich", "ultra-rich"]],
  ["creamy", ["rich", "ultra-rich"]],
  ["full fat", "rich"],
  ["full-fat", "rich"],
  ["medium", "medium"],
  ["moderate", "medium"],
];

const SUGAR_SYSTEM_KEYWORDS: [string, SugarSystem][] = [
  ["invert sugar", "invert"],
  ["invert", "invert"],
  ["honey", "natural"],
  ["maple", "natural"],
  ["natural sweetener", "natural"],
  ["dextrose", "blended"],
  ["soft scoop", "blended"],
  ["cane sugar", "sucrose"],
  ["sucrose", "sucrose"],
];

// Collect all unique textures and inclusions from the corpus
const CORPUS_TEXTURES = new Set<string>();
const CORPUS_INCLUSIONS = new Set<string>();

for (const a of ARCHETYPES) {
  for (const t of a.attributes.texture) CORPUS_TEXTURES.add(t);
  for (const i of a.attributes.inclusions) CORPUS_INCLUSIONS.add(i);
}

// Sort multi-word inclusions first so "passion fruit" matches before "fruit"
const SORTED_INCLUSIONS = [...CORPUS_INCLUSIONS].sort((a, b) => b.length - a.length);

interface ParsedSignals {
  styles: Set<StyleCategory>;
  fatTiers: Set<FatTier>;
  sugarSystems: Set<SugarSystem>;
  textures: Set<string>;
  inclusions: Set<string>;
}

function parseQuery(query: string): ParsedSignals {
  const q = query.toLowerCase().trim();
  const styles = new Set<StyleCategory>();
  const fatTiers = new Set<FatTier>();
  const sugarSystems = new Set<SugarSystem>();
  const textures = new Set<string>();
  const inclusions = new Set<string>();

  for (const [kw, style] of STYLE_KEYWORDS) {
    if (q.includes(kw)) styles.add(style);
  }

  for (const [kw, tier] of FAT_TIER_KEYWORDS) {
    if (q.includes(kw)) {
      if (Array.isArray(tier)) tier.forEach((t) => fatTiers.add(t));
      else fatTiers.add(tier);
    }
  }

  for (const [kw, sys] of SUGAR_SYSTEM_KEYWORDS) {
    if (q.includes(kw)) sugarSystems.add(sys);
  }

  for (const texture of CORPUS_TEXTURES) {
    if (q.includes(texture)) textures.add(texture);
  }

  for (const inc of SORTED_INCLUSIONS) {
    if (q.includes(inc)) inclusions.add(inc);
  }

  return { styles, fatTiers, sugarSystems, textures, inclusions };
}

const WEIGHTS = { style: 5, inclusion: 3, fatTier: 2, texture: 1, sugarSystem: 1 };

function computeScore(archetype: Archetype, signals: ParsedSignals) {
  let raw = 0;
  const matchedTextures: string[] = [];
  const matchedInclusions: string[] = [];

  const matchedStyle = signals.styles.has(archetype.style);
  if (matchedStyle) raw += WEIGHTS.style;

  const matchedFatTier = signals.fatTiers.has(archetype.attributes.fatTier);
  if (matchedFatTier) raw += WEIGHTS.fatTier;

  const matchedSugarSystem = signals.sugarSystems.has(archetype.attributes.sugarSystem);
  if (matchedSugarSystem) raw += WEIGHTS.sugarSystem;

  for (const t of archetype.attributes.texture) {
    if (signals.textures.has(t)) {
      matchedTextures.push(t);
      raw += WEIGHTS.texture;
    }
  }

  for (const inc of archetype.attributes.inclusions) {
    if (signals.inclusions.has(inc)) {
      matchedInclusions.push(inc);
      raw += WEIGHTS.inclusion;
    }
  }

  return { raw, matchedStyle, matchedFatTier, matchedSugarSystem, matchedTextures, matchedInclusions };
}

function deriveConfidence(
  matchedStyle: boolean,
  matchedFatTier: boolean,
  matchedTextures: string[],
  matchedInclusions: string[]
): "high" | "medium" | "low" {
  if (matchedStyle || matchedInclusions.length >= 2) return "high";
  if (matchedInclusions.length >= 1 || matchedTextures.length >= 2 || matchedFatTier) return "medium";
  return "low";
}

export function matchTemplate(
  query: string,
  archetypes: Archetype[] = ARCHETYPES
): MatchResult[] {
  if (archetypes.length === 0) return [];

  const signals = parseQuery(query);
  const scored = archetypes.map((archetype) => {
    const { raw, ...rest } = computeScore(archetype, signals);
    return { archetype, raw, ...rest };
  });

  const maxRaw = Math.max(...scored.map((s) => s.raw), 1);

  return scored
    .map(({ archetype, raw, matchedStyle, matchedFatTier, matchedSugarSystem, matchedTextures, matchedInclusions }) => ({
      archetype,
      metadata: {
        archetypeId: archetype.id,
        score: raw / maxRaw,
        confidence: deriveConfidence(matchedStyle, matchedFatTier, matchedTextures, matchedInclusions),
        matchedStyle,
        matchedFatTier,
        matchedSugarSystem,
        matchedTextures,
        matchedInclusions,
        userQuery: query,
      } satisfies MatchMetadata,
    }))
    .sort((a, b) => {
      if (b.metadata.score !== a.metadata.score) return b.metadata.score - a.metadata.score;
      return a.archetype.name.localeCompare(b.archetype.name);
    });
}
