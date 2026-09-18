import type { AgendaBlock, MoonshotId, MtpId } from "../types";

export const EVENT = {
  name: "Moonshots LIVE / Moonshots Summit",
  when: "Fri Sep 25, 2026",
  window: "about 7:00 AM to 10:00 PM PT (some listings say 8 AM start)",
  where: "Los Angeles — restored 1920s movie palace, evening reception nearby",
  scale: "~1,500 (about 1,000 GA / 200 VIP / 300 faculty)",
  hosts: "Peter Diamandis + Moonshots Mates (Salim Ismail, Alex Wissner-Gross, Dave Blundin, Emad Mostaque, and others)",
  format: "Full-day program + attendee-led unconference + evening reception; XPRIZE stages: Build with Gemini and Future Vision",
  daysOutNote: "Coaching target: 60 to 90 minutes, ideally 3 to 7 days before the summit",
};

export const CONTEXT = {
  mtpDirection: "Rewiring how opportunity flows to unlock abundance",
  seatToday: "Dual operator: RE still + AFS seat. AI builder (memryOS) as proof, not a full-time product job.",
  strengths:
    "Relationships, Ninja Selling, dual RE+AFS operator, sales/BD energy, AI builder. Not pure IC eng.",
  odyssey:
    "Plan A: AI-Native Ninja with RE funding. Plan B: FDE. Plan C: ship memryOS. Landed in AFS + RE still.",
  failedForay:
    "Revalize W-2 AI Enablement. Fired. Not the right fit. Do not re-optimize for PE SaaS internal-enablement IC seats.",
  summitGoals: [
    "Solidify MTP",
    "Pick personal moonshot",
    "Apply to RE + AFS",
    "Network for a BD / relationship-tech role or a build partner",
  ],
};

export const AGENDA: AgendaBlock[] = [
  {
    id: "open",
    minutes: "0–10",
    title: "Warm open",
    output: "Energy, Revalize residue, AFS/RE load",
  },
  {
    id: "mtp",
    minutes: "10–30",
    title: "MTP bake-off",
    output: "Rank options 1–3, run litmus, pick working #1",
  },
  {
    id: "moonshot",
    minutes: "30–50",
    title: "Moonshot + applies",
    output: "One 10y shot, dated RE apply, dated AFS apply",
  },
  {
    id: "network",
    minutes: "50–65",
    title: "Network kit",
    output: "One-liner, 60/15 cuts, green/red flags",
  },
  {
    id: "close",
    minutes: "65–90",
    title: "Day map + lock",
    output: "Priorities, two questions, success metric, export",
  },
];

export interface MtpOption {
  id: MtpId;
  option: number;
  title: string;
  statement: string;
  endorsement: string;
  refusal: string;
  identity: string;
  failIf: string;
  disqualifiers?: string;
  speculative?: boolean;
}

export const MTP_OPTIONS: MtpOption[] = [
  {
    id: "opportunity-routing",
    option: 1,
    title: "Opportunity routing",
    statement:
      "Rewire how opportunity finds the right humans so talent, capital, and customers compound into abundance instead of sitting trapped in networks and inboxes.",
    endorsement:
      "A day's work that increases flow of qualified opportunity to people you care about: buyers, sellers, partners.",
    refusal:
      "Another internal enablement seat, pure feature factory, AI for AI's sake, roles that wall you from customers.",
    identity:
      "Stay because judgment on who gets what shot is the work. Leave if you are reduced to ticket-closer or silent IC.",
    failIf: "Clever tooling with no opportunity moved. Prestige, stability, or AI branding as the reason you take the seat.",
    disqualifiers: "PE ops theater. AI team of 3 with no customer. Roles that punish relationship-first operators.",
  },
  {
    id: "relationship-infra",
    option: 2,
    title: "Relationship infrastructure",
    statement:
      "Build the relationship layer that turns weak ties into compounding opportunity. Memory, trust, and timing as infrastructure for abundance.",
    endorsement:
      "Work that makes follow-through and intro quality measurably better. memryOS-class, Cloze-class, Ninja cadence.",
    refusal: "Surveillance-y growth hacks, spray outreach, tools that replace judgment instead of amplifying it.",
    identity: "You are the person who connects and remembers, not the person who only ships pipes.",
    failIf: "CRM busywork with no deal or relationship outcome. More sequences without trust or timing.",
  },
  {
    id: "dual-domain",
    option: 3,
    title: "Dual-domain operator to abundance OS",
    statement:
      "Prove that a high-agency operator with AI can unlock abundance across markets, starting where you already have skin (RE + fleet) and exporting the pattern.",
    endorsement: "RE and AFS each get a visible apply this quarter from summit learning.",
    refusal: "Abandoning both domains for a random W-2 that does not use relationship plus AI leverage.",
    identity: "Dual-domain is a feature (pattern recognition), not unfocused.",
    failIf: "Summit becomes inspiration tourism. You need a single-industry badge to feel legitimate.",
    speculative: true,
  },
];

