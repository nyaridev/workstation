// Group icons: the icon for each kind group (Games, Apps…) in its heading.

import {
  AppWindowIcon,
  ArchiveIcon,
  FlaskIcon,
  FolderIcon,
  GamepadIcon,
  GlobeIcon,
  ImagesIcon,
  LayersIcon,
  LightbulbIcon,
  PuzzleIcon,
  ServerIcon,
  WrenchIcon,
} from "iro-ui/icons";

// ── Constants ─────────────────────────────
const GROUP_ICONS: Record<string, typeof FolderIcon> = {
  Games: GamepadIcon,
  Mods: PuzzleIcon,
  Emulators: ServerIcon,
  Apps: AppWindowIcon,
  Tools: WrenchIcon,
  Frameworks: LayersIcon,
  "Asset packs": ImagesIcon,
  Research: FlaskIcon,
  Ideas: LightbulbIcon,
  External: GlobeIcon,
  Archive: ArchiveIcon,
};

// ── Public API ────────────────────────────
/** The icon for a group's label; a group not listed gets a folder. */
export function groupIcon(label: string): typeof FolderIcon {
  return GROUP_ICONS[label] ?? FolderIcon;
}
