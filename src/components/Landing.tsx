import { EVENT } from "../content/brief";
import type { SessionState } from "../types";

export function Landing({
  saved,
  onStart,
  onResume,
}: {
  saved: SessionState;
  onStart: () => void;
  onResume: () => void;
}) {
  const hasProgress = Boolean(saved.startedAt && saved.messages.length);
  return (
    <div className="landing">
      <div className="kicker">
        Moonshots Prep Coach
        <span>{EVENT.when} · Los Angeles</span>
      </div>
      <h1>Say the MTP ten times on Friday. Not a prettier version of last year’s seat.</h1>
      <p className="lede">
        A 60 to 90 minute duplex coaching session for Nathan Desnoyers. The coach listens while you
        talk, answers out loud, and writes the locks onto a card you can download. Chrome or Edge.
        Mic plus speakers. Type if the mic fails.
      </p>
      <div className="walk-out">
        <div className="walk-card">
          <strong>Working MTP</strong>
          <p>Rank three drafts. Run refusal and identity. Pick one you can say in a reception line.</p>
        </div>
        <div className="walk-card">
          <strong>Personal moonshot</strong>
          <p>One 10-year shot with a dated RE apply and a dated AFS apply. No inspiration tourism.</p>
        </div>
        <div className="walk-card">
          <strong>Network kit</strong>
          <p>One-liner, 15-second cut, green and red flags that catch Revalize-shaped seats.</p>
        </div>
        <div className="walk-card">
          <strong>Day map</strong>
          <p>Three deep conversations. Two questions. A success metric. Notes you can export.</p>
        </div>
      </div>
      <div className="cta-row">
        <button className="btn primary" onClick={onStart}>
          Start session
        </button>
        {hasProgress ? (
          <button className="btn" onClick={onResume}>
            Resume notes
          </button>
        ) : null}
      </div>
      <p className="fine">
        Ground truth is the Sep 14 prep brief and the Solve Everything notes. The coach will not
        invent a biography. Personal MTP stays distinct from the AFS firm MTP. Default voice uses
        the browser. No API key required.
      </p>
    </div>
  );
}
