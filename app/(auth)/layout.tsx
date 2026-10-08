import type { LucideIcon } from "lucide-react";
import { FileText, Ghost, Sparkles, Users } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description: "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-base lg:grid-cols-2">
      <aside className="hidden flex-col border-r border-surface-border bg-elevated px-12 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand">
            <Ghost className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-copy-primary">Ghost AI</span>
        </div>

        <div className="my-auto max-w-lg">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-copy-primary">
            Design systems at the speed of thought.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-copy-secondary">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="mt-12 space-y-7">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-border-subtle bg-accent-dim">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-base font-medium text-copy-primary">{title}</p>
                  <p className="mt-1 text-sm text-copy-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
