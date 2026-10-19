Complete the existing AI sidebar placeholder and turn it into a proper floating chart sidebar component. The sidebar already exists, so keep the current floating placement and smooth side-in behavior from the right side. This unit is focused on building out the sidebar UI inside it. 

## Implementation

1. Separate the AI sidebar into its own component. 
- Keep the open/close state controlled by the parent.
- Preserve the existing side animation, floating position, border, background, and shadow styling.
- Use sidebar's surface styles like `bg-base/95`, `border-surface-border`, and the current shadow treatment.

2. Add the sidebar header.
- Title: `AI Workspace`
Subtitle: `Collaborate with Ghost AI`
- Small bot icon
- Close button aligned to the right
- Use `text-primary-text` for the title
- Use `text-muted-text` for the subtitle

3. Add a tabbed layout with two tabs. 

Use shadcn `Tabs`.
- AI Architect
- Specs
- active tab should use the accent styling, like `big-accent` and `text-accent`
-  inactive tab text should stay muted with muted `text-muted-text`.

4. Build the AI architect tab.

Use shadcn components where they fit, especially `Buttons` and `textareas`. 
- Scrollable chat area
- empty state with bot icon, short description, and startup prompts
- starter chips:
    - `Design an e-commerce backend`
    - `Create a chat app architecture`
    - `Build a CI/CD pipeline`
- Style starter chips are soft pills using `bg-subtle` and `text-accent-text`
- User message should be aligned with `bg-brand-dim border-brand/50 border 2 text-copy-primary`.
- Assistant messages should be text-aligned with `bg-elevated border-surface-border text-accent-text`.
- Input area with an auto-resizing textarea around 72px minimum height and 160px maximum height.
- Send button should use `bg-accent text-white`.
- `Enter` submit: `Shift+Enter` adds a new line.

5. Build the Specs tab.
- Show a Generate Spec button using `bg-accent text-white`.
- Show a demo spec card for now.
- Style the card with `bg-elevated` and `border-surface-border`.
- Include a file/spec icon, title, short snippet, and disabled download action.

6. Use the existing project color tokens.

 Check `global.css`, `ui-content.md`, or the Tailwind mapping before adding direct color values. Avoid inventing new colors if a matching token already exists.

## Scope limits

- Don't rebuild the existing sidebar open/close behavior.
- Don't add backend logic.
- Don't add live blogger AI generation logic yet.
- Keep this focused on the sidebar UI structure. 