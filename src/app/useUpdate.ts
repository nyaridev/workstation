// useUpdate: what the app's own updater knows (ADR-0014), kept current by its `update-changed` reports. The update
// banner and Settings → About show it.

import { useEffect, useState } from "react";
import { onUpdateChanged, updateStatus } from "../lib/backend";
import type { UpdateStatus } from "../lib/types";

/** The updater's status; `null` until it's read. */
export function useUpdate(): UpdateStatus | null {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  useEffect(() => {
    void updateStatus().then(setStatus);
    return onUpdateChanged(setStatus);
  }, []);
  return status;
}
