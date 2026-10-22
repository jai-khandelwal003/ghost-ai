Add shared AI activity indicators so everyone in the room can see when generation is in progress. This unit is only for UI, presence, and realtime status signals. Do not add the actual AI genration flow yet.

## Implementation

1. Add AI thinking state to the sidebar
  - show a small status indicator when AI is working
  - make the status visible to everyone in the room 
  - disable the chat input while genration is active 
  - show a loading state on the send button 
  - keep the rest of the sidebar usable

2. Add a shared AI status feed
  - check the exisisting liveblocks setup and installed agent-related features first
  - follow Liveblocks best practices for feeds/presence instead of creating parallel realtime state 
  - create or reuse a LiveBlocks feed name `ai-status-feed`
  - subscribe to the latest feed message in the sidebar
  - show only the most recent status message
  - keep the feed generic enough for design and spec genration later

3. Add status message validation
  - define the feed payload schema in `types/tasks.ts`
  - the payload should support an optional `text` field
  - validate incoming messages before displaying them

4. Add thinking indicators to live cursors.
   - when a participant has `thinking: true` in presence, show a small spinner in their cursor name
   - hide the spinner when `thinking` is false or missing 

## Scope limits

- don't add actual Ai genration logic
- don't trigger background task yet 
- don't block or dim the whole sidebar
- don't show full feed history
- keep this focused on shared AI activity state only

## Check when done

- sidebar can render shared AI status from `ai-status-feed`
- Chat input and send button respond to active genration state.
- Cursor badges read `thinking` from presence.
- feed messages are validated through the task schema
- `npm run build` passes.