// App: the header (the mark, name and workstation switcher; the view tabs in the middle once there are two; the update
// chip, the Settings button and the window buttons) over the selected view, on the backdrop (ADR-0010).
// The mark and name go back to the first main view. Until a workstation is listed, the first-run screen takes the
// views' place. The header is also the title bar,
// following the frame Rust gave the window (ADR-0009). The browser's own right-click menu is off, except in text
// fields and selectable text. A view stays mounted once opened, hidden while another shows.

import { AlertDialog, Button, Icon, IconButton, Notice, Spinner, Tabs } from "iro-ui";
import { useEffect, useState } from "react";
import icon from "../../assets/brand/icon.svg";
import { appInfo } from "../lib/backend";
import type { AppInfo } from "../lib/types";
import { AppBackdrop } from "./AppBackdrop";
import { FirstRun } from "./FirstRun";
import { SettingsProvider } from "./SettingsProvider";
import { StatusBanner } from "./StatusBanner";
import { UpdateChip } from "./UpdateChip";
import { useWorkstations } from "./useWorkstations";
import { HEADER_VIEWS, MAIN_VIEWS } from "./views";
import { WindowControls } from "./WindowControls";
import { WorkstationSwitcher } from "./WorkstationSwitcher";

// ── Constants ─────────────────────────────
const ALL_VIEWS = [...MAIN_VIEWS, ...HEADER_VIEWS];
const TABS = MAIN_VIEWS.map(({ id, label, icon }) => ({ value: id, label, icon: <Icon icon={icon} /> }));
// Where the browser's menu stays: it has copy and paste.
const KEEPS_BROWSER_MENU = "input, textarea, [contenteditable], .selectable";

// ── Private helpers ───────────────────────
function blockBrowserMenu(event: MouseEvent) {
  if (!(event.target instanceof Element && event.target.closest(KEEPS_BROWSER_MENU))) event.preventDefault();
}

// ── Public API ────────────────────────────
/** The whole window. */
export function App() {
  const { listing, error, notice, offerSetup, pendingSetup, add, setup, confirmSetup, cancelSetup, open, remove } =
    useWorkstations();
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [view, setView] = useState(MAIN_VIEWS[0].id);
  const [opened, setOpened] = useState<string[]>([]);
  useEffect(() => void appInfo().then(setInfo), []);
  useEffect(() => setOpened((all) => (all.includes(view) ? all : [...all, view])), [view]);
  useEffect(() => {
    document.addEventListener("contextmenu", blockBrowserMenu);
    return () => document.removeEventListener("contextmenu", blockBrowserMenu);
  }, []);

  const banner = <StatusBanner error={error} notice={notice} offerSetup={offerSetup} onSetup={setup} />;
  const current = listing?.workstations.find((w) => w.root === listing.open) ?? listing?.workstations[0];
  // Native until Rust answers, so a system-framed window never shows a second set of buttons.
  const frame = info?.frame ?? "native";
  // Only the header's empty parts and the path drag the window; its controls stay clickable.
  const drag = frame === "custom" || undefined;

  return (
    <SettingsProvider>
      <div className="app">
        <AppBackdrop />
        <header className="header" data-frame={frame} data-tauri-drag-region={drag}>
          <div className="header-start" data-tauri-drag-region={drag}>
            {/* A button, not part of the drag area: a drag starts on mouse-down, so a click would never arrive. */}
            <Button
              variant="ghost"
              className="brand"
              icon={<img className="brand-icon" src={icon} alt="" draggable={false} />}
              aria-label={`Workstation: go to ${MAIN_VIEWS[0].label}`}
              onClick={() => setView(MAIN_VIEWS[0].id)}
            >
              Workstation
            </Button>
            {listing && current && (
              <>
                <WorkstationSwitcher
                  listing={listing}
                  current={current}
                  onOpen={open}
                  onAdd={add}
                  onSetup={() => setup()}
                  onRemove={remove}
                />
                <span className="title-path" data-tauri-drag-region={drag}>
                  {current.root}
                </span>
              </>
            )}
          </div>
          {current && TABS.length > 1 && (
            <Tabs variant="nav" aria-label="Views" tabs={TABS} value={view} onValueChange={setView} />
          )}
          <div className="header-end">
            <UpdateChip />
            {current &&
              HEADER_VIEWS.map(({ id, label, icon }) => (
                <IconButton
                  key={id}
                  icon={<Icon icon={icon} />}
                  label={label}
                  active={view === id}
                  aria-current={view === id ? "page" : undefined}
                  // A second click goes back to the first main view.
                  onClick={() => setView(view === id ? MAIN_VIEWS[0].id : id)}
                />
              ))}
            {frame === "custom" && <WindowControls />}
          </div>
        </header>
        {!listing ? (
          <main className="center">
            {error ? (
              <Notice tone="danger" role="alert" className="selectable">
                {error}
              </Notice>
            ) : (
              <Spinner label="Loading" />
            )}
          </main>
        ) : !current ? (
          <FirstRun banner={banner} onAdd={add} onSetup={() => setup()} />
        ) : (
          <>
            {banner}
            <div className="views">
              {ALL_VIEWS.filter(({ id }) => id === view || opened.includes(id)).map(({ id, label, Page }) => (
                <main key={id} className="view" aria-label={label} hidden={id !== view}>
                  <Page workstation={current} />
                </main>
              ))}
            </div>
          </>
        )}
        <AlertDialog
          open={pendingSetup !== null}
          onOpenChange={(isOpen) => !isOpen && cancelSetup()}
          title={`Set up a workstation in ${pendingSetup ?? "this folder"}?`}
          description="This adds the starter folders, rules and projects.json. Files already there are kept as they are."
          confirmLabel="Set it up"
          tone="accent"
          onConfirm={confirmSetup}
        />
      </div>
    </SettingsProvider>
  );
}
