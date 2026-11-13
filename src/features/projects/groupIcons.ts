// Group icons: the icon for each kind group (Games, Apps…), shared by the group headings and the kind filters.

import {
  AppWindowIcon,
  ArchiveIcon,
  FlaskIcon,
  FolderIcon,
  FoldersIcon,
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
/** The icon for a group's label; `""` (every kind) gets the folders icon, an unknown group a folder. */
export function groupIcon(label: string): typeof FolderIcon {
  return label === "" ? FoldersIcon : (GROUP_ICONS[label] ?? FolderIcon);
}
