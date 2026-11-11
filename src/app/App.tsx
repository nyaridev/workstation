// App: the window. The title bar on top, then the first-run screen, or the open workstation, on iro-ui's backdrop.

import { AlertDialog, Backdrop, EmptyState, Notice, Spinner } from "iro-ui";
import { ProjectList } from "../features/projects/ProjectList";
import { FirstRun } from "./FirstRun";
import { StatusBanner } from "./StatusBanner";
import { TitleBar } from "./TitleBar";
import { useWorkstations } from "./useWorkstations";
import { WorkstationSwitcher } from "./WorkstationSwitcher";

/** The whole window. */
export function App() {
  const { listing, error, notice, offerSetup, pendingSetup, add, setup, confirmSetup, cancelSetup, open, remove } =
    useWorkstations();
  const banner = <StatusBanner error={error} notice={notice} offerSetup={offerSetup} onSetup={setup} />;
  const current = listing?.workstations.find((w) => w.root === listing.open) ?? listing?.workstations[0];

  return (
    <div className="app">
      <Backdrop />
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
            <span data-tauri-drag-region className="title-path">
              {current.root}
            </span>
          </>
        )}
      </TitleBar>
      {!listing ? (
        <main className="center">
          {error ? (
            <Notice tone="danger" role="alert">
              {error}
            </Notice>
          ) : (
            <Spinner label="Loading" />
          )}
        </main>
      ) : !current ? (
        <FirstRun banner={banner} onAdd={add} onSetup={() => setup()} />
      ) : (
        <>
          {banner}
          {current.available ? (
            <main className="workstation">
              {/* The key resets the filters when switching workstations. */}
              <ProjectList key={current.root} root={current.root} />
            </main>
          ) : (
            <main className="center">
              <EmptyState tone="warning" title={`${current.root} wasn't found, or it has no projects.json any more.`}>
                Plug the drive back in, or remove it from the list.
              </EmptyState>
            </main>
          )}
        </>
      )}
      <AlertDialog
        open={pendingSetup !== null}
        onOpenChange={(isOpen) => !isOpen && cancelSetup()}
        title={`Set up a workstation in ${pendingSetup ?? "this folder"}?`}
        description="This adds the starter folders, rules and projects.json. Files already there are kept as they are."
        confirmLabel="Set it up"
        tone="accent"
        onConfirm={confirmSetup}
      />
    </div>
  );
}
