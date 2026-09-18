import { describe, expect, it } from "vitest";
import {
  detectMoonshot,
  detectMtpMentions,
  extractApplies,
  extractFromUtterance,
  isRevalizeShaped,
  parseRanking,
} from "./extract";

describe("extract", () => {
  it("ranks MTP options from spoken order", () => {
    expect(parseRanking("one opportunity routing, two relationship infrastructure, three dual-domain")).toEqual([
      "opportunity-routing",
      "relationship-infra",
      "dual-domain",
    ]);
    expect(parseRanking("1, 2, 3")).toEqual(["opportunity-routing", "relationship-infra", "dual-domain"]);
  });

  it("detects MTP and moonshot aliases", () => {
    expect(detectMtpMentions("lock option 1")).toEqual(["opportunity-routing"]);
    expect(detectMoonshot("I want the ninja franchise-of-one")).toBe("ai-native-ninja");
    expect(detectMoonshot("build-partner with a technical cofounder")).toBe("build-partner");
  });

  it("splits RE and AFS applies", () => {
    const applies = extractApplies(
      "RE: weekly opportunity flow ritual with intros logged. AFS: Lane A deal kit into Ramzi gate.",
    );
    expect(applies.reApply).toMatch(/weekly opportunity/i);
    expect(applies.afsApply).toMatch(/Lane A/i);
  });

  it("flags Revalize-shaped language", () => {
    expect(isRevalizeShaped("maybe an internal enablement seat at a PE-backed company")).toBe(true);
    expect(isRevalizeShaped("I want BD ownership next to the customer")).toBe(false);
  });

  it("captures energy on the open", () => {
    const patch = extractFromUtterance(
      "Energy is clear. AFS is heavy this week. Revalize residue is the urge to look legitimate.",
      {},
    );
    expect(patch.energy).toBeTruthy();
    expect(patch.revalizeResidue).toBeTruthy();
  });
});
