import {
  AGENDA,
  FILTER_QUESTION,
  GREEN_FLAGS,
  labelMoonshot,
  labelMtp,
  MOONSHOT_DECISION_ASK,
  MOONSHOTS,
  MTP_PICK_RULE,
  ONE_LINER,
  ONE_LINER_VARIANTS,
  QUESTIONS_TO_ASK,
  RED_FLAGS,
  WHO_TO_FIND,
} from "../content/brief";
import type { CoachTurn, Decisions, Phase, SessionState, StepId } from "../types";
import {
  defaultOneLiner,
  detectNav,
  extractFromUtterance,
  isRevalizeShaped,
  mergeDecisions,
  rankingSentence,
} from "./extract";

const PHASE_ORDER: Phase[] = ["open", "mtp", "moonshot", "network", "close"];

const STEP_ORDER: StepId[] = [
  "welcome",
  "ready",
  "rank",
  "litmus",
  "pick-mtp",
  "pick-moonshot",
  "applies",
  "liner",
  "flags",
  "day-map",
  "commit",
  "done",
];

export function openingLine(): string {
  return [
    "Nathan. Seven days out from Moonshots in LA. This is the bake-off, not a pep talk.",
    "Walk out with one MTP you can say ten times on Friday, one moonshot with dated RE and AFS applies, and a filter that makes Revalize-shaped seats obvious in thirty seconds.",
    "First: energy. How loaded are RE and AFS this week, and is any Revalize residue still pulling you toward safe-looking seats?",
  ].join(" ");
}

export function nextCoachTurn(session: SessionState, userText: string): CoachTurn {
  const text = userText.trim();
  const extracted = extractFromUtterance(text, session.decisions);
  const decisions = mergeDecisions(session.decisions, extracted);
  const nav = detectNav(text);
  const challenge = isRevalizeShaped(text);

  let phase = session.phase;
  let step = session.step;
  let completed = session.completed;

  if (nav === "back") {
    const prev = prevStep(step);
    step = prev.step;
    phase = prev.phase;
  } else if (nav === "repeat") {
    return {
      reply: repeatFor(step, decisions),
      phase,
      step,
      decisions,
      completed,
    };
  } else if (nav !== "advance") {
    const advanced = maybeAdvance(step, decisions, text);
    step = advanced.step;
    phase = advanced.phase;
    completed = advanced.completed;
  } else {
    const advanced = forceAdvance(step, decisions);
    step = advanced.step;
    phase = advanced.phase;
    completed = advanced.completed;
  }

  const reply = [challenge ? revalizeChallenge() : "", lineFor(step, decisions, text)]
    .filter(Boolean)
    .join(" ");

  return { reply, phase, step, decisions, completed, challenge };
}

function maybeAdvance(step: StepId, decisions: Decisions, text: string): {
  step: StepId;
  phase: Phase;
  completed: boolean;
} {
  switch (step) {
    case "welcome":
      return toStep(text.length > 8 ? "ready" : "welcome");
    case "ready":
      return toStep(text.length > 2 ? "rank" : "ready");
    case "rank":
      return toStep(decisions.mtpRanking?.length ? "litmus" : "rank");
    case "litmus":
      return toStep(decisions.mtpLitmusNotes || text.length > 20 ? "pick-mtp" : "litmus");
    case "pick-mtp":
      return toStep(decisions.mtpPick ? "pick-moonshot" : "pick-mtp");
    case "pick-moonshot":
      return toStep(decisions.moonshotPick ? "applies" : "pick-moonshot");
    case "applies":
      return toStep(decisions.reApply && decisions.afsApply ? "liner" : "applies");
    case "liner":
      return toStep(decisions.oneLiner ? "flags" : "liner");
    case "flags":
      return toStep(text.length > 8 ? "day-map" : "flags");
    case "day-map":
      return toStep(decisions.dayPriorities || decisions.questionsToAsk || text.length > 16 ? "commit" : "day-map");
    case "commit":
      return toStep(decisions.successMetric || text.length > 10 ? "done" : "commit");
    default:
      return toStep("done");
  }
}

function forceAdvance(step: StepId, decisions: Decisions): {
  step: StepId;
  phase: Phase;
  completed: boolean;
} {
  if (step === "liner" && !decisions.oneLiner) {
    decisions.oneLiner = defaultOneLiner();
  }
  const index = STEP_ORDER.indexOf(step);
  const next = STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)];
  return toStep(next);
}

function toStep(step: StepId): { step: StepId; phase: Phase; completed: boolean } {
  return { step, phase: phaseFor(step), completed: step === "done" };
}

export function phaseFor(step: StepId): Phase {
  if (step === "welcome" || step === "ready") return "open";
  if (step === "rank" || step === "litmus" || step === "pick-mtp") return "mtp";
  if (step === "pick-moonshot" || step === "applies") return "moonshot";
  if (step === "liner" || step === "flags") return "network";
  return "close";
}

function prevStep(step: StepId): { step: StepId; phase: Phase } {
  const index = STEP_ORDER.indexOf(step);
  const prev = STEP_ORDER[Math.max(0, index - 1)];
  return { step: prev, phase: phaseFor(prev) };
}

function revalizeChallenge(): string {
  return "Stop. That sentence has Revalize shape: enablement theater, weak customer contact, or prestige over craft. You already know how that seat ends. Keep the filter tight.";
}

