// AppBackdrop: iro-ui's backdrop behind the whole window, with the liquid shader unless Settings turns it off.

import { Backdrop } from "iro-ui";
import { useSettings } from "./SettingsProvider";

/** The glows, grain and, unless turned off, the liquid. */
export function AppBackdrop() {
  const { settings } = useSettings();
  // Off until the settings arrive, so a turned-off liquid never flashes on; it fades in anyway.
  return <Backdrop liquid={settings?.look.liquidBackground ?? false} />;
}
