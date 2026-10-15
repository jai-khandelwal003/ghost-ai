import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-base px-6 text-center">
      <Lock className="h-8 w-8 text-copy-faint" />
      <h1 className="text-lg font-medium text-copy-primary">Access denied</h1>
      <p className="max-w-md text-sm text-copy-muted">
        This project does not exist or you do not have access to it.
      </p>
      <Link
        href="/editor"
        className={buttonVariants({ variant: "outline", className: "mt-2" })}
      >
        Back to projects
      </Link>
    </div>
  );
}
