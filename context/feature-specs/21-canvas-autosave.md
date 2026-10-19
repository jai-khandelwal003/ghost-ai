Add autosave and loading for the collaborative canvas, so the project status is persisted before adding the AI generation canvas JSON should be stored in a Vercel blob, and the save blob URL should be stored in the Prisma project record.

## What to Install

- `@vercel/blob`

## Implementation

1. Check the existing project schema.
- Review `prisma/models/project.prisma`.
- Add or reuse a field for the canvas blob URL.
- Keep Prisma responsible for metadata only.

2. Add canvas save/load API routes. 
  Create: `Put/api/projects/[projectId]/canvas`
  This route should:
  - Receive the latest canvas JSON.
  - Upload the JSON to Vercel Blob.
  - Store the returned blob URL on the matching Prisma project record.

  Create `GET/api/projects/[projectId]/canvas`
  This route should:
  - Read the project saved blob URL from Prisma.
  - Fetch the saved canvas JSON from Vercel blob.
  - Render the canvas state to the editor.

3. Add an autosave hook in the `/hook` folder
- watch the canvas nodes and edges.
-  Debounce save to avoid excessive writes.
- Save through the canvas API route.
- Track save status: saving, saved, error.

4. Load saved canvas state in the editor. 
- when the Editor loads, Check if the live blocks room has any existing nodes or edges.
- If the room is empty and the project has a saved canvas blob URL, fetch and load the saved canvas state.
- If the room already has nodes or edges, skip the load entirely to avoid overloading active collaboration.

5. Add a small save status indicator in the editor save button. 
- Show saving, saved, or error states. 

## Storage Pattern

- Stores project metadata and the canvas blob URL.
- Vercel blob stores the actual canvas JSON. 
