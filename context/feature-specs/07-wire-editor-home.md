Wire the editor home sidebar and dialogs to the real project API.

## Data Fetching 

The editor home page is a server component

Fetch owned and shared projects server-side using the existing data helper and pass both lists to the sidebar.

No client-side fetching to initial load.

## Use Project Actions

Create a 'hooks/' that manages dialog state and project mutations.

**Create**

- Manage create dialog state.
- Manage product name input.
- Generate a short unique suffix.
- Slugify the name to create the room ID.
- Call `POST/api/projects`.
- navigate to the new workspace.

The project ID and liveblocks room ID should stay aligned.

**Rename**

- Store target project id + current name
-call `PATCH/api/project/[id]`. 
- refresh on success.

**delete** 

Store target project
- call `delete/api/project/[id]`
- Redirect to `/editor` if deleting the active workspace
- otherwise refresh.

## Wiring

connect the hook to the sidebar and dialogs 

- create dialogs show room ID preview
- rename dialog pre-fills current name
- delete dialog shows project name 

### Checks when done

- Sidebar uses real project data.
- Create navigates to workspace.
- Rename updates correctly.
- Delete refreshes or redirects correctly.
- `npm run build` passes.
