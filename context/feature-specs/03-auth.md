Claude is already installed and connected. Wire it into Next.js app: provider, auth pages, redirects, route protection, and user menu.

## Design 

Use Clerk 'dark' theme from '@Clerk/ui/themes' as the base.

Override Clerk appearance variables using the app's existing CSS variable. Do not hardcode colors.

### Sign-in and Sign-up pages

-Large screens: simple two-panel layout.
-Left: compact logo, tagline, short text only feature list.
-Right: centered clerk form.
-Small screens: form only.
-No gradients.
-No oversized hero sections.
-No feature cards.
-No scroll-heavy layouts.

Keep the layout minimal and proffesional

## Implementation

Wrap the root layout with 'Clerk provider' using Clerk's 'dark' theme.

Create sign-in and sign-up pages using Clerk components.

Use 'proxy.ts' at the project root, not 'middleware.ts'.

Define public routes using the existing sign-in and sign-up env vars. Protect  everything else by default.

Update '/':

-authenticated users redirected to '/editor'
-unauthenticated users redirect to '/sign-in'

Add Clerk's built-in 'UserButton' to the editor navbar right section for profile settings and logout.

Keep Clerk's default users menu and profile flows intact. Do not rebuild or heavily customize Clerk's internals.
 
Use existing Clerk env vars. Do not rename or invent new ones.

## Dependencies

## Check whenb done

-'proxy.ts' exists at the root.
- All routes are protected except public auth paths.
- Auth pages use CSS variables with no hardcoded colors.
-'Clerkprovider' wraps the root layout.
- 'npm runs build' passes.

 