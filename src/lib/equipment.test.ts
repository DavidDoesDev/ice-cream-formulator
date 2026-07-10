import { describe, it, expect } from "vitest";
import { pacOffset, equipmentInfo, coldestPacOffset, normalizeEquipment, EQUIPMENT_ORDER } from "./equipment";
import { DEFAULT_EQUIPMENT, type EquipmentProfile } from "@/data/types";

describe("equipment PAC offsets", () => {
  it("home-dasher is the zero baseline", () => {
    expect(pacOffset("home-dasher")).toBe(0);
    expect(DEFAULT_EQUIPMENT).toBe("home-dasher");
  });

  it("colder / harder-serving machines carry a negative offset (need less sugar)", () => {
    // Every non-baseline machine freezes colder or serves the block harder than a
    // home canister churn, so all sit below the baseline.
    expect(pacOffset("spin-frozen")).toBeLessThan(0);
    expect(pacOffset("commercial-batch")).toBeLessThan(0);
  });

  it("orders from warmest (home-dasher) to coldest (commercial-batch)", () => {
    // commercial-batch is the coldest/fastest freeze → the most-negative offset.
    expect(pacOffset("commercial-batch")).toBeLessThan(pacOffset("spin-frozen"));
    expect(pacOffset("spin-frozen")).toBeLessThan(pacOffset("home-dasher"));
  });

  it("reports the coldest (most-negative) offset across all machines", () => {
    expect(coldestPacOffset()).toBe(pacOffset("commercial-batch"));
    expect(coldestPacOffset()).toBeLessThan(0);
  });
});

describe("equipment display metadata", () => {
  it("gives every profile a label and a blurb", () => {
    const profiles: EquipmentProfile[] = ["home-dasher", "spin-frozen", "commercial-batch"];
    for (const p of profiles) {
      const info = equipmentInfo(p);
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.blurb.length).toBeGreaterThan(0);
    }
  });

  it("names the spin-frozen family generically but cites its example machines", () => {
    const { label, blurb } = equipmentInfo("spin-frozen");
    expect(label.toLowerCase()).not.toContain("creami"); // generic label…
    expect(blurb).toContain("Creami"); // …examples live in the blurb
    expect(blurb).toContain("Pacojet");
  });

  it("lists every profile once in the picker order, warmest first", () => {
    expect(EQUIPMENT_ORDER).toEqual(["home-dasher", "spin-frozen", "commercial-batch"]);
  });
});

describe("legacy / unknown equipment values", () => {
  it("falls back to the default for a value no longer in the enum", () => {
    // A formula persisted under the pre-merge enum must not crash the lookups.
    expect(normalizeEquipment("creami")).toBe(DEFAULT_EQUIPMENT);
    expect(normalizeEquipment("pacojet")).toBe(DEFAULT_EQUIPMENT);
    expect(normalizeEquipment(undefined)).toBe(DEFAULT_EQUIPMENT);
  });

  it("keeps a valid value unchanged", () => {
    expect(normalizeEquipment("spin-frozen")).toBe("spin-frozen");
  });

  it("resolves lookups for a legacy value instead of throwing", () => {
    expect(() => pacOffset("creami" as EquipmentProfile)).not.toThrow();
    expect(pacOffset("creami" as EquipmentProfile)).toBe(pacOffset(DEFAULT_EQUIPMENT));
    expect(equipmentInfo("pacojet" as EquipmentProfile).label).toBe(equipmentInfo(DEFAULT_EQUIPMENT).label);
  });
});
