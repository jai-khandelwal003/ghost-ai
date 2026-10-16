Add resizing and inline label editing to canvas nodes. 

## Implementation

1. Add resizing
- Selected nodes should show release handles.
- Prevent nodes from being resized below minimum size.
- Keep resize handles subtle and consistent with the dark canvas UI

2. Add inline label editing
-  Keep the node label centered inside the node.
- Double-click the center/label area of a node to edit its label.
- Show placeholder text in the same centered position when the label is empty.
- Keep editing smooth without causing layout shifts.
- Show a textarea directly  over the label while editing.
- Update the label as the user types.
- Close editing on blur or `Escape`.
- Prevent text editing interaction from dragging or panning the canvas.

## Scope Limits

- Don't change shape rendering from the preview unit.
- Don't change the shape panel or drag preview.
- Don't change how drop nodes are created.
- Keep this focused on resize and label editing only.

## Check When Done

- Selected nodes show resize handles. 
- Resizing updates a node dimension through the existing node state flow. 