# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1 — Foundation

## Current Goal

- Design system and UI primitives (`context/feature-specs/01-design-system.md`).

## Completed

- 01 Design system: shadcn/ui (style `base-nova`, Base UI primitives) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/` (unmodified); lucide-react; `lib/utils.ts` exports `cn()`; dark theme tokens from `ui-context.md` in `globals.css`. Verified: tsc + `next build` pass with all components imported, `cn()` merges conflicting classes, no light theme values in compiled CSS.

## In Progress

- None yet.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Theming: `:root` holds the ui-context tokens (`--bg-*`, `--text-*`, `--accent-*`, ...); shadcn variables (`--background`, `--primary`, ...) alias onto them, so restyling happens in `globals.css` only, never in `components/ui/*`.
- `<html>` carries the `dark` class permanently so shadcn's `dark:` variants always apply (dark-only app).
- `cn()` comes from the `cn` package (shadcn-ui/cn, clsx + tailwind-merge replacement) installed by the shadcn CLI; generated components import it directly, `lib/utils.ts` re-exports it for app code.

## Session Notes

- Add context needed to resume work in the next session.
