import type { FunctionalComponent } from "preact";
import { useState } from "preact/hooks";
import { computeTagDisplay } from "../utils/tagDisplay";

interface Props {
  tags: Map<string, number>;
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}

const TagBar: FunctionalComponent<Props> = ({ tags, selected, onToggle, onClear }) => {
  const [expanded, setExpanded] = useState(false);
  const { visible, hiddenCount } = computeTagDisplay(tags, selected, expanded);

  return (
    <div class="tag-bar">
      <div class="tag-list">
        {visible.map(([tag, count]) => {
          const isActive = selected.includes(tag);
          return (
            <button
              key={tag}
              class={`tag-pill ${isActive ? "active" : ""} ${count === 0 && !isActive ? "dimmed" : ""}`}
              aria-pressed={isActive}
              onClick={() => onToggle(tag)}
            >
              {tag} <span class="tag-count">{count}</span>
            </button>
          );
        })}
        {hiddenCount > 0 && (
          <button class="tag-expander" onClick={() => setExpanded(true)}>
            +{hiddenCount} more
          </button>
        )}
        {expanded && (
          <button class="tag-expander" onClick={() => setExpanded(false)}>
            show fewer
          </button>
        )}
        {selected.length > 0 && (
          <button class="tag-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default TagBar;
