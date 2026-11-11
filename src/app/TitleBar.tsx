// TitleBar: the window's own title bar (the window has no Windows frame): the mark and name, what the screen puts in
// it, a drag area (double-click maximizes), the update button when there's a newer release, then minimize, maximize
// and close. The window glyphs (a line, a square, two squares) are drawn here: iro-ui has none.

import { Icon, IconButton } from "iro-ui";
import { CloseIcon, icon } from "iro-ui/icons";
import { type ReactNode, useEffect, useState } from "react";
import { closeWindow, minimizeWindow, onMaximizedChange, toggleMaximizeWindow } from "../lib/backend";
import { UpdateChip } from "./UpdateChip";

// ── Constants ─────────────────────────────
const path = (d: string) => `<path d="${d}"/>`;
const MinimizeIcon = icon("window-minimize", { bold: path("M6 12h12") });
const MaximizeIcon = icon("window-maximize", {
  bold: path("M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"),
});
const RestoreIcon = icon("window-restore", {
  bold:
    path("M7 9h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z") +
    path("M9 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"),
});

// ── Types ─────────────────────────────────
interface Props {
  /** The screen's controls, after the name (the workstation switcher and path). */
  children?: ReactNode;
}

// ── Public API ────────────────────────────
/** The bar across the top of every screen. */
export function TitleBar({ children }: Props) {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => onMaximizedChange(setMaximized), []);

  return (
    <header data-tauri-drag-region className="titlebar">
      <svg className="mark" width="18" height="18" viewBox="0 0 512 512" aria-hidden="true" data-tauri-drag-region>
        <g fill="currentColor" fillOpacity="0.4">
          <rect x="8" y="8" width="232" height="232" rx="56" />
          <rect x="8" y="272" width="232" height="232" rx="56" />
          <rect x="272" y="272" width="232" height="232" rx="56" />
        </g>
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M328 8H448A56 56 0 0 1 504 64V184A56 56 0 0 1 448 240H328A56 56 0 0 1 272 184V64A56 56 0 0 1 328 8ZM372 76H404A32 32 0 0 1 436 108V140A32 32 0 0 1 404 172H372A32 32 0 0 1 340 140V108A32 32 0 0 1 372 76Z"
        />
      </svg>
      <span data-tauri-drag-region className="brand">
        Workstation
      </span>
      {children}
      <div data-tauri-drag-region className="titlebar-fill" />
      <UpdateChip />
      <div className="window-controls">
        <IconButton icon={<Icon icon={MinimizeIcon} />} label="Minimize" onClick={minimizeWindow} />
        <IconButton
          icon={<Icon icon={maximized ? RestoreIcon : MaximizeIcon} />}
          label={maximized ? "Restore down" : "Maximize"}
          onClick={toggleMaximizeWindow}
        />
        <IconButton className="window-close" icon={<Icon icon={CloseIcon} />} label="Close" onClick={closeWindow} />
      </div>
    </header>
  );
}
