# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1 — Foundation

## Current Goal

- Project dialogs: `/editor` home screen, Create/Rename/Delete project dialogs and sidebar project actions on mock data (`context/feature-specs/04-projects-dialogs.md`).

## Completed

- 01 Design system: shadcn/ui (style `base-nova`, Base UI primitives) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/` (unmodified); lucide-react; `lib/utils.ts` exports `cn()`; dark theme tokens from `ui-context.md` in `globals.css`. Verified: tsc + `next build` pass with all components imported, `cn()` merges conflicting classes, no light theme values in compiled CSS.

- 02 Editor chrome: `components/editor/editor-navbar.tsx` (h-12 bar, left/center/right sections, outline toggle button switching `PanelLeftOpen`/`PanelLeftClose`, right section empty); `components/editor/project-sidebar.tsx` (`isOpen`/`onClose` props, fixed floating overlay that slides in from the left without pushing content, "Projects" header + close button, My Projects / Shared tabs with empty states, full-width "New Project" button with `Plus` icon — no handler yet); dialog pattern = the existing shadcn `components/ui/dialog.tsx` (`DialogTitle`, `DialogDescription`, `DialogFooter`), already themed via the globals.css token mapping (`--popover`, `--muted-foreground`, `--border`, `--muted`); no new dialog file and no concrete dialogs built. Verified: `tsc --noEmit` and `eslint` pass.

- 03 Auth: `ClerkProvider` (inside `<body>` per Clerk v7) in `app/layout.tsx` with `dark` theme from `@clerk/ui/themes` and appearance variables mapped to globals.css tokens; `app/(auth)/layout.tsx` 50/50 two-panel layout (lg+: left `bg-elevated` panel with brand-square logo at top, headline, intro paragraph, 3 features with small icon tiles + title + description | right `bg-base` with centered form; small screens: form only) — restyled from a user-supplied reference screenshot, which supersedes the spec's "text only feature list"; `app/(auth)/sign-in/[[...sign-in]]` and `sign-up/[[...sign-up]]` with Clerk `<SignIn />`/`<SignUp />`; root `proxy.ts` with `clerkMiddleware` — public = paths under `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`NEXT_PUBLIC_CLERK_SIGN_UP_URL`, everything else `auth.protect()`; `/` redirects to `/editor` (signed in) or `/sign-in`; `UserButton` in navbar right section. `/editor` route: `app/editor/layout.tsx` (client layout owning sidebar open state; renders `EditorNavbar` + `ProjectSidebar` + `<main>`) and `app/editor/page.tsx` (server page, `await auth.protect()`, empty canvas placeholder) — fixes the 404 after sign-in. Verified: `npm run build`, tsc, eslint pass; on `next start`, `/`, `/editor`, `/api/*` and arbitrary paths 307 to `/sign-in`, `/sign-in` and `/sign-up` return 200; no hex colors in auth files.

## In Progress

- 04 Project dialogs (`context/feature-specs/04-projects-dialogs.md`) — implemented, not yet clicked through in a browser. `hooks/use-project-dialogs.ts` (dialog, form and loading state; in-memory create/rename/delete over `lib/mock-projects.ts`); `lib/slug.ts` (`slugify`); `components/editor/project-dialogs-provider.tsx` (context + `useProjectDialogsContext`, mounted in `app/editor/layout.tsx`); `components/editor/project-dialogs.tsx` (Create with live slug preview, Rename with prefilled auto-focused input and Enter submit, Delete as destructive confirmation); `components/editor/editor-home.tsx` rendered by `app/editor/page.tsx`; `project-sidebar.tsx` lists mock projects, rename/delete icon buttons on owned projects only, "New Project" opens the Create dialog, mobile-only scrim (`md:hidden`) closes the sidebar on tap. Verified: `tsc --noEmit`, `eslint` and `next build` pass; `slugify` checked on sample names. Remaining: manual browser check of the dialogs and the mobile scrim.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Does renaming a project change its slug? Currently rename keeps the slug created at creation time.
- Must slugs be unique? No uniqueness check exists yet.
- What happens when a sidebar project is clicked? Items are not links yet — no project route is defined.

## Architecture Decisions

- Theming: `:root` holds the ui-context tokens (`--bg-*`, `--text-*`, `--accent-*`, ...); shadcn variables (`--background`, `--primary`, ...) alias onto them, so restyling happens in `globals.css` only, never in `components/ui/*`.
- `<html>` carries the `dark` class permanently so shadcn's `dark:` variants always apply (dark-only app).
- Editor chrome is controlled: `app/editor/layout.tsx` owns sidebar open state and passes `isSidebarOpen`/`onToggleSidebar` to the navbar and `isOpen`/`onClose` to the sidebar. The sidebar is `fixed` at `top-15` to sit under the `h-12` navbar; change both together.
- Dialogs: future dialogs compose `components/ui/dialog.tsx` directly (`DialogContent` > `DialogHeader` > `DialogTitle`/`DialogDescription`, `DialogFooter` for actions); colors come from the globals.css tokens.
- Project dialogs: all dialog/form/loading state lives in `useProjectDialogs`; `ProjectDialogsProvider` calls it once in the editor layout, renders the three dialogs, and exposes the state through context so the sidebar and the `/editor` page open the same dialogs. Mutations go through the hook's `runMutation`, which is where API calls get awaited later. Dialogs pass `rounded-3xl` via `className` instead of editing `components/ui/dialog.tsx`.
- Project ownership in the UI comes from `Project.role` (`"owner"` | `"collaborator"`): owner → My Projects tab with actions, collaborator → Shared tab without actions.
- Auth: `proxy.ts` does not protect Server Action requests (`POST` + `next-action` header). Redirecting them broke Clerk's sign-out (see `context/context-issues.md`). **Every Server Function must call `await auth.protect()` itself.** `ClerkProvider` sets `afterSignOutUrl` to the sign-in URL and sign-in/sign-up fallback redirects to `/editor`.
- Auth: route protection is default-deny in `proxy.ts` using a plain path check against the Clerk sign-in/up env vars — not `createRouteMatcher`, which is deprecated in `@clerk/nextjs` 7. New public routes must be added to the `publicRoutes` list there. Per Clerk guidance, pages/handlers that touch protected data should still call `await auth.protect()` themselves.
- Clerk appearance: `colorBorder` and `colorNeutral` use `var(--text-primary)` because Clerk renders them at ~7–11% alpha; a dark token (e.g. `--border-default`) makes Clerk borders invisible.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` were added to `.env.local` (they were missing; standard Clerk names) — set them in every deployment environment.
- `cn()` comes from the `cn` package (shadcn-ui/cn, clsx + tailwind-merge replacement) installed by the shadcn CLI; generated components import it directly, `lib/utils.ts` re-exports it for app code.

## Session Notes

- Add context needed to resume work in the next session.
