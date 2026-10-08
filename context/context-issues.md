When i click the logout button the following error appears:
[browser] * unhandeledRejection was recived from the server.
GET /editor 200 in 482 ms(next js: 82ms, proxy.ts: 373ms,application-code: 28ms) 

Sometimes when we log in, we get directed to this weird long URL, which doesn't show anything on the page. 

## Resolution (2026-10-08)

**Root cause (shared by both issues):** on sign-out, Clerk's provider calls its `invalidateCacheAction()` Server Action, which POSTs to the current page (`/editor`). When the session token had already expired (Clerk dev tokens live ~60s), `proxy.ts` ran `auth.protect()` on that POST and redirected the Server Action to `/sign-in?redirect_url=…/editor`.

- If that redirected action failed, the rejection went unhandled. Clerk calls `void invalidateCacheAction().then(...)` with no `.catch`, which produced the `unhandledRejection`.
- If it "succeeded", Next rendered sign-in content while the router URL stayed `/editor`. On the next login, `<SignIn>` built its step URLs from that base and navigated to `/editor/factor-one`, a non-existent route. The proxy bounced it to `/sign-in?redirect_url=…%2Feditor%2Ffactor-one`, which is the long URL with a blank page.
- Not a bug: `/?__clerk_handshake=eyJ…` is Clerk's normal dev handshake redirect and resolves on its own.

**Fix:**
- `proxy.ts` skips Server Action requests (`POST` + `next-action` header); each Server Function must call `await auth.protect()` itself, per Clerk's guidance. Page, RSC and API requests are still protected by default.
- `ClerkProvider`: `afterSignOutUrl` = `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (sign-out goes straight to sign-in), and `signInFallbackRedirectUrl`/`signUpFallbackRedirectUrl` = `/editor` (login lands directly on the editor, no `/` hop).

**Verified:** reproduced both issues in a headless browser with a temporary Clerk test user (since deleted), by deleting the `__session` cookie before sign-out to simulate an expired token. Before the fix, the next login navigated to `/editor/factor-one`. After the fix, both the expired-token and normal sign-in → sign-out → sign-in cycles end on `/sign-in` → `/editor`, with no exceptions, unhandled rejections or `[browser]` errors in the dev log. Build, lint and tsc pass.
