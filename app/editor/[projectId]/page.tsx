import { AccessDenied } from "@/components/editor/access-denied";
import { CanvasPlaceholder } from "@/components/editor/canvas-placeholder";
import { EditorShell } from "@/components/editor/editor-shell";
import { getAccessibleProject, requireIdentity } from "@/lib/project-access";
import { getSidebarProjects } from "@/lib/projects";

export default async function WorkspacePage({
  params,
}: PageProps<"/editor/[projectId]">) {
  const { projectId } = await params;
  const identity = await requireIdentity();

  const project = await getAccessibleProject(projectId, identity);
  if (!project) return <AccessDenied />;

  const projects = await getSidebarProjects(identity);

  return (
    <EditorShell {...projects} project={project}>
      <CanvasPlaceholder />
    </EditorShell>
  );
}
