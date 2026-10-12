import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-provider";

export default function EditorLayout({ children }: LayoutProps<"/editor">) {
  return <ProjectDialogsProvider>{children}</ProjectDialogsProvider>;
}
