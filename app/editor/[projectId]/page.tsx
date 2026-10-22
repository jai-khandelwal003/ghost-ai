import { CanvasRoom, WorkspaceRoom } from "@/components/canvas/canvas-room";
import { AccessDenied } from "@/components/editor/access-denied";
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
    // The room wraps the whole shell: the AI sidebar reads presence and the AI status feed too.
    <WorkspaceRoom roomId={project.id}>
      <EditorShell {...projects} project={project}>
        <CanvasRoom />
      </EditorShell>
    </WorkspaceRoom>
  );
}
