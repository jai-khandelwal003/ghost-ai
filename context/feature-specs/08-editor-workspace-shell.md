Build the `/editors/[room ID]` workspace shell with server-side access checks, no canvas logic yet. 

## Access

`/editors/[room ID]` must be a server component

Before rendering:
- unauthenticated users redirect to `/signin`
- Users without project access see `AccessDenied`
- Non-existent projects also show `AccessDenied`

Create `components/editor/access-denied.tsx` with:

- centered layout
- lock icon
- short message
- link back to `/editor`

## Access Helpers

Create `Lib/project-access.ts` with helpers for:

- getting current clerk identity: `userID` + primary email

## Layout

Build a full viewport workout layout with:

- Top navbar showing the project name 
- navbar action: share button, and AI sidebar toggle
- existing `ProjectSidebar` on the left
- Current room highlighted in the sidebar
- Central canvas placeholder with dark background and centered message
- Right sidebar placeholder for future AI chart

The canvas area should fill the remaining space.

## Scope

Do not add real canvas logic, Liveblocks, AI chat, or sharing behaviour yet.

## Check when Done

- `/editor[room ID]` built successfully.
- Access helper exists outside the page component.
- `AccessDenied` is used for missing or unauthorized projects.
- Workspace layout renders with current project context.
- No TypeScript errors.