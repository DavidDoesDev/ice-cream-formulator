import type { EquipmentProfile } from "@/data/types";

// The equipment axis (D8). Each freezing/serving machine carries ONE number: a
// PAC-target offset relative to the home-dasher baseline, in the same units as
// PAC (sucrose-equivalent freeze-point depression as a fraction of the batch).
//
// home-dasher = 0 is the warmest/slowest freeze and serves softest, so it needs
// the most sugar to stay scoopable → it's the baseline the STYLE_TARGETS windows
// are calibrated to. Colder / harder-serving machines are negative: they set the
// mix harder, so a scoopable serve tolerates (and wants) LESS freeze-depression,
// which shifts the sugar/stabilizer windows down. Tuning a machine is one number.
export interface EquipmentInfo {
  label: string;
  blurb: string;
  pacOffset: number;
}

const PROFILES: Record<EquipmentProfile, EquipmentInfo> = {
  "home-dasher": {
    label: "Home churn",
    blurb: "Canister or frozen-bowl machine — the warmest, softest serve. The baseline.",
    pacOffset: 0,
  },
  creami: {
    label: "Ninja Creami",
    blurb: "Spin-frozen from a solid block — serves harder, so it needs less sugar.",
    pacOffset: -0.02,
  },
  pacojet: {
    label: "Pacojet",
    blurb: "Spin-frozen from a solid block — serves harder, so it needs less sugar.",
    pacOffset: -0.02,
  },
  "commercial-batch": {
    label: "Commercial batch",
    blurb: "Carpigiani-style batch freezer — coldest, fastest freeze; the least sugar.",
    pacOffset: -0.04,
  },
};

// Picker order: warmest (baseline) first, coldest last.
export const EQUIPMENT_ORDER: EquipmentProfile[] = [
  "home-dasher",
  "creami",
  "pacojet",
  "commercial-batch",
];

export function equipmentInfo(equipment: EquipmentProfile): EquipmentInfo {
  return PROFILES[equipment];
}

export function pacOffset(equipment: EquipmentProfile): number {
  return PROFILES[equipment].pacOffset;
}