export const MTP_PICK_RULE =
  "Rank 1 to 3 by gut plus litmus. Summit day: say one out loud ten times. Revise once Sunday after, not mid-reception.";

export interface MoonshotOption {
  id: MoonshotId;
  option: number;
  title: string;
  tenYear: string;
  reApply: string;
  reMetric: string;
  afsApply: string;
  afsMetric: string;
  speculative?: boolean;
}

export const MOONSHOTS: MoonshotOption[] = [
  {
    id: "opportunity-os",
    option: 1,
    title: "Opportunity OS",
    tenYear:
      "Become the default opportunity-routing layer for high-trust local markets (RE + specialty vehicle + adjacent), where intros, timing, and memory compound.",
    reApply:
      "Ninja-native weekly opportunity-flow ritual. Warm intros logged, next action owned, AI draft only after human intent.",
    reMetric: "Number of opportunities advanced past first touch per week.",
    afsApply: "Lane A money-path: Hot/Warm to deal kit to Ramzi gate with less reconciliation tax.",
    afsMetric: "Hours on live buyer/seller vs system glue. Target: shift at least one day per week equivalent.",
  },
  {
    id: "ai-native-ninja",
    option: 2,
    title: "AI-Native Ninja franchise-of-one",
    tenYear:
      "A portable operator model: relationship craft plus AI agents plus domain skin-in-game that out-earns and out-learns a mid-tier FDE seat without becoming pure IC eng.",
    reApply:
      "Document the morning on / afternoon in cadence with agent assists (draft-never-send). Ship one public artifact that is not confidential.",
    reMetric: "Cadence written down. One public playbook snippet or Loom.",
    afsApply:
      "Codify the Fiduciary Wedge: what agents may draft vs what Nathan or Ramzi alone decide. Align with Exo Direct Mode. Do not fork the firm MTP.",
    afsMetric: "Written draft-vs-decide rules in use on live deals.",
  },
  {
    id: "build-partner",
    option: 3,
    title: "Build-partner path",
    tenYear:
      "Co-build a relationship-intelligence product with a complementary technical co-founder. You own BD, narrative, domain design, GTM.",
    reApply:
      "Dogfood: 5 power users in the RE network on a narrow workflow (follow-ups / intro memory). Kill vanity metrics.",
    reMetric: "Five real users. One narrow workflow. No vanity counts.",
    afsApply:
      "Same stack patterns (CRM hygiene, deal memory) with separate data planes. No AFS and RE mix. Learn generic vs domain-specific workflows.",
    afsMetric: "Clear list of generic vs domain-specific workflows. Data planes stay separate.",
    speculative: true,
  },
];

export const MOONSHOT_DECISION_ASK =
  "Which moonshot, if chosen, would make Revalize-shaped offers obviously wrong within 30 seconds?";

export const ONE_LINER =
  "I operate in real estate and fleet sales while building AI that rewires how opportunity flows. Relationships and judgment first, agents as leverage. I am here to sharpen my moonshot and meet builders who need a BD / relationship-tech partner, not another pure IC.";

export const ONE_LINER_VARIANTS = {
  exo: "Applying ExO / rewrite thinking inside a tiny Direct Mode dealership and my RE practice.",
  abundance: "Obsessed with abundance via opportunity flow, not hype slides.",
  xprize: "I ship operator tools. Looking for technical co-builders who want domain plus distribution.",
};

export const GREEN_FLAGS = [
  "Customer / market adjacency. You touch deals, partners, narrative.",
  "BD, GTM, forward-deployed with relationship ownership, not a ticket queue.",
  "Founder / small team where judgment has consequence.",
  "Explicit respect for dual-domain operator plus AI builder proof (memryOS as credential).",
  "Build-partner language: co-create, equity or clear upside, complementary skills.",
  "ExO / abundance / incentive-prize energy that still demands shipping.",
];

