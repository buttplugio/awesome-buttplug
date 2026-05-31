import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const tagSlug = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Tags must be URL-safe slugs: lowercase letters, numbers, and hyphens only"
);

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    repo: z.string().url().optional(),
    section: z.string(),
    tags: z.array(tagSlug).min(1),
    image: z.string().optional(),
    pricing: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    summary: z.string(),
    readme_bullets: z.array(z.string()).min(1),
    deprecation_reason: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { projects };
