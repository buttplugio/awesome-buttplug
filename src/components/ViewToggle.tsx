import type { FunctionalComponent } from "preact";

export type ViewMode = "compact" | "visual";

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewToggle: FunctionalComponent<Props> = ({ mode, onChange }) => {
  return (
    <div class="view-toggle" role="group" aria-label="View mode">
      <button
        class={mode === "compact" ? "on" : ""}
        aria-pressed={mode === "compact"}
        onClick={() => onChange("compact")}
      >
        Compact
      </button>
      <button
        class={mode === "visual" ? "on" : ""}
        aria-pressed={mode === "visual"}
        onClick={() => onChange("visual")}
      >
        Visual
      </button>
    </div>
  );
};

export default ViewToggle;
