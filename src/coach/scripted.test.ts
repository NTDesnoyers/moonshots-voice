import { describe, expect, it } from "vitest";
import { emptySession } from "../session/store";
import { nextCoachTurn, openingLine, phaseFor } from "./scripted";
import type { SessionState } from "../types";

function play(session: SessionState, text: string): SessionState {
  const turn = nextCoachTurn(session, text);
  return {
    ...session,
    phase: turn.phase,
    step: turn.step,
    decisions: turn.decisions,
    completed: turn.completed,
    messages: [
      ...session.messages,
      { id: `u-${session.messages.length}`, role: "you", text, at: 1 },
      { id: `c-${session.messages.length}`, role: "coach", text: turn.reply, at: 2 },
    ],
  };
}

describe("scripted coach", () => {
  it("opens in Nathan's voice, not a help-desk greeting", () => {
    const line = openingLine();
    expect(line.startsWith("Nathan.")).toBe(true);
    expect(line.toLowerCase()).not.toMatch(/hope you/i);
    expect(line).not.toContain("—");
  });

  it("walks the full agenda and locks exportable decisions", () => {
    let session: SessionState = { ...emptySession(), startedAt: Date.now() };
    expect(phaseFor(session.step)).toBe("open");

    session = play(
      session,
      "Energy is clear. AFS is heavy. Revalize residue is the urge to take a safe-looking seat.",
    );
    expect(session.step).toBe("ready");
    expect(session.decisions.energy).toBeTruthy();

    session = play(session, "Ready.");
    expect(session.phase).toBe("mtp");
    expect(session.step).toBe("rank");

    session = play(session, "One opportunity routing, two relationship infrastructure, three dual-domain.");
    expect(session.decisions.mtpRanking?.[0]).toBe("opportunity-routing");
    expect(session.step).toBe("litmus");

    session = play(
      session,
      "I refuse another enablement seat. Identity is judgment on who gets what shot, not silent IC.",
    );
    expect(session.step).toBe("pick-mtp");

    session = play(session, "Lock option 1 opportunity routing as the working MTP.");
    expect(session.decisions.mtpPick).toBe("opportunity-routing");
    expect(session.phase).toBe("moonshot");

    session = play(
      session,
      "Moonshot 1 Opportunity OS. That makes a Revalize-shaped offer obviously wrong in thirty seconds.",
    );
    expect(session.decisions.moonshotPick).toBe("opportunity-os");
    expect(session.step).toBe("applies");

    session = play(
      session,
      "RE: weekly opportunity flow ritual, intros logged, next action owned. AFS: Lane A Hot Warm to deal kit to Ramzi with less glue.",
    );
    expect(session.decisions.reApply).toMatch(/opportunity flow/i);
    expect(session.decisions.afsApply).toMatch(/Lane A/i);
    expect(session.phase).toBe("network");

    session = play(
      session,
      "I operate in real estate and fleet sales while building AI that rewires how opportunity flows. I want a BD partner, not another pure IC.",
    );
    expect(session.decisions.oneLiner).toBeTruthy();
    expect(session.step).toBe("flags");

    session = play(session, "Green flag is a founder seat with customer contact. Red flag is enablement theater. I will use the filter question.");
    expect(session.phase).toBe("close");

    session = play(
      session,
      "Priority is Salim and ExO people, then Diamandis orbit. I will ask where opportunity gets stuck and what they refuse to build.",
    );
    expect(session.decisions.dayPriorities).toBeTruthy();

    session = play(session, "Success metric is one build partner lead, locked MTP, two applies dated.");
    expect(session.completed).toBe(true);
    expect(session.step).toBe("done");
    expect(session.decisions.successMetric).toMatch(/build partner/i);
    expect(session.decisions.mtpPick).toBe("opportunity-routing");
    expect(session.decisions.moonshotPick).toBe("opportunity-os");
  });

  it("challenges Revalize-shaped seats without leaving the brief", () => {
    const session = play(
      { ...emptySession(), startedAt: 1, phase: "network", step: "flags" },
      "Maybe I should take a prestige PE-backed enablement seat to look serious.",
    );
    const last = session.messages.at(-1)?.text ?? "";
    expect(last).toMatch(/Revalize/i);
    expect(last).not.toContain("—");
  });
});
