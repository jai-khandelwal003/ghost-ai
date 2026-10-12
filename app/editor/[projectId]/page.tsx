import { notFound } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import {
  getAccessibleProject,
  getSidebarProjects,
  getViewer,
} from "@/lib/projects";

export default async function WorkspacePage({
  params,
}: PageProps<"/editor/[projectId]">) {
  const { projectId } = await params;
  const viewer = await getViewer();

  const [project, projects] = await Promise.all([
    getAccessibleProject(projectId, viewer),
    getSidebarProjects(viewer),
  ]);
  if (!project) notFound();

  // Placeholder until the canvas is built.
  return (
    <EditorShell {...projects}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-base px-6 text-center">
        <h1 className="text-lg font-medium text-copy-primary">
          {project.name}
        </h1>
        <p className="font-mono text-xs text-copy-muted">{project.id}</p>
      </div>
    </EditorShell>
  );
}
