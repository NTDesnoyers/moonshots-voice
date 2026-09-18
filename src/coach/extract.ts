import { MTP_OPTIONS, ONE_LINER } from "../content/brief";
import type { Decisions, MoonshotId, MtpId } from "../types";

const MTP_ALIASES: Array<{ id: MtpId; patterns: RegExp[] }> = [
  {
    id: "opportunity-routing",
    patterns: [
      /\bopportunity[- ]routing\b/i,
      /\bopportunity flow\b/i,
      /\brewire how opportunity\b/i,
      /\boption(?:\s+number)?\s*(?:1|one)\b/i,
      /\bfirst\s+option\b/i,
    ],
  },
  {
    id: "relationship-infra",
    patterns: [
      /\brelationship (?:infra|infrastructure|layer)\b/i,
      /\bweak ties\b/i,
      /\bmemry\b/i,
      /\boption(?:\s+number)?\s*(?:2|two)\b/i,
      /\bsecond\s+option\b/i,
    ],
  },
  {
    id: "dual-domain",
    patterns: [
      /\bdual[- ]domain\b/i,
      /\babundance os\b/i,
      /\bboth domains\b/i,
      /\boption(?:\s+number)?\s*(?:3|three)\b/i,
      /\bthird\s+option\b/i,
    ],
  },
];

const MOONSHOT_ALIASES: Array<{ id: MoonshotId; patterns: RegExp[] }> = [
  {
    id: "opportunity-os",
    patterns: [
      /\bopportunity os\b/i,
      /\brouting layer\b/i,
      /\bmoonshot(?:\s+number)?\s*(?:1|one)\b/i,
      /\bfirst moonshot\b/i,
    ],
  },
  {
    id: "ai-native-ninja",
    patterns: [
      /\bninja\b/i,
      /\bfranchise[- ]of[- ]one\b/i,
      /\bplan a\b/i,
      /\bmoonshot(?:\s+number)?\s*(?:2|two)\b/i,
      /\bsecond moonshot\b/i,
    ],
  },
  {
    id: "build-partner",
    patterns: [
      /\bbuild[- ]partner\b/i,
      /\bco-?found/i,
      /\bco-?build\b/i,
      /\btechnical partner\b/i,
      /\bmoonshot(?:\s+number)?\s*(?:3|three)\b/i,
      /\bthird moonshot\b/i,
    ],
  },
];

const REVALIZE_SHAPED = [
  /\benablement\b/i,
  /\bpe[- ]backed\b/i,
  /\bgovernance\b.*\broi\b/i,
  /\bpure ic\b/i,
  /\bticket queue\b/i,
  /\binternal tooling\b/i,
  /\bprestige\b/i,
  /\bai team of (?:3|three)\b/i,
];

const ADVANCE = /\b(ready|let'?s go|go ahead|continue|next|yes|yeah|yep|lock it|sounds good|do it)\b/i;
const BACK = /\b(go back|previous|wait|hold on|rewind)\b/i;
const REPEAT = /\b(repeat|say that again|what were the options)\b/i;

export function normalizeUtterance(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function isRevalizeShaped(text: string): boolean {
  return REVALIZE_SHAPED.some((pattern) => pattern.test(text));
}

export function detectNav(text: string): "advance" | "back" | "repeat" | null {
  if (BACK.test(text)) return "back";
  if (REPEAT.test(text)) return "repeat";
  if (ADVANCE.test(text) && text.split(/\s+/).length <= 8) return "advance";
  return null;
}

export function detectMtpMentions(text: string): MtpId[] {
  const found: MtpId[] = [];
  for (const alias of MTP_ALIASES) {
    if (alias.patterns.some((pattern) => pattern.test(text)) && !found.includes(alias.id)) {
      found.push(alias.id);
    }
  }
  return found;
}

export function detectMoonshot(text: string): MoonshotId | undefined {
  for (const alias of MOONSHOT_ALIASES) {
    if (alias.patterns.some((pattern) => pattern.test(text))) return alias.id;
  }
  return undefined;
}

export function parseRanking(text: string): MtpId[] | undefined {
  const mentions = detectMtpMentions(text);
  if (mentions.length >= 2) return uniquePreserve(mentions);

  const numbered: Array<{ pos: number; id: MtpId }> = [];
  const orderWords: Array<[RegExp, MtpId]> = [
    [/1(?:st)?[:.)\s]+(?:option\s+)?(?:1|one|opportunity)/i, "opportunity-routing"],
    [/2(?:nd)?[:.)\s]+(?:option\s+)?(?:2|two|relationship)/i, "relationship-infra"],
    [/3(?:rd)?[:.)\s]+(?:option\s+)?(?:3|three|dual)/i, "dual-domain"],
  ];
  for (const [pattern, id] of orderWords) {
    const match = pattern.exec(text);
    if (match) numbered.push({ pos: match.index, id });
  }
  if (numbered.length >= 2) {
    numbered.sort((a, b) => a.pos - b.pos);
    return uniquePreserve(numbered.map((item) => item.id));
  }

  const compact = text.toLowerCase().match(/\b([123])\b(?:\s*(?:,|then|and)?\s*\b([123])\b)(?:\s*(?:,|then|and)?\s*\b([123])\b)?/);
  if (compact) {
    const map: Record<string, MtpId> = {
      "1": "opportunity-routing",
      "2": "relationship-infra",
      "3": "dual-domain",
    };
    const ids = [compact[1], compact[2], compact[3]]
      .filter((value): value is string => Boolean(value))
      .map((value) => map[value]);
    if (ids.length >= 2) return uniquePreserve(ids);
  }

  return mentions.length ? mentions : undefined;
}

