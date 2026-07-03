import type { FunctionalComponent } from "preact";
import { useState, useMemo, useCallback, useEffect } from "preact/hooks";
import type { ProjectEntry } from "../types";
import { filterProjects } from "../utils/filterProjects";
import { parseFilterState, serializeFilterState } from "../utils/filterState";
import CategoryRail from "./CategoryRail";
import TagBar from "./TagBar";
import CardGrid from "./CardGrid";
import ViewToggle from "./ViewToggle";
import type { ViewMode } from "./ViewToggle";

interface Props {
  projects: ProjectEntry[];
}

const ProjectFilter: FunctionalComponent<Props> = ({ projects }) => {
  const validTags = useMemo(() => new Set(projects.flatMap((project) => project.tags)), [projects]);

  const initialState = useMemo(() => {
    if (typeof window === "undefined") return { category: "all", tags: [] as string[] };
    return parseFilterState(window.location.search, validTags);
  }, [validTags]);

  const [category, setCategory] = useState<string>(initialState.category);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialState.tags);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "compact";
    return window.localStorage.getItem("ab-view-mode") === "visual" ? "visual" : "compact";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = serializeFilterState({ category, tags: selectedTags });
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [category, selectedTags]);

  const filtered = useMemo(
    () => filterProjects(projects, category, selectedTags),
    [projects, category, selectedTags],
  );

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
        <ViewToggle mode={viewMode} onChange={changeViewMode} />
      </div>
      <CardGrid projects={filtered} viewMode={viewMode} />
    </div>
  );
};

export default ProjectFilter;
