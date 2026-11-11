// UpdateChip: the title bar's button for a newer release; hidden while the app is up to date. It asks before
// installing and, when the install fails, offers the release page instead.

import { AlertDialog, Button, Icon } from "iro-ui";
import { DownloadIcon } from "iro-ui/icons";
import { useUpdate } from "./useUpdate";

/** `v0.2.0` with a download mark; a click asks, then installs and restarts. */
export function UpdateChip() {
  const { latest, installing, failed, install, openPage, dismissFailure } = useUpdate();
  if (!latest) return null;

  return (
    <>
      <AlertDialog
        trigger={
          <Button
            size="sm"
            variant="primary"
            icon={<Icon icon={DownloadIcon} />}
            loading={installing}
            aria-label={`Install Workstation ${latest.version}`}
          >
            {installing ? "Installing…" : `v${latest.version}`}
          </Button>
        }
        title={`Install Workstation ${latest.version}?`}
        description="The app restarts into it."
        confirmLabel="Install"
        tone="accent"
        onConfirm={install}
      />
      <AlertDialog
        open={failed !== null}
        onOpenChange={(isOpen) => !isOpen && dismissFailure()}
        title="The update didn't install"
        description={`${failed ?? ""} Open the release page to download it yourself?`}
        confirmLabel="Open the release page"
        tone="accent"
        onConfirm={openPage}
      />
    </>
  );
}
