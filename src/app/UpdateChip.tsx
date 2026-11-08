// UpdateChip: the title bar's button for a newer release; hidden while the app is up to date.

import { useUpdate } from "./useUpdate";

/** `v0.2.0` with a down arrow; a click asks, then installs and restarts. */
export function UpdateChip() {
  const { latest, installing, install } = useUpdate();
  if (!latest) return null;

  return (
    <button
      type="button"
      onClick={install}
      disabled={installing}
      aria-label={`Install Workstation ${latest.version}`}
      className="mr-2 flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-sky-500/15 px-3 font-medium text-sky-300 text-xs hover:bg-sky-500/25 disabled:opacity-60"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M6 1.5v8M2.5 6 6 9.5 9.5 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {installing ? "Installing…" : `v${latest.version}`}
    </button>
  );
}
