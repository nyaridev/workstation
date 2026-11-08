// App: the window. Shows the first-run screen, or the switcher and the open workstation.

import { ProjectList } from "../features/projects/ProjectList";
import { EmptyState } from "./EmptyState";
import { StatusBanner } from "./StatusBanner";
import { useWorkstations } from "./useWorkstations";
import { WorkstationSwitcher } from "./WorkstationSwitcher";

/** The whole window. */
export function App() {
  const { listing, error, notice, offerSetup, add, setup, open, remove } = useWorkstations();
  const banner = <StatusBanner error={error} notice={notice} offerSetup={offerSetup} onSetup={setup} />;

  if (!listing) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-400">
        {error ? <p role="alert">{error}</p> : <p>Loading…</p>}
      </main>
    );
  }
  if (listing.workstations.length === 0) {
    return <EmptyState banner={banner} onAdd={add} onSetup={() => setup()} />;
  }

  const current = listing.workstations.find((w) => w.root === listing.open) ?? listing.workstations[0];
  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-200">
      <header className="flex items-center justify-between border-zinc-800 border-b px-4 py-3">
        <WorkstationSwitcher
          listing={listing}
          current={current}
          onOpen={open}
          onAdd={add}
          onSetup={() => setup()}
          onRemove={remove}
        />
        <span className="truncate pl-4 text-xs text-zinc-500">{current.root}</span>
      </header>
      {banner}
      {current.available ? (
        <main className="flex min-h-0 flex-1 flex-col">
          {/* The key resets the filters when switching workstations. */}
          <ProjectList key={current.root} root={current.root} />
        </main>
      ) : (
        <main className="grid flex-1 place-items-center p-6 text-center text-sm text-zinc-400">
          <p>
            {current.root} wasn't found, or it has no projects.json any more.
            <br />
            Plug the drive back in, or remove it from the list.
          </p>
        </main>
      )}
    </div>
  );
}
