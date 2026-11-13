// FolderRow: an important folder inside an expanded project (a game home's `game/` or `docs/`): its name, whether
// it's a repo with its git badges, and Open folder, as an iro-ui ListItem. A repo folder's row opens its git overview;
// a right click offers the same actions.

import { Button, ContextMenu, Icon, ListItem, type MenuEntry } from "iro-ui";
import { FolderIcon } from "iro-ui/icons";
import type { Folder, GitStatus } from "../../lib/types";
import { GitBadges } from "./GitBadges";

interface Props {
  folder: Folder;
  git: GitStatus | undefined;
  onOpen: (path: string) => void;
  onHistory: () => void;
}

/** One line per folder, lighter than a project row. */
export function FolderRow({ folder, git, onOpen, onHistory }: Props) {
  const hasHistory = folder.repo && git !== undefined;
  const menu: MenuEntry[] = [
    ...(hasHistory ? [{ label: "Git overview", onSelect: onHistory }] : []),
    { label: "Open folder", onSelect: () => onOpen(folder.path) },
  ];

  return (
    <li className="folder-row">
      <ContextMenu items={menu}>
        <ListItem
          start={<Icon icon={FolderIcon} />}
          title={
            <span className="folder-title">
              {folder.name}
              <span className="muted small">{folder.repo ? "repo" : "folder"}</span>
              <GitBadges git={git} />
            </span>
          }
          meta={<code className="folder-path">{folder.path}</code>}
          onClick={hasHistory ? onHistory : undefined}
          actions={
            <Button size="sm" variant="ghost" onClick={() => onOpen(folder.path)}>
              Open folder
            </Button>
          }
        />
      </ContextMenu>
    </li>
  );
}
