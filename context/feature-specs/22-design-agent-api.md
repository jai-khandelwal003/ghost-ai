Set up the backend flow for design generation using Trigger.dev. 
This unit handles triggering background jobs, tracking runs, and issuing tokens. New AI logic yet 

## Implementation

1. Add the design trigger route.
   Create: `POST/API/AI/design`
   This route should:
   - Accept the design prompt and required context (`room ID`, `project ID`).
   - Trigger the design task through Trigger.dev.
   - Create a task run record.
   - Return the run ID to the client. 

2. Add task run tracking

  Create a `TaskRun` model in Prisma to track Trigger.dev runs and verify ownership.

  It should include:
  - `runId` (unique)
  - `projectId`
  - `userId`
  - `createdAt`

  Add:
  - An index on `runID`
  - am compound index on `userId` and `projectId`

3. Add the token route

  Create: `POST/api/design/token`
  This route should:
  - accept  a run Id
  - verify ownership using the TaskRun record
  - genrate the Trigger.dev public token scoped to that run
  - return the token to the client

4. Create the design task
  Create `Trigger/design-agents.ts`
  - Check the existing Trigger.dev setup and installed agent features first.
  - Use the existing setup instead of creating a new pattern.
  - Export a minimal design task.
  - Accept the expected payload (`prompt`, `roomId`).
   Log or echo the input for now.
   - Don't add AI logic yet.

## Scope limits
- Don't generate nodes or edges yet.
- Don't call any AI providers.
- Don't update the canvas.
- Keep this focused on backend task wiring only.

## Check when done

- `POST/api/ai/design` triggers a background task
- Task runs are stored in Prisma
- `POST/api/ai/design/token` returns  a run-scoped token.
- Design task exists and is callable
- `npm run build` passes