export const RED_FLAGS = [
  "Internal AI enablement for PE-backed mid-market SaaS with weak customer contact.",
  "We're still figuring out governance/ROI as the whole job for 12 months.",
  "Prestige, hybrid, or commute as the selling points over craft fit.",
  "Pure IC eng identity required. Sales/BD energy treated as a liability.",
  "IP ambiguity on side projects. Carve-outs fuzzy.",
  "Sold as FDE or path-to-founder but scoped as internal tooling forever.",
  "Culture that needs fear or pressure to perform. You run on stability into high agency.",
];

export const FILTER_QUESTION =
  "Will this seat increase my surface area on opportunity flow, or bury me in enablement theater?";

export const WHO_TO_FIND = [
  {
    priority: 1,
    who: "Salim Ismail / ExO-adjacent attendees",
    why: "MTP-as-protocol, Direct Mode, rewrite language already in use at AFS",
  },
  {
    priority: 2,
    who: "Diamandis / Moonshots Mates circle",
    why: "Abundance framing. Calibrate moonshot altitude.",
  },
  {
    priority: 3,
    who: "Build with Gemini finalists and judges orbit",
    why: "Builder energy. Partner / tech co-founder pattern-match. Access is speculative.",
  },
  {
    priority: 4,
    who: "Future Vision / narrative people",
    why: "Story craft for MTP plus RE/AFS apply narrative",
  },
  {
    priority: 5,
    who: "Operators like you (domain + AI, not conference tourists)",
    why: "Peer board. Possible handful chat after.",
  },
];

export const QUESTIONS_TO_ASK = [
  "What's your MTP in one sentence, and what do you refuse to build because of it?",
  "Where does opportunity get stuck in your world: talent, capital, customers?",
  "If you hired a BD / relationship-tech partner tomorrow, what would they own in week one?",
  "What did you believe about AI agents six months ago that you no longer believe?",
  "Who in this room should I meet if I care about X?",
  "For ExO folk: how are you running MTP as protocol vs poster in a company under 50?",
];

export const CAPTURE_CHECKLIST = [
  "Final MTP wording said out loud (voice memo between sessions)",
  "Chosen moonshot + one RE apply + one AFS apply, dated",
  "5 to 10 contacts: name, org, why green-flag, promised next step, channel",
  "3 phrases or frameworks worth stealing, attributed",
  "Red-flag offers declined, and why",
  "Unconference sessions joined or hosted",
  "Sunday 30-min debrief note",
];

export const OPEN_QUESTIONS = [
  { id: "ticket", question: "Ticket tier? GA / VIP / faculty / not yet, and price paid?" },
  { id: "admitted", question: "Already admitted? Submitted / accepted / waitlist / not started?" },
  { id: "travel", question: "Travel dates? Fly in Thu Sep 24? Stay through Sat?" },
  { id: "plusOne", question: "Solo or +1?" },
  { id: "public", question: "Public vs quiet? LinkedIn from the event, or low-profile?" },
  { id: "handful", question: "Handful chat: who, purpose, before or after LA?" },
  { id: "hardNo", question: "Hard no list beyond Revalize?" },
  { id: "memry", question: "memryOS status for the room: live demo, alumni project, or silent?" },
  { id: "afs", question: "AFS / Ramzi visibility. Mentions of fleet rewrite OK externally?" },
  { id: "success", question: "Success metric for Sep 25?" },
];

export const QUICK_CARD = [
  "MTP (working): Rewire how opportunity flows to abundance.",
  "Moonshot (pick one): Opportunity OS · AI-Native Ninja · Build partner.",
  "Apply: RE ritual + AFS Lane A, both dated within 90 days.",
  "Seek: BD / relationship-tech / build partner.",
  "Avoid: Revalize-shaped internal enablement IC.",
  "Capture: MTP voice memo · 3 deep intros · Sunday debrief.",
];

export const PREWORK = [
  "Answer the open travel and ticket questions in a few bullets.",
  "Say MTP option 1 out loud once, to a human or a voice memo.",
  "List 5 people or org types you'd be thrilled to meet. Functions, not celebrity names.",
];

export function mtpById(id: MtpId): MtpOption {
  const found = MTP_OPTIONS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown MTP ${id}`);
  return found;
}

export function moonshotById(id: MoonshotId): MoonshotOption {
  const found = MOONSHOTS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown moonshot ${id}`);
  return found;
}

export function labelMtp(id: MtpId): string {
  const item = mtpById(id);
  return `Option ${item.option}: ${item.title}`;
}

export function labelMoonshot(id: MoonshotId): string {
  const item = moonshotById(id);
  return `Moonshot ${item.option}: ${item.title}`;
}
