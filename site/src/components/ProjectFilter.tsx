import type { FunctionalComponent } from "preact";
import { useState, useMemo, useCallback, useEffect } from "preact/hooks";
import type { ProjectEntry } from "../types";
import { deprecatedLast, filterProjects } from "../utils/filterProjects";
import { parseFilterState, serializeFilterState } from "../utils/filterState";
import { DEFAULT_SORT_MODE, DEFAULT_RANDOM_SEED, newRandomSeed, sortProjects } from "../utils/sortProjects";
import type { SortMode } from "../utils/sortProjects";
import CategoryRail from "./CategoryRail";
import TagBar from "./TagBar";
import CardGrid from "./CardGrid";
import ViewToggle from "./ViewToggle";
import type { ViewMode } from "./ViewToggle";
import SortToggle from "./SortToggle";

interface Props {
  projects: ProjectEntry[];
}

const ProjectFilter: FunctionalComponent<Props> = ({ projects }) => {
  const validTags = useMemo(() => new Set(projects.flatMap((project) => project.tags)), [projects]);

  const initialState = useMemo(() => {
    if (typeof window === "undefined")
      return { category: "all", tags: [] as string[], sort: DEFAULT_SORT_MODE };
    return parseFilterState(window.location.search, validTags);
  }, [validTags]);

  const [category, setCategory] = useState<string>(initialState.category);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialState.tags);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE);
  const [randomSeed, setRandomSeed] = useState(DEFAULT_RANDOM_SEED);

  /* Adopted after mount rather than in the initialiser, for the same reason as
     ab-view-mode below. The site is fully static: one HTML file serves every
     query string, so it is always rendered in the default order. Seeding sort
     from the URL during render would reorder all 405 cards on the first client
     render and disagree with that HTML — unlike cat and tags, which only ever
     remove cards and so stay an order-preserving subsequence of it. The effect
     also forces a real re-render, which hydrate() alone will not do. The seed
     is deliberately not in the URL, and the server has no source of randomness
     the client could reproduce, so it is drawn here too. */
  useEffect(() => {
    if (initialState.sort === "random") setRandomSeed(newRandomSeed());
    setSortMode(initialState.sort);
  }, []);

  const changeSort = useCallback((mode: SortMode) => {
    if (mode === "random") setRandomSeed(newRandomSeed());
    setSortMode(mode);
  }, []);

  /* Read after mount rather than in the initialiser. The server has no
     localStorage and always renders "compact", so initialising from it made a
     returning Visual user's first client render disagree with the SSR HTML.
     An effect also forces a real re-render, which hydrate() alone will not do:
     it never diffs attributes against existing DOM, so a class set only during
     hydration would be dropped. */
  useEffect(() => {
    if (window.localStorage.getItem("ab-view-mode") === "visual") {
      setViewMode("visual");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = serializeFilterState({ category, tags: selectedTags, sort: sortMode });
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [category, selectedTags, sortMode]);

  const filtered = useMemo(
    () => filterProjects(projects, category, selectedTags),
    [projects, category, selectedTags],
  );

  const visible = useMemo(() => {
    const sorted = sortProjects(filtered, sortMode, randomSeed);
    return category === "all" ? deprecatedLast(sorted) : sorted;
  }, [filtered, sortMode, randomSeed, category]);

  const railCounts = useMemo(() => {
    const tagFiltered = filterProjects(projects, "all", selectedTags);
    const counts = new Map<string, number>();
    for (const project of tagFiltered) {
      counts.set(project.category, (counts.get(project.category) ?? 0) + 1);
    }
    return counts;
  }, [projects, selectedTags]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tag of validTags) {
      counts.set(tag, filtered.filter((project) => project.tags.includes(tag)).length);
    }
    return counts;
  }, [validTags, filtered]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((selected) => selected !== tag) : [...prev, tag],
    );
  }, []);

  const clearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const changeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem("ab-view-mode", mode);
  }, []);

  return (
    <div data-pagefind-ignore>
      <CategoryRail
        counts={railCounts}
        total={projects.length}
        selected={category}
        onSelect={setCategory}
      />
      <TagBar
        tags={tagCounts}
        selected={selectedTags}
        onToggle={toggleTag}
        onClear={clearTags}
      />
      <div class="toolbar">
        <p class="result-count">
          Showing {filtered.length} of {projects.length} projects
        </p>
        <div class="toolbar-controls">
          <SortToggle mode={sortMode} onChange={changeSort} />
          <ViewToggle mode={viewMode} onChange={changeViewMode} />
        </div>
      </div>
      <CardGrid projects={visible} viewMode={viewMode} />
    </div>
  );
};

export default ProjectFilter;
