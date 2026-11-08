// useUpdate: looks for a newer release on start, every 6 hours, and when the window comes back into focus (at most
// every 10 minutes); installs it when asked.

import { useEffect, useState } from "react";
import { checkUpdate, installUpdate, openReleasePage } from "../lib/backend";
import type { Release } from "../lib/types";

const EVERY = 6 * 60 * 60 * 1000;
const FOCUS_GAP = 10 * 60 * 1000;

/** The newest release when it's newer than the app, and a function that installs it after asking. */
export function useUpdate() {
  const [latest, setLatest] = useState<Release | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    let last = 0;
    const check = () => {
      last = Date.now();
      // Offline or GitHub unreachable: no button, and the next check tries again.
      checkUpdate().then(
        (result) => setLatest(result.latest),
        () => setLatest(null),
      );
    };
    const onFocus = () => {
      if (Date.now() - last > FOCUS_GAP) check();
    };
    check();
    const timer = setInterval(check, EVERY);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const install = async () => {
    if (!latest || !window.confirm(`Install Workstation ${latest.version}? The app restarts into it.`)) return;
    setInstalling(true);
    try {
      await installUpdate(latest.version);
    } catch (error) {
      setInstalling(false);
      if (window.confirm(`${error}\n\nOpen the release page to download it yourself?`))
        await openReleasePage(latest.page);
    }
  };

  return { latest, installing, install };
}
