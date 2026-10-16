"use client";

import { useState, type DragEvent } from "react";
import { useHistory, useRedo, useUndo } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CanvasControls } from "@/components/canvas/canvas-controls";
import { CanvasEdgeView } from "@/components/canvas/canvas-edge";
import { CanvasNodeView } from "@/components/canvas/canvas-node";
import { ShapePanel } from "@/components/canvas/shape-panel";
import {
  instantiateTemplate,
  type CanvasTemplate,
} from "@/components/editor/starter-template";
import { useStarterTemplates } from "@/components/editor/starter-templates-context";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import {
  useKeyboardShortcuts,
  ZOOM_ANIMATION_MS,
} from "@/hooks/use-keyboard-shortcuts";
import {
  createCanvasNode,
  hasShapeDragPayload,
  readShapeDragPayload,
} from "@/lib/canvas-shapes";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

// Module-level so the hook receives the same arrays on every render.
const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];

// Module-level so React Flow does not remount every node on each render.
const NODE_TYPES: NodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeView };
const EDGE_TYPES: EdgeTypes = { [CANVAS_EDGE_TYPE]: CanvasEdgeView };

const EDGE_COLOR = "var(--text-secondary)";

// React Flow merges these into every new connection before `onConnect`, so they are stored
// with the edge in Liveblocks; it also applies them to edges that lack a field when rendering.
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 16, height: 16 },
  style: {
    stroke: EDGE_COLOR,
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
};

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
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const undo = useUndo();
  const redo = useRedo();
  const history = useHistory();
  useKeyboardShortcuts({ reactFlow, undo, redo });
  // Opened from the navbar's Templates button (`EditorShell`).
  const templates = useStarterTemplates();
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

  // Replaces everything on the canvas with the template as one undo step (the modal tells the
  // user to undo if they did not mean it), then fits the view to the new diagram.
  function handleImportTemplate(template: CanvasTemplate) {
    const copy = instantiateTemplate(template);

    history.pause();
    onEdgesChange(edges.map((edge) => ({ type: "remove", id: edge.id })));
    onNodesChange(nodes.map((node) => ({ type: "remove", id: node.id })));
    onNodesChange(copy.nodes.map((item) => ({ type: "add", item })));
    onEdgesChange(copy.edges.map((item) => ({ type: "add", item })));
    history.resume();

    // Wait a frame so React Flow has the new nodes before fitting.
    requestAnimationFrame(() => {
      void reactFlow.fitView({ ...FIT_VIEW_OPTIONS, duration: ZOOM_ANIMATION_MS });
    });
  }

  return (
    <div className="relative h-full w-full">
      {/* Drop handlers sit on React Flow itself so drops land on the pane, as in React Flow's own example. */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
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
      </ReactFlow>
      <ShapePanel />
      <CanvasControls fitViewOptions={FIT_VIEW_OPTIONS} />
      {templates && (
        <StarterTemplatesModal
          open={templates.isOpen}
          onOpenChange={templates.setIsOpen}
          onImport={handleImportTemplate}
        />
      )}
    </div>
  );
}
