"use client";

import { useState, type DragEvent } from "react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CanvasNodeView } from "@/components/canvas/canvas-node";
import { ShapePanel } from "@/components/canvas/shape-panel";
import {
  createCanvasNode,
  hasShapeDragPayload,
  readShapeDragPayload,
} from "@/lib/canvas-shapes";
import {
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

// Module-level so the hook receives the same arrays on every render.
const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];

// Module-level so React Flow does not remount every node on each render.
const NODE_TYPES: NodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeView };

// Keeps a canvas with one or two nodes from opening zoomed in.
const FIT_VIEW_OPTIONS = { maxZoom: 1 };

// Must render inside a `RoomProvider` and a suspense boundary (see `CanvasRoom`).
export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  );
}

// Inside `ReactFlowProvider` so `useReactFlow` can convert drop positions.
function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: INITIAL_NODES },
      edges: { initial: INITIAL_EDGES },
    });
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();
  // On an empty room React Flow keeps `fitView` queued until the first node appears, then
  // re-fits the viewport and the dropped shape jumps away from the cursor. Only fit a room
  // that already had nodes when it loaded.
  const [shouldFitView] = useState(() => nodes.length > 0);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasShapeDragPayload(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const payload = readShapeDragPayload(event.dataTransfer);
    if (!payload) return;
    event.preventDefault();

    // Center the new node on the drop point.
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const node = createCanvasNode(payload, {
      x: point.x - payload.width / 2,
      y: point.y - payload.height / 2,
    });
    onNodesChange([{ type: "add", item: node }]);
  }

  return (
    <div className="relative h-full w-full">
      {/* Drop handlers sit on React Flow itself so drops land on the pane, as in React Flow's own example. */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        fitView={shouldFitView}
        fitViewOptions={FIT_VIEW_OPTIONS}
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          bgColor="var(--bg-base)"
          color="var(--border-subtle)"
        />
        <MiniMap
          bgColor="var(--bg-surface)"
          maskColor="var(--accent-primary-dim)"
          nodeColor="var(--border-subtle)"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}
