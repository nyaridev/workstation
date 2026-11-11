// FolderRow: an important folder inside an expanded project (a game home's `game/` or `docs/`): its name, whether
// it's a repo with its git badges, and Open folder. A repo folder's row opens its git overview.

import { Button, Icon } from "iro-ui";
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
  return (
    <li className="row folder-row" data-clickable={hasHistory || undefined}>
      {/* Lies under the row's content, like ProjectRow's, so the whole row opens the overview. */}
      {hasHistory && (
        <button
          type="button"
          aria-label={`Show the git history of ${folder.name}`}
          onClick={onHistory}
          className="row-hit"
        />
      )}
      <span className="row-body row-head">
        <Icon icon={FolderIcon} className="muted" />
        <span>{folder.name}</span>
        <span className="muted small">{folder.repo ? "repo" : "folder"}</span>
        <GitBadges git={git} />
        <code className="folder-path">{folder.path}</code>
      </span>
      <Button size="sm" variant="ghost" className="row-actions" onClick={() => onOpen(folder.path)}>
        Open folder
      </Button>
    </li>
  );
}
