import { CATEGORIES } from "./categories";
import { DEFAULT_SORT_MODE, SORT_MODES, type SortMode } from "./sortProjects";

export interface FilterState {
  category: string;
  tags: string[];
  sort: SortMode;
}

const VALID_CATEGORY_SLUGS = new Set(CATEGORIES.map((category) => category.slug));
const VALID_SORT_MODES = new Set<string>(SORT_MODES);

export function parseFilterState(search: string, validTags: Set<string>): FilterState {
  const params = new URLSearchParams(search);
  const cat = params.get("cat") ?? "all";
  const category = VALID_CATEGORY_SLUGS.has(cat) ? cat : "all";
  const tags = (params.get("tags") ?? "")
    .split(",")
    .filter((tag) => validTags.has(tag));
  const s = params.get("sort") ?? "";
  const sort = (VALID_SORT_MODES.has(s) ? s : DEFAULT_SORT_MODE) as SortMode;

  return { category, tags, sort };
}

export function serializeFilterState(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.category !== "all") params.set("cat", state.category);
  if (state.tags.length > 0) params.set("tags", state.tags.join(","));
  if (state.sort !== DEFAULT_SORT_MODE) params.set("sort", state.sort);
  return params.toString();
}
