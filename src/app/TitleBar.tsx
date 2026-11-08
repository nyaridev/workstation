// TitleBar: the window's own title bar (the window has no Windows frame): the mark and name, what the screen puts in
// it, a drag area (double-click maximizes), the update button when there's a newer release, then minimize, maximize
// and close.

import { type ReactNode, useEffect, useState } from "react";
import { closeWindow, minimizeWindow, onMaximizedChange, toggleMaximizeWindow } from "../lib/backend";
import { UpdateChip } from "./UpdateChip";

interface Props {
  /** The screen's controls, after the name (the workstation switcher and path). */
  children?: ReactNode;
}

const button = "grid h-full w-12 place-items-center text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100";

// Windows-style 10 px glyphs, drawn in one-pixel lines.
const glyph = (path: string) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden="true">
    <path d={path} />
  </svg>
);

/** The bar across the top of every screen. */
export function TitleBar({ children }: Props) {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => onMaximizedChange(setMaximized), []);

  return (
    <header
      data-tauri-drag-region
      className="flex h-11 shrink-0 select-none items-center gap-3 border-zinc-800 border-b bg-zinc-950 pl-3"
    >
      <svg width="18" height="18" viewBox="0 0 512 512" aria-hidden="true" data-tauri-drag-region>
        <g fill="#38bdf8" fillOpacity="0.4">
          <rect x="8" y="8" width="232" height="232" rx="56" />
          <rect x="8" y="272" width="232" height="232" rx="56" />
          <rect x="272" y="272" width="232" height="232" rx="56" />
        </g>
        <path
          fill="#38bdf8"
          fillRule="evenodd"
          d="M328 8H448A56 56 0 0 1 504 64V184A56 56 0 0 1 448 240H328A56 56 0 0 1 272 184V64A56 56 0 0 1 328 8ZM372 76H404A32 32 0 0 1 436 108V140A32 32 0 0 1 404 172H372A32 32 0 0 1 340 140V108A32 32 0 0 1 372 76Z"
        />
      </svg>
      <span data-tauri-drag-region className="font-semibold text-sm text-zinc-200">
        Workstation
      </span>
      {children}
      <div data-tauri-drag-region className="h-full min-w-6 flex-1" />
      <UpdateChip />
      <div className="flex h-full">
        <button type="button" aria-label="Minimize" onClick={minimizeWindow} className={button}>
          {glyph("M0 5.5h10")}
        </button>
        <button
          type="button"
          aria-label={maximized ? "Restore down" : "Maximize"}
          onClick={toggleMaximizeWindow}
          className={button}
        >
          {maximized ? glyph("M2.5 .5h7v7M.5 2.5h7v7h-7z") : glyph("M.5 .5h9v9h-9z")}
        </button>
        <button
          type="button"
          aria-label="Close"
          onClick={closeWindow}
          className="grid h-full w-12 place-items-center text-zinc-400 hover:bg-[#c42b1c] hover:text-white"
        >
          {glyph("M.5 .5l9 9M9.5 .5l-9 9")}
        </button>
      </div>
    </header>
  );
}
