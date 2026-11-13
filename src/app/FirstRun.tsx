// FirstRun: the first-run screen, shown while no workstation is listed.

import { Button, EmptyState, Icon } from "iro-ui";
import { FoldersIcon } from "iro-ui/icons";
import type { ReactNode } from "react";

interface Props {
  /** The error, notice or setup offer to show under the buttons. */
  banner: ReactNode;
  onAdd: () => void;
  onSetup: () => void;
}

/** Explains what a workstation is and offers to add an existing one or set up a new one. */
export function FirstRun({ banner, onAdd, onSetup }: Props) {
  return (
    <main className="center">
      <div className="first-run">
        <EmptyState
          icon={<Icon icon={FoldersIcon} size={32} />}
          title="Workstation"
          action={
            <>
              <Button variant="primary" onClick={onAdd}>
                Add a workstation
              </Button>
              <Button onClick={onSetup}>Set up a new one</Button>
            </>
          }
        >
          Add the folder that holds your projects: the one with a <code>.workstation</code> file at its top. No such
          folder yet? Set one up: the app writes the starter folders, agent rules and its <code>.workstation</code>.
        </EmptyState>
        {banner}
      </div>
    </main>
  );
}
