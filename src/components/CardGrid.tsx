import type { FunctionalComponent } from "preact";
import type { ProjectEntry } from "../types";

interface Props {
  projects: ProjectEntry[];
}

const CardGrid: FunctionalComponent<Props> = ({ projects }) => {
  if (projects.length === 0) {
    return <p class="no-results">No projects match the selected filters.</p>;
  }

  return (
    <div class="card-grid">
      {projects.map((project) => {
        const isDeprecated = project.tags.includes("deprecated");
        const cardImage = project.image || "/images/placeholder.svg";

        return (
          <a
            key={project.id}
            href={`/projects/${project.id}`}
            class={`card ${isDeprecated ? "deprecated" : ""}`}
          >
            <img src={cardImage} alt={project.title} class="card-image" loading="lazy" />
            <div class="card-body">
              <h3 class="card-title">{project.title}</h3>
              {isDeprecated && <span class="badge badge-deprecated">Deprecated</span>}
              {project.pricing && !isDeprecated && (
                <span class="badge badge-pricing">{project.pricing}</span>
              )}
              <p class="card-summary">{project.summary}</p>
              {project.deprecation_reason && (
                <p class="card-deprecation">{project.deprecation_reason}</p>
              )}
              <div class="card-tags">
                {project.tags
                  .filter((t) => t !== "deprecated")
                  .map((tag) => (
                    <span key={tag} class="tag-pill-display">
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
