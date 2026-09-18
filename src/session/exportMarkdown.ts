import {
  CAPTURE_CHECKLIST,
  EVENT,
  FILTER_QUESTION,
  labelMoonshot,
  labelMtp,
  moonshotById,
  mtpById,
  ONE_LINER,
} from "../content/brief";
import type { SessionState } from "../types";

export function exportMarkdown(session: SessionState): string {
  const d = session.decisions;
  const started = session.startedAt ? new Date(session.startedAt).toISOString() : "n/a";
  const lines: string[] = [
    "# Moonshots Prep — Session notes",
    "",
    "**Nathan Desnoyers**",
    `**Summit:** ${EVENT.when} · ${EVENT.where}`,
    `**Session started:** ${started}`,
    "",
    "## Locked MTP",
    d.mtpPick
      ? [
          `**Pick:** ${labelMtp(d.mtpPick)}`,
          "",
          mtpById(d.mtpPick).statement,
        ].join("\n")
      : "_Not locked yet._",
    "",
    d.mtpRanking?.length
      ? `**Ranking:** ${d.mtpRanking.map((id, index) => `${index + 1}. ${labelMtp(id)}`).join(" · ")}`
      : "",
    d.mtpLitmusNotes ? `\n**Litmus:** ${d.mtpLitmusNotes}` : "",
    "",
    "## Personal moonshot",
    d.moonshotPick
      ? [`**Pick:** ${labelMoonshot(d.moonshotPick)}`, "", moonshotById(d.moonshotPick).tenYear].join("\n")
      : "_Not locked yet._",
    d.moonshotWhy ? `\n**Why this one:** ${d.moonshotWhy}` : "",
    "",
    "## 90-day applies",
    "### RE",
    d.reApply ?? "_Need a dated apply in verbs plus a metric._",
    "",
    "### AFS",
    d.afsApply ?? "_Need a dated apply in verbs plus a metric._",
    "",
    "## Networking",
    "### One-liner",
    d.oneLiner ?? ONE_LINER,
    "",
    "### 15-second cut",
    d.oneLiner15 ?? "_Not captured._",
    "",
    "### Filter",
    FILTER_QUESTION,
    d.flagsNotes ? `\n${d.flagsNotes}` : "",
    "",
    "## Day map",
    d.dayPriorities ?? "_Three deep conversations. Names and functions still open._",
    "",
    "### Questions I will ask",
    d.questionsToAsk ?? "_Pick two from the brief._",
    "",
    "## Success metric",
    d.successMetric ?? "_Define before wheels up._",
    "",
    "## State check",
    d.energy ? `- Energy: ${d.energy}` : "- Energy: _not captured_",
    d.load ? `- Load: ${d.load}` : "",
    d.revalizeResidue ? `- Revalize residue: ${d.revalizeResidue}` : "",
    "",
    "## Open questions",
  ];

  const open = d.openAnswers ?? {};
  if (Object.keys(open).length === 0) {
    lines.push("_None captured this session._");
  } else {
    for (const [key, value] of Object.entries(open)) {
      lines.push(`- **${key}:** ${value}`);
    }
  }

  lines.push("", "## Capture checklist", ...CAPTURE_CHECKLIST.map((item) => `- [ ] ${item}`));

  if (d.extraNotes) {
    lines.push("", "## Extra notes", d.extraNotes);
  }

  const spoken = session.messages.filter((message) => message.role === "you").slice(-8);
  if (spoken.length) {
    lines.push("", "## Recent answers");
    for (const message of spoken) {
      lines.push(`- ${message.text}`);
    }
  }

  lines.push(
    "",
    "---",
    "Grounded on the 2026-09-14 Moonshots prep brief and Solve Everything notes. Personal MTP is not the AFS firm MTP. Do not treat this file as a new biography.",
  );

  return lines.filter((line, index, all) => !(line === "" && all[index - 1] === "")).join("\n");
}

export function downloadMarkdown(session: SessionState): void {
  const blob = new Blob([exportMarkdown(session)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `moonshots-prep-notes-${day}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
