import { EditorHome } from "@/components/editor/editor-home";
import { EditorShell } from "@/components/editor/editor-shell";
import { getSidebarProjects, getViewer } from "@/lib/projects";

export default async function EditorPage() {
  const viewer = await getViewer();
  const projects = await getSidebarProjects(viewer);

  return (
    <EditorShell {...projects}>
      <EditorHome />
    </EditorShell>
  );
}
