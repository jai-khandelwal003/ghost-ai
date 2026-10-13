"use client";

import { useEffect, useRef, useState } from "react";

import { FALLBACK_ERROR, readError } from "@/lib/api-error";
import type { Collaborator } from "@/lib/collaborators";
import { getWorkspacePath } from "@/lib/workspace";

export interface ShareDialogState {
  isOpen: boolean;
  // `null` until the list has loaded.
  collaborators: Collaborator[] | null;
  email: string;
  isInviting: boolean;
  // ID of the collaborator being removed, if any.
  removingId: string | null;
  isCopied: boolean;
  error: string | null;
  setEmail: (email: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
  submitInvite: () => Promise<void>;
  removeCollaborator: (collaborator: Collaborator) => Promise<void>;
  copyLink: () => Promise<void>;
}

const COPIED_FEEDBACK_MS = 2000;

function isCollaborator(value: unknown): value is Collaborator {
  if (typeof value !== "object" || value === null) return false;

  const { id, email, name, imageUrl } = value as Record<string, unknown>;
  return (
    typeof id === "string" &&
    typeof email === "string" &&
    (name === null || typeof name === "string") &&
    (imageUrl === null || typeof imageUrl === "string")
  );
}

// Reads the `{ collaborators }` body of a list or invite response.
async function readCollaborators(response: Response): Promise<Collaborator[]> {
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("collaborators" in body)) {
    throw new Error("Unexpected collaborators response");
  }

  const { collaborators } = body;
  if (!Array.isArray(collaborators) || !collaborators.every(isCollaborator)) {
    throw new Error("Unexpected collaborators response");
  }
  return collaborators;
}

export function useShareDialog(projectId: string): ShareDialogState {
  const [isOpen, setIsOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[] | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collaboratorsUrl = `/api/projects/${encodeURIComponent(projectId)}/collaborators`;

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  async function loadCollaborators() {
    try {
      const response = await fetch(collaboratorsUrl);
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setCollaborators(await readCollaborators(response));
    } catch {
      setError(FALLBACK_ERROR);
    }
  }

  function openDialog() {
    setEmail("");
    setError(null);
    setIsOpen(true);
    // Refetched on every open so the list reflects changes made elsewhere.
    void loadCollaborators();
  }

  function closeDialog() {
    setIsOpen(false);
  }

  async function submitInvite() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || isInviting) return;

    setIsInviting(true);
    setError(null);
    try {
      const response = await fetch(collaboratorsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setCollaborators(await readCollaborators(response));
      setEmail("");
    } catch {
      setError(FALLBACK_ERROR);
    } finally {
      setIsInviting(false);
    }
  }

  async function removeCollaborator(collaborator: Collaborator) {
    if (removingId) return;

    setRemovingId(collaborator.id);
    setError(null);
    try {
      const response = await fetch(
        `${collaboratorsUrl}/${encodeURIComponent(collaborator.id)}`,
        { method: "DELETE" }
      );
      // Already removed elsewhere counts as removed.
      if (!response.ok && response.status !== 404) {
        setError(await readError(response));
        return;
      }
      setCollaborators(
        (current) =>
          current?.filter((item) => item.id !== collaborator.id) ?? null
      );
    } catch {
      setError(FALLBACK_ERROR);
    } finally {
      setRemovingId(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${getWorkspacePath(projectId)}`
      );
    } catch {
      setError("Could not copy the link. Copy it from the address bar instead.");
      return;
    }

    setIsCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(
      () => setIsCopied(false),
      COPIED_FEEDBACK_MS
    );
  }

  return {
    isOpen,
    collaborators,
    email,
    isInviting,
    removingId,
    isCopied,
    error,
    setEmail,
    openDialog,
    closeDialog,
    submitInvite,
    removeCollaborator,
    copyLink,
  };
}
