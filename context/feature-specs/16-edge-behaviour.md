Replace the default canvas edge with a custom edge that feels easier
to follow, easier to click, and supports inline labels.

## Implementation

1. Add connection handles to every node.
- Place handles on the top, right, bottom, and left sides.
- Users should be able to connect from handle to any other handle.
- Keep the handles subtle: small white dots with a dark border.
- Hide them by default and fade them in when hovering over the node.

2. Add a default style for new edges.
- Use a light stroke with rounded ends. 
- Add an arrowhead at the end of each edge. 
- Make new connections use the custom canvas edge renderer. 

3. Create the custom edge renderer.
- Use clean right-angle routing.
-  Keep edges slightly dimmed at rest.
- Brighten edges when hovered or selected.
- Make the edge easier to hover and click without increasing the visible line thickness.

4. Add inline edge label editing.
- Double-click an edge to edit its label. 
- Use React Flow's `EdgeLabelRenderer` and the path midpoint.
Coordinates from `getSmoothSteppath` to position the label-Do not calculate midpoint position manually.
- Use an input that arrows with the label text.   