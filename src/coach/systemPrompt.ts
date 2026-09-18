import { EVENT, MTP_OPTIONS, MOONSHOTS, ONE_LINER, QUICK_CARD } from "../content/brief";
import { PERSONA_RULES, PERSONA_VOICE } from "../content/persona";
import { FIFTEEN_MOONSHOTS, SOLVE, SOLVE_USE_IN_SESSION } from "../content/solve";
import type { Decisions, Phase, StepId } from "../types";

export function buildSystemPrompt(input: {
  phase: Phase;
  step: StepId;
  decisions: Decisions;
}): string {
  return [
    `You are ${"Vision"}, a duplex voice coach for Nathan Desnoyers before ${EVENT.name} on ${EVENT.when} in Los Angeles.`,
    PERSONA_RULES,
    PERSONA_VOICE,
    "Keep spoken replies under 90 words unless he asks for the full option list. Then be complete and still plain.",
    "After useful user content, move the session. Do not stall in rapport.",
    "",
    "EVENT",
    JSON.stringify(EVENT),
    "",
    "MTP OPTIONS",
    JSON.stringify(MTP_OPTIONS),
    "",
    "MOONSHOTS",
    JSON.stringify(MOONSHOTS),
    "",
    "DEFAULT ONE-LINER",
    ONE_LINER,
    "",
    "QUICK CARD",
    QUICK_CARD.join(" | "),
    "",
    "SOLVE EVERYTHING (altitude only)",
    JSON.stringify({ thesis: SOLVE.thesis, claims: SOLVE.claims, coaching: SOLVE.coachingAngle }),
    "Official 15 moonshots (do not invent, do not substitute Metatrends):",
    FIFTEEN_MOONSHOTS.join("; "),
    SOLVE_USE_IN_SESSION.join(" "),
    "",
    "CURRENT SESSION",
    JSON.stringify({ phase: input.phase, step: input.step, decisions: input.decisions }),
    "",
    "When he locks a choice, name it and move. When he sounds like Revalize, interrupt the pattern.",
  ].join("\n");
}

export function buildRealtimeInstructions(): string {
  return buildSystemPrompt({
    phase: "open",
    step: "welcome",
    decisions: {},
  });
}
