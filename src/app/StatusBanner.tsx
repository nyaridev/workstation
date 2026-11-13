// StatusBanner: the last error (with an offer to set the folder up when it wasn't a workstation) or the last notice.

import { Banner, Button } from "iro-ui";

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
      <Banner
        tone="danger"
        role="alert"
        className="selectable"
        actions={
          offerSetup && (
            <Button size="sm" onClick={() => onSetup(offerSetup)}>
              Set it up as a new workstation
            </Button>
          )
        }
      >
        {error}
      </Banner>
    );
  }
  if (notice) {
    return (
      <Banner tone="success" role="status">
        {notice}
      </Banner>
    );
  }
  return null;
}
