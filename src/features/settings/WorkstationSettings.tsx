// WorkstationSettings: every saved workstation, the open one marked, with Open and Remove from list; then Add and Set
// up new (ADR-0012, ADR-0013). Removing only forgets it: the folder stays as it is.

import { AlertDialog, Badge, Button, Icon, ListItem, Panel, SectionTitle } from "iro-ui";
import { FoldersIcon, PlusIcon } from "iro-ui/icons";
import { useWorkstations } from "../../app/useWorkstations";

/** The Workstations section. */
export function WorkstationSettings() {
  const { listing, add, setup, open, remove } = useWorkstations();
  if (!listing) return null;

  return (
    <Panel as="section" className="settings-section">
      <SectionTitle
        icon={<Icon icon={FoldersIcon} />}
        actions={
          <>
            <Button size="sm" icon={<Icon icon={PlusIcon} />} onClick={add}>
              Add…
            </Button>
            <Button size="sm" onClick={() => setup()}>
              Set up new…
            </Button>
          </>
        }
      >
        Workstations
      </SectionTitle>
      <ul className="settings-list">
        {listing.workstations.map((w) => (
          <ListItem
            key={w.root}
            as="li"
            title={
              <span className="settings-ws-title">
                <span className="settings-ws-name">{w.name}</span>
                {w.root === listing.open && <Badge tone="accent">Open</Badge>}
                {!w.available && <Badge tone="warning">Not found</Badge>}
              </span>
            }
            description={<code className="selectable">{w.root}</code>}
            actions={
              <>
                {w.root !== listing.open && w.available && (
                  <Button size="sm" onClick={() => open(w.root)}>
                    Open
                  </Button>
                )}
                <AlertDialog
                  trigger={
                    <Button size="sm" variant="ghost">
                      Remove from list
                    </Button>
                  }
                  title={`Remove "${w.name}" from the list?`}
                  description="Its folder and files stay as they are."
                  confirmLabel="Remove"
                  onConfirm={() => remove(w.root)}
                />
              </>
            }
          />
        ))}
      </ul>
    </Panel>
  );
}
