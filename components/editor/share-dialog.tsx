"use client";

import { Check, Link2, Share2, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useShareDialog } from "@/hooks/use-share-dialog";
import type { Collaborator } from "@/lib/collaborators";
import type { ProjectListItem } from "@/lib/projects";

interface ShareDialogProps {
  project: ProjectListItem;
  // Owners manage access; collaborators get the read-only list.
  isOwner: boolean;
}

// The navbar's Share button together with the dialog it opens.
export function ShareDialog({ project, isOwner }: ShareDialogProps) {
  const share = useShareDialog(project.id);
  const { collaborators, email, isInviting, error } = share;

  return (
    <>
      <Button
        variant="outline"
        className="border-surface-border bg-base text-copy-secondary hover:bg-subtle hover:text-copy-primary"
        onClick={share.openDialog}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Dialog
        open={share.isOpen}
        onOpenChange={(open) => {
          if (!open) share.closeDialog();
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share project</DialogTitle>
            <DialogDescription>
              {isOwner ? "Invite people to collaborate on " : "People with access to "}
              <span className="font-medium text-copy-primary">
                {project.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {isOwner && (
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void share.submitInvite();
              }}
            >
              <label
                htmlFor="share-invite-email"
                className="text-xs font-medium text-copy-secondary"
              >
                Invite by email
              </label>
              <div className="flex gap-2">
                <Input
                  id="share-invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => share.setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="off"
                  disabled={isInviting}
                />
                <Button type="submit" disabled={!email.trim() || isInviting}>
                  {isInviting ? "Inviting…" : "Invite"}
                </Button>
              </div>
            </form>
          )}

          <div className="grid gap-2">
            <h3 className="text-xs font-medium text-copy-secondary">
              Collaborators
            </h3>
            <CollaboratorList
              collaborators={collaborators}
              hasError={error !== null}
              removingId={share.removingId}
              onRemove={isOwner ? share.removeCollaborator : undefined}
            />
            {!isOwner && (
              <p className="text-xs text-copy-muted">
                Only the project owner can manage access.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-xs text-error">
              {error}
            </p>
          )}

          {isOwner && (
            <DialogFooter className="rounded-b-3xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => void share.copyLink()}
              >
                {share.isCopied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                <span aria-live="polite">
                  {share.isCopied ? "Copied!" : "Copy link"}
                </span>
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CollaboratorListProps {
  collaborators: Collaborator[] | null;
  hasError: boolean;
  removingId: string | null;
  // Passed for owners only; without it the list is read-only.
  onRemove?: (collaborator: Collaborator) => Promise<void>;
}

function CollaboratorList({
  collaborators,
  hasError,
  removingId,
  onRemove,
}: CollaboratorListProps) {
  if (!collaborators) {
    // A failed load is reported by the dialog's error line instead.
    if (hasError) return null;

    return <p className="text-xs text-copy-muted">Loading collaborators…</p>;
  }

  if (collaborators.length === 0) {
    return <p className="text-xs text-copy-muted">No collaborators yet.</p>;
  }

  return (
    <ul className="-mx-1 flex max-h-60 flex-col gap-1 overflow-y-auto px-1">
      {collaborators.map((collaborator) => {
        const label = collaborator.name ?? collaborator.email;

        return (
          <li
            key={collaborator.id}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-subtle"
          >
            <Avatar>
              {collaborator.imageUrl && (
                <AvatarImage src={collaborator.imageUrl} alt="" />
              )}
              <AvatarFallback className="bg-subtle text-copy-secondary uppercase">
                {label.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm text-copy-primary">{label}</p>
              {collaborator.name && (
                <p className="truncate text-xs text-copy-muted">
                  {collaborator.email}
                </p>
              )}
            </div>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-copy-muted hover:text-error"
                onClick={() => void onRemove(collaborator)}
                disabled={removingId !== null}
                aria-label={`Remove ${label}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
