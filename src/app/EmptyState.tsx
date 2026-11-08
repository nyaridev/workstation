// EmptyState: the first-run screen, shown while no workstation is listed.

import type { ReactNode } from "react";

interface Props {
  /** The error, notice or setup offer to show under the buttons. */
  banner: ReactNode;
  onAdd: () => void;
  onSetup: () => void;
}

/** Explains what a workstation is and offers to add an existing one or set up a new one. */
export function EmptyState({ banner, onAdd, onSetup }: Props) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-zinc-200">
      <div className="max-w-md text-center">
        <h1 className="font-semibold text-2xl">Workstation</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Add the folder that holds your projects: the one with <code>projects.json</code> at its top. No such folder
          yet? Set one up: the app writes the starter folders, agent rules and an empty <code>projects.json</code>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-md bg-zinc-200 px-4 py-2 font-medium text-sm text-zinc-900 hover:bg-white"
          >
            Add a workstation
          </button>
          <button
            type="button"
            onClick={onSetup}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Set up a new one
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-md text-left">{banner}</div>
      </div>
    </main>
  );
}
