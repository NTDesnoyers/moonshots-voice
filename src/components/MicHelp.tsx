export function MicHelp({
  error,
  permission,
  supported,
}: {
  error: string | null;
  permission: "unknown" | "granted" | "denied";
  supported: boolean;
}) {
  if (!supported) {
    return (
      <div className="mic-help">
        This browser cannot run duplex voice. Open Chrome or Edge on desktop, or use the text box.
        Safari and Firefox are weak on Speech Recognition.
      </div>
    );
  }
  if (permission === "denied" || error) {
    return (
      <div className="mic-help">
        {error || "Microphone is blocked."} In Chrome: lock icon next to the URL, Site settings,
        Microphone, Allow. Then hit Start listening again. You can keep typing either way.
      </div>
    );
  }
  return null;
}