export function extractApplies(text: string): { reApply?: string; afsApply?: string } {
  const re = text.match(
    /(?:\bRE\b|\breal estate\b|\bninja\b)[:\s-]+(.{12,220}?)(?=(?:\bAFS\b|\bfleet\b|\bramzi\b)|$)/i,
  );
  const afs = text.match(/(?:\bAFS\b|\bfleet\b|\bramzi\b)[:\s-]+(.{12,220})$/i);
  const result: { reApply?: string; afsApply?: string } = {};
  if (re?.[1]) result.reApply = cleanClip(re[1]);
  if (afs?.[1]) result.afsApply = cleanClip(afs[1]);
  if (!result.reApply && /\b(intro|ritual|cadence|follow-?up|ninja)\b/i.test(text) && text.length > 24) {
    result.reApply = cleanClip(text);
  }
  if (!result.afsApply && /\b(lane a|deal kit|fiduciary|ramzi|fleet)\b/i.test(text) && text.length > 24) {
    result.afsApply = cleanClip(text);
  }
  return result;
}

export function looksLikeOneLiner(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 12 || words.length > 90) return false;
  return /\b(opportunity|relationship|real estate|fleet|moonshot|partner|builder)\b/i.test(text);
}

export function looksLikeFifteenSecond(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length >= 8 && words.length <= 28 && /\b(opportunity|partner|builder|fleet|real estate)\b/i.test(text);
}

export function extractOpenAnswers(text: string): Record<string, string> {
  const answers: Record<string, string> = {};
  if (/\b(ga|vip|faculty|ticket)\b/i.test(text)) answers.ticket = cleanClip(text);
  if (/\b(admitted|accepted|waitlist|applied)\b/i.test(text)) answers.admitted = cleanClip(text);
  if (/\b(fly|hotel|thursday|thu|saturday|sat)\b/i.test(text)) answers.travel = cleanClip(text);
  if (/\b(solo|\+1|plus one)\b/i.test(text)) answers.plusOne = cleanClip(text);
  if (/\b(linkedin|low-?profile|quiet|post)\b/i.test(text)) answers.public = cleanClip(text);
  if (/\bmemry\b/i.test(text)) answers.memry = cleanClip(text);
  if (/\b(success|metric|win looks like)\b/i.test(text)) answers.success = cleanClip(text);
  return answers;
}

export function mergeDecisions(current: Decisions, incoming: Partial<Decisions>): Decisions {
  const next: Decisions = { ...current, ...incoming };
  if (incoming.openAnswers) {
    next.openAnswers = { ...current.openAnswers, ...incoming.openAnswers };
  }
  return next;
}

export function extractFromUtterance(text: string, current: Decisions): Partial<Decisions> {
  const raw = normalizeUtterance(text);
  const patch: Partial<Decisions> = {};
  if (!raw) return patch;

  const ranking = parseRanking(raw);
  if (ranking?.length) patch.mtpRanking = ranking;

  const mtps = detectMtpMentions(raw);
  if (mtps.length === 1 && (current.mtpRanking || /\b(pick|lock|go with|choose|working)\b/i.test(raw))) {
    patch.mtpPick = mtps[0];
  } else if (mtps.length === 1 && current.mtpRanking && !current.mtpPick) {
    patch.mtpPick = mtps[0];
  }

  const moonshot = detectMoonshot(raw);
  if (moonshot && (!current.moonshotPick || /\b(pick|lock|choose|switch|change)\b/i.test(raw))) {
    patch.moonshotPick = moonshot;
    if (raw.length > 40) patch.moonshotWhy = raw;
  }

  const applies = extractApplies(raw);
  if (applies.reApply) patch.reApply = applies.reApply;
  if (applies.afsApply) patch.afsApply = applies.afsApply;

  if (looksLikeFifteenSecond(raw) && current.oneLiner) {
    patch.oneLiner15 = raw;
  } else if (looksLikeOneLiner(raw)) {
    patch.oneLiner = raw;
  }

  if (/\b(refuse|identity|not for|disqualify)\b/i.test(raw)) {
    patch.mtpLitmusNotes = raw;
  }

  if (/\b(energy|tired|wired|residue|loaded|heavy|clear)\b/i.test(raw)) {
    patch.energy = raw;
    if (/\brevalize\b/i.test(raw)) patch.revalizeResidue = raw;
    if (/\b(afs|re|fleet|listing)\b/i.test(raw)) patch.load = raw;
  }

  if (/\b(salim|diamandis|exo|deep conversation|priority)\b/i.test(raw)) {
    patch.dayPriorities = raw;
  }
  if (/\b(ask|question)\b/i.test(raw) && raw.length > 20) {
    patch.questionsToAsk = raw;
  }
  if (/\b(success|win|metric)\b/i.test(raw) && raw.length > 12) {
    patch.successMetric = raw;
  }

  const open = extractOpenAnswers(raw);
  if (Object.keys(open).length) patch.openAnswers = open;

  if (/\b(green flag|red flag|filter|walk away)\b/i.test(raw)) {
    patch.flagsNotes = raw;
  }

  return patch;
}

export function defaultOneLiner(): string {
  return ONE_LINER;
}

export function rankingSentence(ids: MtpId[]): string {
  return ids
    .map((id, index) => {
      const option = MTP_OPTIONS.find((item) => item.id === id);
      return `${index + 1}. ${option?.title ?? id}`;
    })
    .join(" ");
}

function uniquePreserve<T>(items: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function cleanClip(text: string): string {
  return text.replace(/\s+/g, " ").replace(/^[:.\-\s]+/, "").trim();
}
