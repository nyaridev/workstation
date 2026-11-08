// StatusBanner: the last error (with an offer to set the folder up when it wasn't a workstation) or the last notice.

interface Props {
  error: string | null;
  notice: string | null;
  offerSetup: string | null;
  onSetup: (root: string) => void;
}

/** Nothing when there's nothing to say. */
export function StatusBanner({ error, notice, offerSetup, onSetup }: Props) {
  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 bg-red-950/40 px-4 py-2 text-red-300 text-sm">
        <span>{error}</span>
        {offerSetup && (
          <button
            type="button"
            onClick={() => onSetup(offerSetup)}
            className="rounded-md bg-zinc-200 px-3 py-1 font-medium text-zinc-900 hover:bg-white"
          >
            Set it up as a new workstation
          </button>
        )}
      </div>
    );
  }
  if (notice) {
    return (
      <p role="status" className="bg-emerald-950/40 px-4 py-2 text-emerald-300 text-sm">
        {notice}
      </p>
    );
  }
  return null;
}
