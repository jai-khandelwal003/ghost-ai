# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1 — Foundation

## Current Goal

- Editor chrome: navbar, project sidebar shell, dialog pattern (`context/feature-specs/02-editor.md`).

## Completed

- 01 Design system: shadcn/ui (style `base-nova`, Base UI primitives) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/` (unmodified); lucide-react; `lib/utils.ts` exports `cn()`; dark theme tokens from `ui-context.md` in `globals.css`. Verified: tsc + `next build` pass with all components imported, `cn()` merges conflicting classes, no light theme values in compiled CSS.

- 02 Editor chrome: `components/editor/editor-navbar.tsx` (h-12 bar, left/center/right sections, outline toggle button switching `PanelLeftOpen`/`PanelLeftClose`, right section empty); `components/editor/project-sidebar.tsx` (`isOpen`/`onClose` props, fixed floating overlay that slides in from the left without pushing content, "Projects" header + close button, My Projects / Shared tabs with empty states, full-width "New Project" button with `Plus` icon — no handler yet); dialog pattern = the existing shadcn `components/ui/dialog.tsx` (`DialogTitle`, `DialogDescription`, `DialogFooter`), already themed via the globals.css token mapping (`--popover`, `--muted-foreground`, `--border`, `--muted`); no new dialog file and no concrete dialogs built. Verified: `tsc --noEmit` and `eslint` pass.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Which route/layout mounts the editor chrome (navbar + sidebar + open state)? Not defined in 02; the components aren't mounted anywhere yet.
- What does "New Project" do? Button currently has no action.

## Architecture Decisions

- Theming: `:root` holds the ui-context tokens (`--bg-*`, `--text-*`, `--accent-*`, ...); shadcn variables (`--background`, `--primary`, ...) alias onto them, so restyling happens in `globals.css` only, never in `components/ui/*`.
- `<html>` carries the `dark` class permanently so shadcn's `dark:` variants always apply (dark-only app).
- Editor chrome is controlled: the parent owns sidebar open state and passes `isSidebarOpen`/`onToggleSidebar` to the navbar and `isOpen`/`onClose` to the sidebar. The sidebar is `fixed` at `top-15` to sit under the `h-12` navbar; change both together.
- Dialogs: future dialogs compose `components/ui/dialog.tsx` directly (`DialogContent` > `DialogHeader` > `DialogTitle`/`DialogDescription`, `DialogFooter` for actions); colors come from the globals.css tokens.
- `cn()` comes from the `cn` package (shadcn-ui/cn, clsx + tailwind-merge replacement) installed by the shadcn CLI; generated components import it directly, `lib/utils.ts` re-exports it for app code.

## Session Notes

- Add context needed to resume work in the next session.
