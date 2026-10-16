Add a small template library so users can start a canvas from a prebuilt diagram instead of building from scratch. 

## Implementation

Create `components/editor/starter-template.ts`.

Include
- a `CanvasTemplete` type
- a `CANVAS_TEMPLATES` array
- at least three templates, such as microservices, CI/CD pipeline, and event-driven system

Each template should include
- `id`
- `name`
- `description`
- nodes
- edges

Use the shared canvas type and existing node color palette. Add small helper function if needed to keep the template data readable

2. Create `components/editor/starter-templates-modal.tsx`.

The modal should 
- Open as a dialog.
- Show  template card in a scrollable grid.
- show the template name and description.
- Include an import button for each template.

3. Add a simple diagram preview to each template card. 
- Fit the preview to a fixed-size viewport.
- Calculate the preview bounds on the template node positions.
- Draw edges as simple lines between node centers.
- Draw nodes using their shape and color data.
- Keep the preview lightweight.
- No React Flow instance needed.