function lineFor(step: StepId, decisions: Decisions, lastUser: string): string {
  switch (step) {
    case "welcome":
      return openingLine();
    case "ready":
      return [
        lastUser.length > 12 ? "Noted. We will not optimize for looking legitimate to people who already misread you." : "Good.",
        `Hour map: ${AGENDA.map((block) => `${block.title}`).join(", ")}.`,
        "Ready to rank the three MTP drafts out loud?",
      ].join(" ");
    case "rank":
      return [
        "Three drafts. Option 1, opportunity routing: rewire how opportunity finds the right humans.",
        "Option 2, relationship infrastructure: memory, trust, and timing as the layer.",
        "Option 3, dual-domain operator: RE and fleet as labs, then export the pattern. That one is speculative framing.",
        MTP_PICK_RULE,
        "Rank them 1 to 3 by gut. No polishing yet.",
      ].join(" ");
    case "litmus":
      return [
        decisions.mtpRanking?.length ? `Ranking locked: ${rankingSentence(decisions.mtpRanking)}.` : "I heard a lean. Hold it.",
        "Litmus, out loud. Endorsement: would you green-light a day that moves qualified opportunity, or are you about to praise clever tooling?",
        "Refusal: say what you will not take. Internal enablement, feature factory, walls from customers.",
        "Identity: do you stay because judgment on who gets what shot is the work?",
      ].join(" ");
    case "pick-mtp":
      return [
        "Personal MTP is not the AFS firm MTP. Buses, trust, speed stay under Ramzi. RE and AFS are labs.",
        "Pick the working number one. Summit day you say that one ten times. Sunday you may revise. Not at the reception.",
      ].join(" ");
    case "pick-moonshot":
      return [
        decisions.mtpPick ? `${labelMtp(decisions.mtpPick)} is the working MTP.` : "We can still pick a moonshot while the MTP settles.",
        ...MOONSHOTS.map(
          (item) =>
            `Moonshot ${item.option}, ${item.title}: ${item.tenYear}${item.speculative ? " Speculative product path." : ""}`,
        ),
        MOONSHOT_DECISION_ASK,
      ].join(" ");
    case "applies":
      return [
        decisions.moonshotPick ? `${labelMoonshot(decisions.moonshotPick)} it is.` : "Pick still soft. Applies will tell us if it is real.",
        "Now the part that keeps this from becoming inspiration tourism.",
        "Give me one RE apply in verbs and a metric, and one AFS apply in verbs and a metric. Both dated inside 90 days.",
        decisions.moonshotPick === "opportunity-os"
          ? "Default from the brief: RE weekly opportunity-flow ritual. AFS Lane A money-path with less reconciliation tax."
          : decisions.moonshotPick === "ai-native-ninja"
            ? "Default from the brief: RE morning-on afternoon-in cadence, one public artifact. AFS Fiduciary Wedge, draft versus decide, no forked firm MTP."
            : "Default from the brief: RE five power users on one narrow workflow. AFS same patterns, separate data planes.",
      ].join(" ");
    case "liner":
      return [
        "Network kit. Thirty seconds, then we cut it.",
        `Working one-liner: ${ONE_LINER}`,
        `Toward Salim: ${ONE_LINER_VARIANTS.exo}`,
        `Toward Diamandis: ${ONE_LINER_VARIANTS.abundance}`,
        `Toward XPRIZE builders: ${ONE_LINER_VARIANTS.xprize}`,
        "Say the thirty-second version in your mouth. Then a fifteen-second cut.",
      ].join(" ");
    case "flags":
      return [
        decisions.oneLiner ? "One-liner is on the card." : "If you want the brief version, say lock the default.",
        `Green flags: ${GREEN_FLAGS.slice(0, 3).join(" ")}`,
        `Red flags: ${RED_FLAGS.slice(0, 3).join(" ")}`,
        `Always: ${FILTER_QUESTION}`,
        "Tell me one green you will pursue and one red you will walk from, in your words.",
      ].join(" ");
    case "day-map":
      return [
        "Day map. Do not optimize for famous names. Optimize for three deep conversations.",
        `Priority find: ${WHO_TO_FIND[0].who}. Then ${WHO_TO_FIND[1].who}.`,
        `Two questions worth stealing: ${QUESTIONS_TO_ASK[0]} ${QUESTIONS_TO_ASK[1]}`,
        "Who do you actually want, and which two questions will you ask?",
      ].join(" ");
    case "commit":
      return [
        "Last lock. Success metric for Sep 25. Example from the brief: one build-partner lead, locked MTP, two applies dated.",
        "Also dump anything still open: ticket tier, travel, public versus quiet, memryOS in the room, AFS mention rights.",
        "When you are done I write the card and you can download the markdown.",
      ].join(" ");
    case "done":
      return [
        "Card is written. MTP, moonshot, applies, one-liner, filter, day map.",
        "Say the MTP out loud once more before you close the laptop. Sunday, thirty minutes, debrief. I do not invent follow-up that is not in this session.",
        "Download the notes. If a line feels pretty instead of true, change it now.",
      ].join(" ");
  }
}

function repeatFor(step: StepId, decisions: Decisions): string {
  return `Again, without the extra. ${lineFor(step, decisions, "")}`;
}

export function phaseIndex(phase: Phase): number {
  return PHASE_ORDER.indexOf(phase);
}
