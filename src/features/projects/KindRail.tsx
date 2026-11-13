// KindRail: the kind groups as a column beside the list (filter layout 3, `filterLayout.ts`): All, then each kind with
// its count; picking one shows only that group.

import { Icon, ListItem } from "iro-ui";
import { ANY } from "./filter";
import { groupIcon } from "./groupIcons";

interface Props {
  /** The kind groups with how many projects each holds under the other filters. */
  groups: { label: string; count: number }[];
  /** The picked group; `ANY` for all. */
  value: string;
  onChange: (group: string) => void;
}

/** The column of kinds. */
export function KindRail({ groups, value, onChange }: Props) {
  const kinds = [{ label: ANY, count: groups.reduce((sum, g) => sum + g.count, 0) }, ...groups];
  return (
    <nav className="kind-rail" aria-label="Kind">
      <ul className="kind-rail-list">
        {kinds.map((kind) => (
          <ListItem
            key={kind.label}
            as="li"
            title={kind.label || "All"}
            start={<Icon icon={groupIcon(kind.label)} />}
            meta={<span className="muted small">{kind.count}</span>}
            selected={value === kind.label}
            onClick={() => onChange(kind.label)}
          />
        ))}
      </ul>
    </nav>
  );
}
