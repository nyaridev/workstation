// Views: the pages the header switches between. Add a view here and give it a folder in `src/features/`.

import type { IconData } from "iro-ui/icons";
import { FoldersIcon, SettingsIcon } from "iro-ui/icons";
import type { ComponentType } from "react";
import { ProjectsView } from "../features/projects/ProjectsView";
import { SettingsView } from "../features/settings/SettingsView";
import type { Workstation } from "../lib/types";

// ── Types ─────────────────────────────────
/** What every view gets: the open workstation. */
export interface ViewProps {
  workstation: Workstation;
}

export interface View {
  id: string;
  label: string;
  icon: IconData;
  Page: ComponentType<ViewProps>;
}

// ── Public API ────────────────────────────
/** The views in the header's tabs, in order; the tabs show once there are two. */
export const MAIN_VIEWS: View[] = [{ id: "projects", label: "Projects", icon: FoldersIcon, Page: ProjectsView }];

/** The views opened from the icon buttons at the header's right, in order. */
export const HEADER_VIEWS: View[] = [{ id: "settings", label: "Settings", icon: SettingsIcon, Page: SettingsView }];
