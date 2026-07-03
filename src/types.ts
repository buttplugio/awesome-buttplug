export interface ProjectEntry {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  section: string;
  category: string;
  image?: string;
  pricing?: string;
  deprecation_reason?: string;
}
