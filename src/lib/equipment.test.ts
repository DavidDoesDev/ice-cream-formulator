import { describe, it, expect } from "vitest";
import { pacOffset, equipmentInfo, EQUIPMENT_ORDER } from "./equipment";
import { DEFAULT_EQUIPMENT, type EquipmentProfile } from "@/data/types";

describe("equipment PAC offsets", () => {
  it("home-dasher is the zero baseline", () => {
    expect(pacOffset("home-dasher")).toBe(0);
    expect(DEFAULT_EQUIPMENT).toBe("home-dasher");
  });

  it("colder / harder-serving machines carry a negative offset (need less sugar)", () => {
    // Every non-baseline machine freezes colder or serves the block harder than a
    // home canister churn, so all sit below the baseline.
    expect(pacOffset("creami")).toBeLessThan(0);
    expect(pacOffset("pacojet")).toBeLessThan(0);
    expect(pacOffset("commercial-batch")).toBeLessThan(0);
  });

  it("orders from warmest (home-dasher) to coldest (commercial-batch)", () => {
    // commercial-batch is the coldest/fastest freeze → the most-negative offset.
    expect(pacOffset("commercial-batch")).toBeLessThan(pacOffset("creami"));
    expect(pacOffset("commercial-batch")).toBeLessThan(pacOffset("pacojet"));
  });

  it("treats creami and pacojet as the same spin-frozen-block family", () => {
    expect(pacOffset("creami")).toBe(pacOffset("pacojet"));
  });
});

describe("equipment display metadata", () => {
  it("gives every profile a label and a blurb", () => {
    const profiles: EquipmentProfile[] = ["home-dasher", "creami", "pacojet", "commercial-batch"];
    for (const p of profiles) {
      const info = equipmentInfo(p);
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.blurb.length).toBeGreaterThan(0);
    }
  });

  it("lists every profile once in the picker order, warmest first", () => {
    expect(EQUIPMENT_ORDER).toEqual(["home-dasher", "creami", "pacojet", "commercial-batch"]);
  });
});
