// FolderRow: an important folder inside an expanded project (a game home's `game/` or `docs/`): its name, whether
// it's a repo with its git badges, and Open folder.

import type { Folder, GitStatus } from "../../lib/types";
import { GitBadges } from "./GitBadges";

interface Props {
  folder: Folder;
  git: GitStatus | undefined;
  onOpen: (path: string) => void;
}

/** One line per folder, lighter than a project row. */
export function FolderRow({ folder, git, onOpen }: Props) {
  return (
    <li className="flex items-center gap-3 py-1.5 pr-4 pl-4">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        className="shrink-0 text-zinc-500"
      >
        <path d="M1.5 4.5v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H8L6.5 3.5h-4a1 1 0 0 0-1 1Z" />
      </svg>
      <span className="text-sm text-zinc-200">{folder.name}</span>
      <span className="text-xs text-zinc-500">{folder.repo ? "repo" : "folder"}</span>
      <GitBadges git={git} />
      <code className="min-w-0 flex-1 truncate text-xs text-zinc-600">{folder.path}</code>
      <button
        type="button"
        onClick={() => onOpen(folder.path)}
        className="rounded-md px-2.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        Open folder
      </button>
    </li>
  );
}
