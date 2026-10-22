"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  useHistory,
  useRedo,
  useRoom,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  getConnectedEdges,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
  useReactFlow,
  useStoreApi,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AiStatus } from "@/components/canvas/ai-status";
import { CanvasControls } from "@/components/canvas/canvas-controls";
import { CanvasEdgeView } from "@/components/canvas/canvas-edge";
import { CanvasNodeView } from "@/components/canvas/canvas-node";
import { LiveCursors } from "@/components/canvas/live-cursors";
import { PresenceAvatars } from "@/components/canvas/presence-avatars";
import { ShapePanel } from "@/components/canvas/shape-panel";
import {
  instantiateTemplate,
  type CanvasTemplate,
} from "@/components/editor/starter-template";
import {
  useCanvasSaveReporter,
  type CanvasSaveControl,
} from "@/components/editor/canvas-save-context";
import { useStarterTemplates } from "@/components/editor/starter-templates-context";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import {
  isEditableTarget,
  useKeyboardShortcuts,
  ZOOM_ANIMATION_MS,
} from "@/hooks/use-keyboard-shortcuts";
import { useSavedCanvas } from "@/hooks/use-saved-canvas";
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
  type CanvasSnapshot,
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
  const reactFlowStore = useStoreApi<CanvasNode, CanvasEdge>();
  // React Flow's view of the same nodes and edges, including each one's local `selected` flag.
  const flowNodes = useNodes<CanvasNode>();
  const flowEdges = useEdges<CanvasEdge>();
  const undo = useUndo();
  const redo = useRedo();
  const history = useHistory();
  const updateMyPresence = useUpdateMyPresence();
  useKeyboardShortcuts({ reactFlow, undo, redo });
  // Opened from the navbar's Templates button (`EditorShell`).
  const templates = useStarterTemplates();
  // On an empty room React Flow keeps `fitView` queued until the first node appears, then
  // re-fits the viewport and the dropped shape jumps away from the cursor. Only fit a room
  // that already had nodes when it loaded.
  const [shouldFitView] = useState(() => nodes.length > 0);

  // Project ID = room ID.
  const projectId = useRoom().id;

  // Restoring the saved canvas is not an undoable edit, so the history is cleared afterwards.
  const loadSnapshot = useCallback(
    (snapshot: CanvasSnapshot) => {
      onNodesChange(snapshot.nodes.map((item) => ({ type: "add", item })));
      onEdgesChange(snapshot.edges.map((item) => ({ type: "add", item })));
      history.clear();
      requestAnimationFrame(() => {
        void reactFlow.fitView(FIT_VIEW_OPTIONS);
      });
    },
    [onNodesChange, onEdgesChange, history, reactFlow]
  );
  const savedCanvas = useSavedCanvas({
    projectId,
    nodes,
    edges,
    onLoad: loadSnapshot,
  });
  const { status: autosaveStatus, save } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: savedCanvas.state === "ready",
  });

  // Reported to the navbar's Save button. If the saved canvas could not be loaded, autosave
  // stays off (an empty room must not replace the stored snapshot) and the button retries the load.
  const reportSave = useCanvasSaveReporter();
  const saveControl = useMemo<CanvasSaveControl>(() => {
    if (savedCanvas.state === "loading") return { status: "idle" };
    if (savedCanvas.state === "error") {
      return {
        status: "error",
        error: "The saved canvas could not be loaded. Click to try again.",
        onSave: savedCanvas.retry,
      };
    }
    return {
      status: autosaveStatus,
      error: "The canvas could not be saved. Click to try again.",
      onSave: () => void save(),
    };
  }, [savedCanvas.state, savedCanvas.retry, autosaveStatus, save]);
  useEffect(() => {
    reportSave?.(saveControl);
  }, [reportSave, saveControl]);
  useEffect(() => () => reportSave?.(null), [reportSave]);

  // Delete / Backspace remove the selection through Liveblocks' `onDelete` (one Storage
  // mutation, so one undo step, synced to everyone). React Flow's own key deletion is off
  // (`deleteKeyCode={null}`). Edges attached to a deleted node go with it.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      // Keys pressed inside a dialog (e.g. the templates modal) belong to the dialog.
      if (event.target instanceof Element && event.target.closest("[role=dialog]")) {
        return;
      }

      const selectedNodes = flowNodes.filter((node) => node.selected);
      const selectedEdges = flowEdges.filter((edge) => edge.selected);
      if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

      const edgesToDelete = new Map(
        [...selectedEdges, ...getConnectedEdges(selectedNodes, flowEdges)].map(
          (edge) => [edge.id, edge]
        )
      );
      event.preventDefault();
      onDelete({ nodes: selectedNodes, edges: [...edgesToDelete.values()] });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flowNodes, flowEdges, onDelete]);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasShapeDragPayload(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const payload = readShapeDragPayload(event.dataTransfer);
    if (!payload) return;
    event.preventDefault();

    // `screenToFlowPosition` takes the pane's bounding rect, pan and zoom into account. The
    // grab point is where the cursor sits inside the drag image (its center for the shape
    // previews), so the node lands exactly under the image the user was dragging.
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const node = createCanvasNode(payload, {
      x: point.x - payload.width * payload.grabX,
      y: point.y - payload.height * payload.grabY,
    });

    // A `fitView()` made while the canvas was empty (e.g. the Fit view button) stays queued in
    // React Flow until the first node is measured, then zooms onto it. Drop it so the viewport
    // stays where the user left it.
    reactFlowStore.setState({ fitViewQueued: false, fitViewOptions: undefined });
    onNodesChange([{ type: "add", item: node }]);
  }

  // Broadcast in canvas coordinates so other users see the pointer over the same spot at
  // any pan or zoom (`LiveCursors`).
  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    updateMyPresence({
      cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    });
  }

  function handleMouseLeave() {
    updateMyPresence({ cursor: null });
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
        deleteKeyCode={null}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
        <LiveCursors />
      </ReactFlow>
      <PresenceAvatars />
      <AiStatus />
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
