// FolderRow: an important folder inside an expanded project (a game home's `game/` or `docs/`): its name, whether
// it's a repo with its git badges, and Open folder. A repo folder's row opens its git overview.

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
    <li className={`relative flex items-center gap-3 py-1.5 pr-4 pl-4 ${hasHistory ? "hover:bg-zinc-900" : ""}`}>
      {/* Lies under the row's content, like ProjectRow's, so the whole row opens the overview. */}
      {hasHistory && (
        <button
          type="button"
          aria-label={`Show the git history of ${folder.name}`}
          onClick={onHistory}
          className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-sky-500"
        />
      )}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        className="pointer-events-none relative shrink-0 text-zinc-500"
      >
        <path d="M1.5 4.5v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H8L6.5 3.5h-4a1 1 0 0 0-1 1Z" />
      </svg>
      <span className="pointer-events-none relative flex min-w-0 flex-1 items-center gap-3">
        <span className="text-sm text-zinc-200">{folder.name}</span>
        <span className="text-xs text-zinc-500">{folder.repo ? "repo" : "folder"}</span>
        <GitBadges git={git} />
        <code className="min-w-0 flex-1 truncate text-xs text-zinc-600">{folder.path}</code>
      </span>
      <button
        type="button"
        onClick={() => onOpen(folder.path)}
        className="relative rounded-md px-2.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        Open folder
      </button>
    </li>
  );
}
