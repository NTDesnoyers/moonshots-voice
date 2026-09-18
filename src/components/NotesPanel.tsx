import { FILTER_QUESTION, labelMoonshot, labelMtp, ONE_LINER } from "../content/brief";
import type { Decisions } from "../types";

export function NotesPanel({
  decisions,
  collapsed,
  onExport,
  onReset,
}: {
  decisions: Decisions;
  collapsed?: boolean;
  onExport: () => void;
  onReset: () => void;
}) {
  return (
    <aside className={`panel notes${collapsed ? " collapsed" : ""}`}>
      <h2>Session card</h2>
      <Note title="MTP" value={decisions.mtpPick ? labelMtp(decisions.mtpPick) : undefined} />
      <Note title="Ranking" value={decisions.mtpRanking?.map((id, i) => `${i + 1}. ${labelMtp(id)}`).join(" · ")} />
      <Note title="Moonshot" value={decisions.moonshotPick ? labelMoonshot(decisions.moonshotPick) : undefined} />
      <Note title="RE apply" value={decisions.reApply} />
      <Note title="AFS apply" value={decisions.afsApply} />
      <Note title="One-liner" value={decisions.oneLiner ?? (decisions.mtpPick ? ONE_LINER : undefined)} />
      <Note title="15-second" value={decisions.oneLiner15} />
      <Note title="Filter" value={decisions.flagsNotes ?? FILTER_QUESTION} empty={!decisions.flagsNotes} />
      <Note title="Day map" value={decisions.dayPriorities} />
      <Note title="Success" value={decisions.successMetric} />
      <div className="cta-row" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={onExport}>
          Download .md
        </button>
        <button className="btn ghost" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  );
}

function Note({ title, value, empty }: { title: string; value?: string; empty?: boolean }) {
  return (
    <div className="note-block">
      <h3>{title}</h3>
      <p className={!value || empty ? "empty" : undefined}>{value || "Still open"}</p>
    </div>
  );
}
