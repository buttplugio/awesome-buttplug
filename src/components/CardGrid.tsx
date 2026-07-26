import type { FunctionalComponent } from "preact";
import type { ProjectEntry } from "../types";
import type { ViewMode } from "./ViewToggle";
import { stripInlineMarkdown } from "../utils/displayText";
import { gradientForId } from "../utils/monogram";
import { isDeprecated } from "../utils/categories";

interface Props {
  projects: ProjectEntry[];
  viewMode: ViewMode;
}

const CardGrid: FunctionalComponent<Props> = ({ projects, viewMode }) => {
  if (projects.length === 0) {
    return <p class="no-results">No projects match the selected filters.</p>;
  }

  return (
    <div class="card-grid">
      {projects.map((project) => {
        const deprecated = isDeprecated(project);
        const pricing = project.pricing ? stripInlineMarkdown(project.pricing) : undefined;
        const summary = stripInlineMarkdown(project.summary);
        const deprecationReason = project.deprecation_reason
          ? stripInlineMarkdown(project.deprecation_reason)
          : undefined;
        const [from, to] = gradientForId(project.id);

        return (
          <a
            key={project.id}
            href={`/projects/${project.id}`}
            class={`card ${deprecated ? "deprecated" : ""}`}
          >
            {viewMode === "visual" &&
              (project.image ? (
                <img src={project.image} alt="" class="card-media" loading="lazy" />
              ) : (
                <div
                  class="card-media card-monogram"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  {project.title.charAt(0).toUpperCase()}
                </div>
              ))}
            <div class="card-body">
              <h3 class="card-title">{project.title}</h3>
              {deprecated && <span class="badge badge-deprecated">Deprecated</span>}
              {pricing && !deprecated && (
                <span class="badge badge-pricing">{pricing}</span>
              )}
              <p class="card-summary">{summary}</p>
              {deprecationReason && (
                <p class="card-deprecation">{deprecationReason}</p>
              )}
              <div class="card-tags">
                {project.tags
                  .filter((tag) => tag !== "deprecated")
                  .slice(0, 4)
                  .map((tag) => (
                    <span key={tag} class="pill pill-sm">
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default CardGrid;
