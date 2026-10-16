Add a small floating color toolbar so selected nodes can change both their background and text color directly on the canvas. 

## implementation

1. check `ui-context.md` for the node color palette.
 Each palette option includes:
 - A node background color
 - A matching text color

Reuse existing theme colors if they already exist in `global.css`. Otherwise, keep the palette in the canvas types/constants, such as `type/canvas.ts`. 

2. Add a toolbar above selected nodes
-  Only show it when a node is selected.
- Keep it slightly above the node without overlapping it.
- Show one swatch per color pair.
- After swatches, they should feel clearly selected.
- Hovering over a swatch should show a subtle glow based on its text color.
- Keep the glow tight and controlled, not overly blurred.
- Prevent toolbar interactions from dragging nodes or panning the canvas.

3. When a switch is selected
- Update both the node background color and text color.
- Update the node UI immediately.
- Keep this inside the existing collaborative canvas state.
- No server calls.

4. Selected nodes should visually reflect their active color pair.

The node background updates to the selected color, and the text automatically updates to its paired text color. 

## Scope limits

- Don't change drag/drop behavior.
-  Don't rebuild node selection logic.
- Don't add a full color picker.
- Keep this focused on predefined color themes only.

## Check when done

- Nodes use predefined background/text color pairs.
-  Selected nodes show a floating color toolbar.
- Swatch selection updates both node and text colors.
- `npm run build` passes without type errors. 
