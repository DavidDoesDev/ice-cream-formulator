import { describe, it, expect } from "vitest";
import { pacOffset, equipmentInfo, coldestPacOffset, EQUIPMENT_ORDER } from "./equipment";
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
