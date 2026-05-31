import type { FunctionalComponent } from "preact";
import { useState, useMemo, useCallback } from "preact/hooks";
import type { ProjectEntry } from "../types";
import TagBar from "./TagBar";
import CardGrid from "./CardGrid";

interface Props {
  projects: ProjectEntry[];
}

const ProjectFilter: FunctionalComponent<Props> = ({ projects }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (selectedTags.length === 0) return projects;
    return projects.filter((p) =>
      selectedTags.every((tag) => p.tags.includes(tag))
    );
  }, [projects, selectedTags]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const allTags = new Set(projects.flatMap((p) => p.tags));
    for (const tag of allTags) {
      const wouldMatch = filtered.filter((p) => p.tags.includes(tag)).length;
      counts.set(tag, wouldMatch);
    }
    return counts;
  }, [projects, filtered]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const clearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  return (
    <div>
      <TagBar
        tags={tagCounts}
        selected={selectedTags}
        onToggle={toggleTag}
        onClear={clearTags}
      />
      <p class="result-count">
        Showing {filtered.length} of {projects.length} projects
      </p>
      <CardGrid projects={filtered} />
    </div>
  );
};

export default ProjectFilter;
