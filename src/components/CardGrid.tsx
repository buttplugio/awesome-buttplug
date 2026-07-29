import type { FunctionalComponent } from "preact";
import type { ProjectEntry } from "../types";
import type { ViewMode } from "./ViewToggle";
import { stripInlineMarkdown } from "../utils/displayText";
import { gradientForId } from "../utils/monogram";
import { isDeprecated } from "../utils/categories";
import { projectActions } from "../utils/projectLinks";

interface Props {
  projects: ProjectEntry[];
  viewMode: ViewMode;
}

const CardGrid: FunctionalComponent<Props> = ({ projects, viewMode }) => {
  if (projects.length === 0) {
    return <p class="no-results">No projects match the selected filters.</p>;
  }

  return (
    <div class={`card-grid view-${viewMode}`}>
      {projects.map((project) => {
        const deprecated = isDeprecated(project);
        const pricing = project.pricing ? stripInlineMarkdown(project.pricing) : undefined;
        const summary = stripInlineMarkdown(project.summary);
        const deprecationReason = project.deprecation_reason
          ? stripInlineMarkdown(project.deprecation_reason)
          : undefined;
        const [from, to] = gradientForId(project.id);
        const actions = projectActions(project);

        return (
          <div key={project.id} class={`card ${deprecated ? "deprecated" : ""}`}>
            {project.image ? (
              <img src={project.image} alt="" class="card-media" loading="lazy" />
            ) : (
              <div
                class="card-media card-monogram"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                {project.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div class="card-body">
              <h3 class="card-title">
                <a href={`/projects/${project.id}`} class="card-link">
                  {project.title}
                </a>
              </h3>
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
              <div class="card-actions">
                {actions.map((action) => (
                  <a
                    key={action.kind}
                    href={action.href}
                    class="pill card-action"
                    aria-label={action.ariaLabel}
                    rel={action.external ? "noopener noreferrer" : undefined}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardGrid;
