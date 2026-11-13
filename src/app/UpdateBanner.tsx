// UpdateBanner: an accent notice under the header once a newer Workstation is out (ADR-0014): both versions, the
// download's progress or the error, "Update and restart" and "Later". Later hides it until the next start, or until a
// still newer version is found.

import { Button, Icon, ProgressBar } from "iro-ui";
import { ArrowUpCircleIcon } from "iro-ui/icons";
import { useState } from "react";
import { installUpdate } from "../lib/backend";
import type { UpdateStatus } from "../lib/types";
import { NoticeBanner } from "./NoticeBanner";

// ── Private helpers ───────────────────────
/** The banner's words for where the update is. */
function lineOf(status: UpdateStatus, latest: string): string {
  if (status.step === "downloading") {
    const done = status.progress == null ? "" : ` ${Math.round(status.progress * 100)}%`;
    return `Downloading Workstation ${latest}${done}`;
  }
  if (status.step === "installing") return "Installing; Workstation restarts";
  return `Workstation ${latest} is out. You have ${status.current}.`;
}

// ── Public API ────────────────────────────
/** The update banner; nothing until a newer version is out, or after it's hidden. */
export function UpdateBanner({ status }: { status: UpdateStatus | null }) {
  const [hidden, setHidden] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = status?.canUpdate ? status.latest : null;
  if (!status || !latest || hidden === latest) return null;

  const busy = status.step === "downloading" || status.step === "installing";
  const failed = error ?? status.error;

  async function install() {
    setError(null);
    await installUpdate().catch((reason) => setError(String(reason)));
  }

  return (
    <NoticeBanner
      tone="accent"
      icon={<Icon icon={ArrowUpCircleIcon} />}
      actions={
        <>
          <Button
            size="sm"
            variant="primary"
            loading={busy}
            disabled={status.step != null}
            onClick={() => void install()}
          >
            Update and restart
          </Button>
          {!busy && (
            <Button size="sm" variant="ghost" onClick={() => setHidden(latest)}>
              Later
            </Button>
          )}
        </>
      }
    >
      <span className="update-banner-text">
        <span>{lineOf(status, latest)}</span>
        {failed && (
          <span className="update-banner-note selectable" data-tone="danger">
            {failed}
          </span>
        )}
      </span>
      {status.step === "downloading" && (
        <ProgressBar className="update-banner-progress" value={status.progress} label="Downloading the update" />
      )}
    </NoticeBanner>
  );
}
