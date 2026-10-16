import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { NodeShape } from "@/types/canvas";

type CssShape = Extract<NodeShape, "rectangle" | "pill" | "circle">;
export type SvgShape = Exclude<NodeShape, CssShape>;

const CSS_SHAPE_RADIUS: Record<CssShape, string> = {
  rectangle: "rounded-md",
  pill: "rounded-full",
  circle: "rounded-[50%]",
};

// Drawn in a 100×100 box and stretched to the node's size (`preserveAspectRatio="none"`).
// `vector-effect="non-scaling-stroke"` keeps the outline 1px however the box is stretched.
const CYLINDER_CAP = 12;

// Also used by the starter template previews.
export const SVG_SHAPE_PATHS: Record<SvgShape, string[]> = {
  diamond: ["M50 0 L100 50 L50 100 L0 50 Z"],
  hexagon: ["M25 0 L75 0 L100 50 L75 100 L25 100 L0 50 Z"],
  cylinder: [
    `M0 ${CYLINDER_CAP} A50 ${CYLINDER_CAP} 0 0 1 100 ${CYLINDER_CAP} L100 ${100 - CYLINDER_CAP} A50 ${CYLINDER_CAP} 0 0 1 0 ${100 - CYLINDER_CAP} Z`,
    // Front half of the top rim, so the cap reads as an ellipse.
    `M0 ${CYLINDER_CAP} A50 ${CYLINDER_CAP} 0 0 0 100 ${CYLINDER_CAP}`,
  ],
};

// Keeps labels inside the usable area of each SVG outline.
const SVG_LABEL_INSET: Record<SvgShape, string> = {
  diamond: "px-[22%] py-[22%]",
  hexagon: "px-[18%]",
  cylinder: "px-2 pt-[24%] pb-[8%]",
};

type NodeShapeViewProps = {
  shape: NodeShape;
  fill: string;
  textColor?: string;
  selected?: boolean;
  className?: string;
  children?: ReactNode;
};

// Fills its parent. Shared by canvas nodes and the shape panel's drag preview.
export function NodeShapeView({
  shape,
  fill,
  textColor,
  selected = false,
  className,
  children,
}: NodeShapeViewProps) {
  const labelClassName =
    "flex h-full w-full items-center justify-center text-center text-sm break-words";

  if (isCssShape(shape)) {
    return (
      <div
        className={cn(
          labelClassName,
          "border px-3 transition-colors",
          CSS_SHAPE_RADIUS[shape],
          // The lighter border keeps the default near-black fill visible on the dark canvas.
          selected ? "border-brand" : "border-surface-border-subtle",
          className,
        )}
        style={{ backgroundColor: fill, color: textColor }}
      >
        {children}
      </div>
    );
  }

  const [outline, ...details] = SVG_SHAPE_PATHS[shape];

  return (
    <div className={cn("relative h-full w-full", className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        overflow="visible"
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full transition-colors",
          selected ? "stroke-brand" : "stroke-surface-border-subtle",
        )}
      >
        <path d={outline} fill={fill} vectorEffect="non-scaling-stroke" />
        {details.map((d) => (
          <path key={d} d={d} fill="none" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div
        className={cn(
          labelClassName,
          "relative",
          SVG_LABEL_INSET[shape],
        )}
        style={{ color: textColor }}
      >
        {children}
      </div>
    </div>
  );
}

function isCssShape(shape: NodeShape): shape is CssShape {
  return shape in CSS_SHAPE_RADIUS;
}
