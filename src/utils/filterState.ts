import { CATEGORIES } from "./categories";

export interface FilterState {
  category: string;
  tags: string[];
}

const VALID_CATEGORY_SLUGS = new Set(CATEGORIES.map((category) => category.slug));

export function parseFilterState(search: string, validTags: Set<string>): FilterState {
  const params = new URLSearchParams(search);
  const cat = params.get("cat") ?? "all";
  const category = VALID_CATEGORY_SLUGS.has(cat) ? cat : "all";
  const tags = (params.get("tags") ?? "")
    .split(",")
    .filter((tag) => validTags.has(tag));

  return { category, tags };
}

export function serializeFilterState(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.category !== "all") params.set("cat", state.category);
  if (state.tags.length > 0) params.set("tags", state.tags.join(","));
  return params.toString();
}
