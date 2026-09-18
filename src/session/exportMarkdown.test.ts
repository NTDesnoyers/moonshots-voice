import { describe, expect, it } from "vitest";
import { exportMarkdown } from "./exportMarkdown";
import { emptySession } from "./store";

describe("exportMarkdown", () => {
  it("writes locked decisions into a downloadable briefing", () => {
    const md = exportMarkdown({
      ...emptySession(),
      startedAt: Date.parse("2026-09-18T12:00:00Z"),
      decisions: {
        mtpPick: "opportunity-routing",
        mtpRanking: ["opportunity-routing", "relationship-infra", "dual-domain"],
        moonshotPick: "opportunity-os",
        reApply: "Weekly opportunity-flow ritual.",
        afsApply: "Lane A money-path.",
        oneLiner: "I operate in real estate and fleet sales.",
        successMetric: "1 build partner lead + locked MTP + 2 applies dated",
      },
      messages: [{ id: "1", role: "you", text: "Lock option 1.", at: 1 }],
    });

    expect(md).toMatch(/Moonshots Prep/);
    expect(md).toMatch(/Opportunity routing/);
    expect(md).toMatch(/Opportunity OS/);
    expect(md).toMatch(/Weekly opportunity-flow ritual/);
    expect(md).toMatch(/Lane A money-path/);
    expect(md).toMatch(/1 build partner lead/);
    expect(md).toMatch(/Personal MTP is not the AFS firm MTP/);
  });
});
