export interface ProjectEntry {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  image?: string;
  pricing?: string;
  deprecation_reason?: string;
}
