Set up the real-time collaboration infrastructure using live blocks.

## Configuration

Configure the `liveblocks.config.ts` at the project root. 

Define:

### Presence

- cursor position
- `isThinking` boolean

## UserMeta

- User ID
- Display name
- Avatar URL
- Cursor color

## Liveblocks client

Create a cached live logs mode client in `lib`.

Add a helper that deterministically maps a user ID to a consistent color from a fixed palette.

## Auth route

Create `POST/api/liveblocks-auth`. 

Use the project ID as the Liveblocks room ID.

This route must:

1. Require Clerk authentication.
2. Verify project access using the existing access helper.
3. Ensure the live logs room exists. Create only if needed.
4. Return session token with:
- username 
- avatar 
- generated cursor color.

Return `403` for unauthorized project access.