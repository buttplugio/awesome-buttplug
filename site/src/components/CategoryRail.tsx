import type { FunctionalComponent } from "preact";
import { CATEGORIES } from "../utils/categories";

interface Props {
  counts: Map<string, number>;
  total: number;
  selected: string;
  onSelect: (slug: string) => void;
}

const CategoryRail: FunctionalComponent<Props> = ({ counts, total, selected, onSelect }) => {
  return (
    <div class="category-rail" role="group" aria-label="Categories">
      <button
        class={`rail-chip ${selected === "all" ? "on" : ""}`}
        aria-pressed={selected === "all"}
        onClick={() => onSelect("all")}
      >
        All <span class="rail-count">{total}</span>
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category.slug}
          class={`rail-chip ${selected === category.slug ? "on" : ""}`}
          aria-pressed={selected === category.slug}
          onClick={() => onSelect(category.slug)}
        >
          {category.label} <span class="rail-count">{counts.get(category.slug) ?? 0}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryRail;
