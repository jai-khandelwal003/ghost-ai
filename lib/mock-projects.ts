export type ProjectRole = "owner" | "collaborator";

export interface Project {
  id: string;
  name: string;
  slug: string;
  role: ProjectRole;
}

// Placeholder data until projects are loaded from the database.
export const MOCK_PROJECTS: Project[] = [
  {
    id: "mock-1",
    name: "Payments Platform",
    slug: "payments-platform",
    role: "owner",
  },
  {
    id: "mock-2",
    name: "Realtime Chat Service",
    slug: "realtime-chat-service",
    role: "owner",
  },
  {
    id: "mock-3",
    name: "Search Indexing Pipeline",
    slug: "search-indexing-pipeline",
    role: "collaborator",
  },
];
