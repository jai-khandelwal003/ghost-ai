Implement the full AI design agent so a user prompt results in real-time updates on the collaborative canvas with visible AI presence and status.a. 

## Implementation

1. Update the design agent task in `trigger/design-agent.ts`

  Before implementing:
  - Check `Context/project-overview.md` and `context/architecture-context.md` for product behavior and system rules 
  - Before implementing, check liveblocks and trigger.dev agents skills for current patterns on canvas mutation and background task execution.
  - Follow the existing trigger.dev setup and agent patterns already in the project.
  - Reuse existing live blogs flow and presence pattern instead of creating new ones.

  Then implement
  - use Gemini, (`@ai-sdk/google`)  to intercept the user prompt.  
  - Update the canvas using the existing collaborative flow utilities.
  - Support actions like
  - add node
  - move node
  - resize node
  - update node data
  -  delete node
  - add edge
  -  delete edge

  - Publish AI activity to the shared status feed so all users see progress.
  - Update AI presence (cursor + thinking state) while the task runs.
  - Push a clear status message at key steps (start, processing complete).

  - ensure genrated design follows:
  - allowed node shapes
  - color palette
  - layout and spacing rules

  - handle error gracefully and update status if something fails
  - clear AI presence when the task finishes

## Dependencies
  All packages are already installed. `GEMINI_API_KEY` is already in `.env.local`

## Scope limits

- Don't change canvas architecture.
- Don't introduce a new state system outside liveblocks.
- Don't bypass existing collaborative flow utilities.

## check when done

- Design task updates the canvas through the existing collaborative flow.
- AI presence and status are visible to all participants.
- Status message reflects task progress.
- Error handled without breaking the canvas.
- `npm run build` passes  
