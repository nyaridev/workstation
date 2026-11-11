// useWorkstations: the workstation list, the last error or notice, and the actions that change them.

import { useCallback, useEffect, useState } from "react";
import {
  addWorkstation,
  listWorkstations,
  openWorkstation,
  pickFolder,
  removeWorkstation,
  setupWorkstation,
} from "../lib/backend";
import type { Listing } from "../lib/types";

// shortcut: recognizes Rust's "isn't a workstation" error by its text; give the command a typed error if it grows more.
const NOT_A_WORKSTATION = "has no projects.json";

/** Loads the workstation list once and exposes add, set up (pick, then confirm), open and remove. */
export function useWorkstations() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** A folder the user tried to add that isn't a workstation yet, so the UI can offer to set it up. */
  const [offerSetup, setOfferSetup] = useState<string | null>(null);
  /** A folder waiting for the user's yes before the kit is written into it. */
  const [pendingSetup, setPendingSetup] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<Listing>, root?: string) => {
    setNotice(null);
    setOfferSetup(null);
    try {
      setListing(await action());
      setError(null);
    } catch (e) {
      setError(String(e));
      if (root && String(e).includes(NOT_A_WORKSTATION)) setOfferSetup(root);
    }
  }, []);

  useEffect(() => {
    void run(listWorkstations);
  }, [run]);

  const add = useCallback(async () => {
    const root = await pickFolder();
    if (root) await run(() => addWorkstation(root), root);
  }, [run]);

  /** Picks where to set up a starter workstation: `known`, or a folder the user picks. `confirmSetup` writes it. */
  const setup = useCallback(async (known?: string) => {
    const root = known ?? (await pickFolder());
    if (root) setPendingSetup(root);
  }, []);

  /** Sets up the picked folder, after the user said yes; it writes files. */
  const confirmSetup = useCallback(async () => {
    const root = pendingSetup;
    if (!root) return;
    await run(async () => {
      const result = await setupWorkstation(root);
      setNotice(
        `Set up ${root}: ${result.written} files written${result.skipped ? `, ${result.skipped} already there and kept` : ""}.`,
      );
      return result.listing;
    });
    setPendingSetup(null);
  }, [pendingSetup, run]);

  const cancelSetup = useCallback(() => setPendingSetup(null), []);
  const open = useCallback((root: string) => run(() => openWorkstation(root)), [run]);
  const remove = useCallback((root: string) => run(() => removeWorkstation(root)), [run]);

  return { listing, error, notice, offerSetup, pendingSetup, add, setup, confirmSetup, cancelSetup, open, remove };
}
