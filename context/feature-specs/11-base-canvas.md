Replace the canvas placeholder with the Liveblocks-React Flow canvas.

## implementation.

1. Keep the workspace page server-side.

2. Create a client-side editor/canvas wrapper that sets up the Liveblocks room. 

 It should include:
- `LiveblocksProvider` using `/api/Liveblocks-auth`
- `RoomProvider` using the current room ID
- Initial presence with `cursor: null`
- `ClientSideSuspense` with a simple loading state
- an error fallback for Liveblocks connection issues

3. Wire React Flow to Liveblocks state.
- Use `useLiveblocksFlow`.
- Enable suspense.
- Start with empty nodes and edges.
- Pass the synced nodes, edges, and change handlers into `ReactFlow`.

Add shared canvas types in `types/canvas.ts`. 

Node data should support:
 - color
 - shape
 - label

 Also define the custom nodes and edge types:
 - `canvasNode`
 - `canvasEdge`

5. Render the basic canvas.

 Include:
 - lost connection behavior
 - `fitView` 
 - `MiniMap` 
 - dot-pattern background. 

## Scope limits

- Don't add controls yet.
- Don't add custom border edge rendering yet.
- Don't add persistence logic.
- Don't add AI behavior.
- Keep this focused on the collaborative canvas foundation.

## Check when done

- Client canvas wrapper sets up the Liveblocks room. 
- React Flow uses Liveblocks synced nodes and edges. 
- Shared canvas type exists in `types/Canvas.ts`. 
`npm run build` passes. 