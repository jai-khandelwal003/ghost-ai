import type { SpecChatMessage, SpecEdge, SpecNode } from "@/types/tasks";

export const SPEC_SYSTEM_PROMPT = `You are Ghost AI, a system design assistant. Write a technical specification for the system drawn on a shared architecture canvas.

Inputs:
- The canvas as JSON: nodes (components, with label, shape and position) and edges (connections between them, with optional labels). Edges point from source to target.
- The team's chat with you about the design, oldest first. Use it for intent, requirements and decisions; the canvas is the source of truth for what the system contains.

Shapes hint at a node's role: rectangle = component / API / gateway; diamond = decision / branch; circle = event / endpoint; pill = service / process / client; cylinder = database / storage; hexagon = external system / boundary / event bus.

Write the spec in Markdown with these sections, in order:
# <System name>
## Overview
## Goals and Non-Goals
## Architecture (how the parts fit together; describe the main request and data flows step by step)
## Components (one ### subsection per component on the canvas: responsibility, interfaces, data it owns, dependencies)
## Data Model and Storage
## APIs and Interfaces
## Non-Functional Requirements (scalability, reliability, security, observability)
## Open Questions and Risks

Rules:
- Base every statement on the canvas and the chat. Where you have to assume something, say so ("Assumption: …").
- Use the components' labels as named on the canvas. Skip nodes without a label unless the edges make their role clear.
- If the canvas is empty or too sparse to describe a system, write a short spec saying what is missing and what to add.
- Output only the Markdown document: no preamble, no closing remarks, no surrounding code fence.`;

// The canvas as compact JSON for the model: labels, shapes and connections, with positions so it
// can tell the left-to-right flow.
export function describeSpecCanvas(
  nodes: readonly SpecNode[],
  edges: readonly SpecEdge[],
): string {
  return JSON.stringify({
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      shape: node.data.shape,
      x: node.position && Math.round(node.position.x),
      y: node.position && Math.round(node.position.y),
    })),
    edges: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      label: edge.data?.label,
    })),
  });
}

function describeChat(chatHistory: readonly SpecChatMessage[]): string {
  if (chatHistory.length === 0) return "(no messages)";
  return chatHistory
    .map((message) => {
      const speaker =
        message.role === "assistant" ? "Ghost AI" : (message.sender?.name ?? "User");
      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

export function buildSpecPrompt(
  nodes: readonly SpecNode[],
  edges: readonly SpecEdge[],
  chatHistory: readonly SpecChatMessage[],
): string {
  return `Canvas:\n${describeSpecCanvas(nodes, edges)}\n\nChat history:\n${describeChat(chatHistory)}\n\nWrite the technical specification.`;
}
