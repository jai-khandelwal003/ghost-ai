import { EditorHome } from "@/components/editor/editor-home";
import { EditorShell } from "@/components/editor/editor-shell";
import { requireIdentity } from "@/lib/project-access";
import { getSidebarProjects } from "@/lib/projects";

export default async function EditorPage() {
  const identity = await requireIdentity();
  const projects = await getSidebarProjects(identity);

  return (
    <EditorShell {...projects}>
      <EditorHome />
    </EditorShell>
  );
}
