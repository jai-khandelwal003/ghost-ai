Show active room participant inside the editor canvas view,
Without changing the editor home navbar 

## Implementation

1. Keep the existing navbar behaviour as-is.
- Do not change the editor home navbar.
- Do not move or redesign the share navbar component globally.
- If the editor home and editor canvas use the same navbar 
component, make sure this presence UI only appears in the 
canvas/editor home view.

2. Add the participant avatar group inside the editor canvas area. 
- Position it in the top-right corner of the editor canvas view.
- Keep it visually separate from the main navbar action.
- Get the current user ID from the active Clerk session.
- Filter the liveblocks presence list to exclude any entry.
 Whose user ID matches the current Clerk user ID
- Render the filter list as collaborator avatars only.
- Render the current users separately using the existing Clerk UserButton. Do not render a second avatar for them from the liveblocks presence list.
- Keep  collaborators' avatar and the close UserButton the same size so the group looks visually consistent.
- Collaborators' avatars are display-only, not interactive.
- Show a divider between the collaborators' avatar and the clerk  UserButton only when at least one collaborator exists.
- If no collaborators are present, show only the clerk UserButton with no divider.

3. Render collaborator avatars. 
-  Use profile photo when available.
- Fall back to initials when there is no image.
- Show up to five collaborators avatars in an overlapping stack.
- Show a N overflow chip when there are more than five.
- Add a subtle ring so avatars stay readable on the dark canvas.

4. Add live cursors to the canvas. 

- Render cursor for other participants only, never the current user.
- Use the existing liveblocks present state to broadcast cursor position.
- Update cursor position on React Flow onmouseMove event.
- Clear cursor to null on mouse leave.
- Show a small colored pointer with a name badge attached.
- Match the pointer and badge color to the participant's presence color.

5. Define the shared present type in `liveblocks.config.ts`.

Presence should include:
- `Cursor`: `{x: number, y: number } | null`
- `thinking` :  boolean

## Scope limits

- Don't add participant avatar to the shared nav bar globally.
- Don't remove existing navbar actions like save, import, share, or AI.
- Don't replace Clerk users/profiles/logout behavior.
- Don't make collaborators' avatar interactive.
- Don't change canvas node or edge behavior.