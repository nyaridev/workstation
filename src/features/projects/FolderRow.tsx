// FolderRow: an important folder inside an expanded project (a game home's `game/` or `docs/`): its name, whether
// it's a repo with its git badges, and Pull (for a repo that tracks an upstream, ADR-0018) and Open folder buttons,
// as an iro-ui ListItem. A repo folder's row opens its git overview;
// a right click offers the same actions.

import { ContextMenu, Icon, IconButton, ListItem, type MenuEntry } from "iro-ui";
import { ArrowDownIcon, FolderIcon, FolderOpenIcon } from "iro-ui/icons";
import { useState } from "react";
import type { Folder, GitStatus } from "../../lib/types";
import { GitBadges } from "./GitBadges";

interface Props {
  folder: Folder;
  git: GitStatus | undefined;
  onOpen: (path: string) => void;
  /** Pulls this repo; settles when it's done. */
  onPull: () => Promise<void>;
  /** Opens this repo's remote page in the browser. */
  onOpenPage: () => void;
  onHistory: () => void;
}

/** One line per folder, lighter than a project row. */
export function FolderRow({ folder, git, onOpen, onPull, onOpenPage, onHistory }: Props) {
  const [pulling, setPulling] = useState(false);
  const hasHistory = folder.repo && git !== undefined;
  // Only when the remote has commits this copy lacks (as of the last fetch).
  const canPull = (git?.behind ?? 0) > 0;
  const pull = async () => {
    setPulling(true);
    await onPull();
    setPulling(false);
  };
  const menu: MenuEntry[] = [
    ...(hasHistory ? [{ label: "Git overview", onSelect: onHistory }] : []),
    ...(canPull ? [{ label: "Pull from the remote", onSelect: () => void pull(), disabled: pulling }] : []),
    { label: "Open folder", onSelect: () => onOpen(folder.path) },
    ...(git?.owner ? [{ label: "Open in browser", onSelect: onOpenPage }] : []),
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
            <>
              {canPull && (
                <IconButton
                  size="sm"
                  icon={<Icon icon={ArrowDownIcon} />}
                  label="Pull from the remote"
                  loading={pulling}
                  onClick={() => void pull()}
                />
              )}
              <IconButton
                size="sm"
                icon={<Icon icon={FolderOpenIcon} />}
                label="Open folder"
                onClick={() => onOpen(folder.path)}
              />
            </>
          }
        />
      </ContextMenu>
    </li>
  );
}
