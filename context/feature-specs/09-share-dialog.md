Add a `Share` button to the editor navbar that opens the share dialog

Owners can:

- Invite collaborators by email.
- View current collaborators.
- Remove collaborators.
- Copy the project link with temporary `Copied!` feedback.

Collabrators can:

- View the collaborator list only 
- not invite, remove, or manage access. 

## Clerk User Data

Collaborators are stored by email in the database.

Use the Clerk backend API to enrich collaborator email with:

- display name 
- avatar image. 

If a clerk user is not found for an email, fall back to showing the email only.

## Implementation

Add the required API logic for:

- listing collaborators
- inviting collaborators
- removing collaborators

Enforce ownership server-side for invite and remove actions.

Do not add a local user table. 

## Check when done

- Share dialog opens from the workspace.
- Owners can invite and remove collaborators.
- Collaborators see read-only access.
- Collaborator names/avatar load from clerk when available.
- `npm run build` passes.