"use client";

import { useCallback, useEffect, useState } from "react";

import { readError } from "@/lib/api-error";

// Metadata from `GET /api/projects/[projectId]/specs`; the content is fetched separately.
export interface SpecListItem {
  id: string;
  createdAt: string;
  filename: string;
}

export type ProjectSpecsState = "loading" | "ready" | "error";

export const specsUrl = (projectId: string) =>
  `/api/projects/${encodeURIComponent(projectId)}/specs`;

export const specDownloadUrl = (projectId: string, specId: string) =>
  `${specsUrl(projectId)}/${encodeURIComponent(specId)}/download`;

// Loads the project's specs on mount (the Specs tab panel remounts each time it opens) and
// again whenever `version` changes (a spec run ended). The current list stays while reloading.
export function useProjectSpecs(projectId: string, version = 0) {
  const [specs, setSpecs] = useState<SpecListItem[]>([]);
  const [state, setState] = useState<ProjectSpecsState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(specsUrl(projectId), { cache: "no-store" });
        if (!response.ok) throw new Error(await readError(response));
        const body = (await response.json()) as { specs: SpecListItem[] };
        if (cancelled) return;
        setSpecs(body.specs);
        setState("ready");
      } catch (loadError) {
        if (cancelled) return;
        console.error("Failed to load specs", loadError);
        setError(loadError instanceof Error ? loadError.message : null);
        setState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, version, attempt]);

  const retry = useCallback(() => {
    setState("loading");
    setError(null);
    setAttempt((count) => count + 1);
  }, []);

  return { specs, state, error, retry };
}
