"use client";

import { Download, X } from "lucide-react";

import { SVG_SHAPE_PATHS, type SvgShape } from "@/components/canvas/node-shape";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_SHAPE_SIZES } from "@/lib/canvas-shapes";
import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called with the chosen template; the modal closes itself afterwards.
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 rounded-3xl p-6 sm:max-w-4xl"
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-semibold text-copy-primary">
            Import Template
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            Choose a starter template to pre-populate your canvas. Any existing
            nodes will be replaced — use <UndoShortcut /> to undo.
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute top-5 right-5 rounded-full border-surface-border text-copy-secondary hover:text-copy-primary"
            />
          }
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <ScrollArea className="-mx-1 max-h-[70vh]">
          <ul className="grid gap-4 p-1 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <li
                key={template.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface"
              >
                <TemplatePreview template={template} />
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-medium text-copy-primary">
                    {template.name}
                  </h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-copy-muted">
                    {template.description}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 w-full border-surface-border text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                    onClick={() => {
                      onImport(template);
                      onOpenChange(false);
                    }}
                    aria-label={`Import ${template.name}`}
                  >
                    <Download className="h-4 w-4" />
                    Import
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ⌘Z on Apple platforms, Ctrl Z elsewhere. The modal only renders in the browser (inside the
// canvas's client-side suspense), so `navigator` is available.
function UndoShortcut() {
  const isApple = /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <kbd className="rounded-md border border-surface-border bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-copy-secondary">
      {isApple ? "⌘Z" : "Ctrl Z"}
    </kbd>
  );
}

// Fixed preview viewport, in SVG units; the diagram is scaled and centered inside it.
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 180;
const PREVIEW_PADDING = 20;

type Box = { x: number; y: number; width: number; height: number };

// A plain SVG drawing of the template; no React Flow instance.
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const boxes = new Map(template.nodes.map((node) => [node.id, nodeBox(node)]));
  const fit = fitToViewport([...boxes.values()]);

  function project(box: Box): Box {
    return {
      x: fit.offsetX + box.x * fit.scale,
      y: fit.offsetY + box.y * fit.scale,
      width: box.width * fit.scale,
      height: box.height * fit.scale,
    };
  }

  return (
    <svg
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      aria-hidden
      className="block h-auto w-full border-b border-surface-border bg-base"
    >
      {template.edges.map((edge) => {
        const source = boxes.get(edge.source);
        const target = boxes.get(edge.target);
        if (!source || !target) return null;
        const from = center(project(source));
        const to = center(project(target));

        return (
          <line
            key={edge.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--text-faint)"
            strokeWidth={1}
          />
        );
      })}
      {template.nodes.map((node) => (
        <PreviewNode
          key={node.id}
          node={node}
          box={project(boxes.get(node.id)!)}
        />
      ))}
    </svg>
  );
}

function PreviewNode({ node, box }: { node: CanvasNode; box: Box }) {
  const { shape, color } = node.data;
  const accent =
    NODE_COLORS.find((pair) => pair.fill === color)?.text ??
    NODE_COLORS[0].text;
  // Muted: the node's fill under a faint wash and outline of its accent color.
  const paint = {
    fill: color,
    stroke: accent,
    strokeOpacity: 0.35,
    strokeWidth: 1,
  };
  const wash = { fill: accent, fillOpacity: 0.12, stroke: "none" };

  if (shape === "circle") {
    const ellipse = {
      cx: box.x + box.width / 2,
      cy: box.y + box.height / 2,
      rx: box.width / 2,
      ry: box.height / 2,
    };
    return (
      <g>
        <ellipse {...ellipse} {...paint} />
        <ellipse {...ellipse} {...wash} />
      </g>
    );
  }

  if (shape === "rectangle" || shape === "pill") {
    const rx = shape === "pill" ? box.height / 2 : Math.min(3, box.height / 4);
    return (
      <g>
        <rect {...box} rx={rx} {...paint} />
        <rect {...box} rx={rx} {...wash} />
      </g>
    );
  }

  // Same 100×100 outlines as the canvas, stretched to the node's box.
  const [outline, ...details] = SVG_SHAPE_PATHS[shape satisfies SvgShape];

  return (
    <svg {...box} viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">
      <path d={outline} {...paint} vectorEffect="non-scaling-stroke" />
      <path d={outline} {...wash} />
      {details.map((d) => (
        <path
          key={d}
          d={d}
          {...paint}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function nodeBox(node: CanvasNode): Box {
  const fallback = DEFAULT_SHAPE_SIZES[node.data.shape];
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? fallback.width,
    height: node.height ?? fallback.height,
  };
}

// Bounds of all nodes, scaled to fit inside the padded viewport and centered in it.
function fitToViewport(boxes: Box[]) {
  if (boxes.length === 0) return { scale: 1, offsetX: 0, offsetY: 0 };

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / width,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / height,
  );

  return {
    scale,
    offsetX: (PREVIEW_WIDTH - width * scale) / 2 - minX * scale,
    offsetY: (PREVIEW_HEIGHT - height * scale) / 2 - minY * scale,
  };
}

function center(box: Box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
