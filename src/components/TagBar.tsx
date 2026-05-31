import type { FunctionalComponent } from "preact";

interface Props {
  tags: Map<string, number>;
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}

const TagBar: FunctionalComponent<Props> = ({ tags, selected, onToggle, onClear }) => {
  return (
    <div class="tag-bar">
      {selected.length > 0 && (
        <button class="tag-clear" onClick={onClear}>
          Clear filters
        </button>
      )}
      <div class="tag-list">
        {Array.from(tags.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([tag, count]) => {
            const isActive = selected.includes(tag);
            return (
              <button
                key={tag}
                class={`tag-pill ${isActive ? "active" : ""} ${count === 0 && !isActive ? "dimmed" : ""}`}
                onClick={() => onToggle(tag)}
              >
                {tag} <span class="tag-count">({count})</span>
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default TagBar;
