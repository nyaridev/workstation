// App: the window. The title bar on top, then the first-run screen, or the open workstation.

import { ProjectList } from "../features/projects/ProjectList";
import { EmptyState } from "./EmptyState";
import { StatusBanner } from "./StatusBanner";
import { TitleBar } from "./TitleBar";
import { useWorkstations } from "./useWorkstations";
import { WorkstationSwitcher } from "./WorkstationSwitcher";

/** The whole window. */
export function App() {
  const { listing, error, notice, offerSetup, add, setup, open, remove } = useWorkstations();
  const banner = <StatusBanner error={error} notice={notice} offerSetup={offerSetup} onSetup={setup} />;
  const current = listing?.workstations.find((w) => w.root === listing.open) ?? listing?.workstations[0];

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-200">
      <TitleBar>
        {listing && current && (
          <>
            <WorkstationSwitcher
              listing={listing}
              current={current}
              onOpen={open}
              onAdd={add}
              onSetup={() => setup()}
              onRemove={remove}
            />
            <span data-tauri-drag-region className="min-w-0 truncate text-xs text-zinc-500">
              {current.root}
            </span>
          </>
        )}
      </TitleBar>
      {!listing ? (
        <main className="grid flex-1 place-items-center text-zinc-400">
          {error ? <p role="alert">{error}</p> : <p>Loading…</p>}
        </main>
      ) : !current ? (
        <EmptyState banner={banner} onAdd={add} onSetup={() => setup()} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
