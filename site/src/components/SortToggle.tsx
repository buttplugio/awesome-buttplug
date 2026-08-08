import type { FunctionalComponent } from "preact";
import type { SortMode } from "../utils/sortProjects";

interface Props {
  mode: SortMode;
  onChange: (mode: SortMode) => void;
}

const SortToggle: FunctionalComponent<Props> = ({ mode, onChange }) => {
  return (
    <div class="sort-toggle" role="group" aria-label="Sort order">
      <button
        class={mode === "alphabetical" ? "on" : ""}
        aria-pressed={mode === "alphabetical"}
        onClick={() => onChange("alphabetical")}
      >
        A–Z
      </button>
      <button
        class={mode === "newest" ? "on" : ""}
        aria-pressed={mode === "newest"}
        onClick={() => onChange("newest")}
      >
        Newest
      </button>
      <button
        class={mode === "oldest" ? "on" : ""}
        aria-pressed={mode === "oldest"}
        onClick={() => onChange("oldest")}
      >
        Oldest
      </button>
      <button
        class={mode === "random" ? "on" : ""}
        aria-pressed={mode === "random"}
        onClick={() => onChange("random")}
      >
        Random
      </button>
    </div>
  );
};

export default SortToggle;
