import { AGENDA } from "../content/brief";
import type { Phase } from "../types";

export function AgendaRail({
  phase,
  onJump,
}: {
  phase: Phase;
  onJump: (phase: Phase) => void;
}) {
  return (
    <aside className="panel agenda">
      <h2>Agenda</h2>
      {AGENDA.map((block) => (
        <button
          key={block.id}
          className={`agenda-item${phase === block.id ? " active" : ""}`}
          onClick={() => onJump(block.id)}
        >
          <span className="mins">{block.minutes}</span>
          <span className="ttl">{block.title}</span>
          <span className="out">{block.output}</span>
        </button>
      ))}
    </aside>
  );
}
