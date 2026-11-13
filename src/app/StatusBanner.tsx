// StatusBanner: the last error (with an offer to set the folder up when it wasn't a workstation) or the last notice,
// as a NoticeBanner under the header.

import { Button } from "iro-ui";
import { NoticeBanner } from "./NoticeBanner";

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
      <NoticeBanner
        tone="danger"
        role="alert"
        actions={
          offerSetup && (
            <Button size="sm" onClick={() => onSetup(offerSetup)}>
              Set it up as a new workstation
            </Button>
          )
        }
      >
        <span className="selectable">{error}</span>
      </NoticeBanner>
    );
  }
  if (notice) {
    return (
      <NoticeBanner tone="success" role="status">
        {notice}
      </NoticeBanner>
    );
  }
  return null;
}
