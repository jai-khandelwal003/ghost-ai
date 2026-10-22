// Shared by the design task (writes) and the canvas (reads). No server-only imports.
// The feed message type and its validation live in `types/tasks.ts`.

// Liveblocks user ID the design agent uses for its presence. Not a Clerk user ID.
export const AI_AGENT_USER_ID = "ghost-ai-agent";

// Display name for the agent: its presence and its chat messages.
export const AI_AGENT_NAME = "Ghost AI";

// The room's feed of AI activity; every participant reads the same feed.
export const AI_STATUS_FEED_ID = "ai-status-feed";

// The room's chat feed (people and Ghost AI). Kept apart from the status feed.
export const AI_CHAT_FEED_ID = "ai-chat";

// The room's team chat (people only). Messages here never start a design run.
export const TEAM_CHAT_FEED_ID = "team-chat";
