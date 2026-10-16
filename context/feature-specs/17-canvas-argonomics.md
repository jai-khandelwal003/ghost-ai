Add a floating control bar for zoom and undo/redo, then wire the same actions to keyboard shortcuts. 

## Implementation

1. Add a pill-shaped control bar at the bottom left of the canvas. 

 It should sit above the shape panel and includes two groups:
 - Zoom controls:zoom out, fit view, zoom in
 - history controls: undo, redo

 Separate the two groups with a thin divider. 

2. Wire the zoom controls to the React flow instance.
 - Zoom in
 - zoom out
 - fit view
 - use a short animation so the movement feels smooth.

3. Wire undo and redo to the Liveblocks history. 

- Use the existing Liveblocks undo/redo hooks.
- Disable undo when there is nothing to undo.
- Disable redo when there is nothing to redo.
- Keep disabled buttons visually dimmed.

4. Create a `useKeyboardShortcuts` hook in `hooks/`.

The hook should:
- recive the react flow instance
- recive undo and redo handlers
- listen for Keyboard shortcuts on `window`
- ignore shortcut while typing in inputs, textareas, or editable text fields

5. Support these shortcuts:
 - `+` or `=` to zoom in
 - `-` to zoom out
 - `Cmd/Ctrl + Z` to undo
 - `Cmd/Ctrl + Shift + Z` to redo
 - `Cmd/Ctrl + Y` to redo

6. Remove the minimap at the bottom right
 
## Scope limits

- Don't change the shape panel.
- Don't change node or edge rendering.
- Don't add extra canvas controls.
- Don't change the existing collaborative state setup.

##  Check when done

-  Control bar is added to the canvas.
- Zoom action uses React Flow instance.
- Undo and redo use Liveblocks history.
- Keyboard shortcuts are handled in `hooks/useKeyboardShortcuts`.
- Shortcut handling skips editable fields.
- `npm run build` passes.



