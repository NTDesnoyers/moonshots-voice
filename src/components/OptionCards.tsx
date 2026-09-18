import { MOONSHOTS, MTP_OPTIONS } from "../content/brief";
import type { MoonshotId, MtpId, Phase } from "../types";

export function OptionCards({
  phase,
  mtpPick,
  moonshotPick,
  onMtp,
  onMoonshot,
}: {
  phase: Phase;
  mtpPick?: MtpId;
  moonshotPick?: MoonshotId;
  onMtp: (id: MtpId) => void;
  onMoonshot: (id: MoonshotId) => void;
}) {
  if (phase === "mtp") {
    return (
      <div className="options">
        {MTP_OPTIONS.map((item) => (
          <button
            key={item.id}
            className={`option${mtpPick === item.id ? " active" : ""}`}
            onClick={() => onMtp(item.id)}
          >
            <strong>
              Option {item.option}. {item.title}
              {item.speculative ? " (speculative)" : ""}
            </strong>
            <div>{item.statement}</div>
          </button>
        ))}
      </div>
    );
  }
  if (phase === "moonshot") {
    return (
      <div className="options">
        {MOONSHOTS.map((item) => (
          <button
            key={item.id}
            className={`option${moonshotPick === item.id ? " active" : ""}`}
            onClick={() => onMoonshot(item.id)}
          >
            <strong>
              Moonshot {item.option}. {item.title}
            </strong>
            <div>{item.tenYear}</div>
          </button>
        ))}
      </div>
    );
  }
  return null;
}
