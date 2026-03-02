// Stage 2 variation fields (optional on every shape)
export interface VariationFields {
  distort?: number;
  sizeVariance?: number;
  clamp?: { width: number; height: number };
}

// Stage 3 gradient types
export interface ColorStop {
  offset: number;    // 0–1: position along gradient
  color: string;     // CSS color string (pass-through)
  opacity?: number;  // 0–1: stop-opacity
}

export interface LinearGradient {
  type: "linear";
  x1?: number;  // 0–1 objectBoundingBox fraction; default 0
  y1?: number;  // 0–1; default 0
  x2?: number;  // 0–1; default 1
  y2?: number;  // 0–1; default 0 → left-to-right horizontal
  stops: ColorStop[];
}

export interface RadialGradient {
  type: "radial";
  cx?: number;  // 0–1; default 0.5 (center)
  cy?: number;  // 0–1; default 0.5 (center)
  r?: number;   // 0–1; default 0.5 (covers full shape)
  stops: ColorStop[];
}

export type Gradient = LinearGradient | RadialGradient;

// Stage 3 styling fields (optional on every shape)
export interface StylingFields {
  fill?: string;               // CSS color or "none"
  stroke?: string;             // CSS color or "none"
  strokeWidth?: number;        // positive finite; emitted only when stroke/strokeGradient present
  opacity?: number;            // 0–1
  fillGradient?: Gradient;     // overrides fill when present
  strokeGradient?: Gradient;   // overrides stroke when present
}

// Stage 3 bezier fields (optional on every shape)
export interface BezierFields {
  bezier?: number;                 // 0–1: corner rounding fraction
  bezierDirection?: "out" | "in"; // "out" = convex (default); "in" = concave
}

// Stage 4 layer field (optional on every shape)
export interface LayerFields {
  layer?: number;  // any finite number; default 0 for sort; lower = further back
}

// Stage 4 mask fields (optional on every shape)
export interface MaskFields {
  mask?: MaskShape | MaskShape[];  // one or more shapes defining the visible region
}

// MaskShape is the same union as Shape — all 9 types are valid as mask shapes
// mask and layer fields on MaskShape are silently ignored during rendering
export type MaskShape = Shape;

// Public types
export interface GeneratorInput {
  seed: number;
  canvas: Canvas;
  shapes: Shape[];
  outputMode?: "semantic" | "path";
}

export interface Canvas {
  width: number;
  height: number;
}

export interface ShapeBase extends VariationFields, StylingFields, BezierFields, LayerFields, MaskFields {
  type: string;
  x: number;
  y: number;
  rotation?: number;
}

// Stage 1 shapes
export interface SquareShape extends ShapeBase {
  type: "square";
  size: number;
}

export interface RectangleShape extends ShapeBase {
  type: "rectangle";
  width: number;
  height: number;
}

export interface CircleShape extends ShapeBase {
  type: "circle";
  size: number;
}

export interface TriangleShape extends ShapeBase {
  type: "triangle";
  size: number;
}

// Stage 1.5 shapes
export interface TrapezoidShape extends ShapeBase {
  type: "trapezoid";
  topWidth: number;
  bottomWidth: number;
  height: number;
}

export interface OctagonShape extends ShapeBase {
  type: "octagon";
  size: number;
}

export interface PolygonShape extends ShapeBase {
  type: "polygon";
  sides: number;
  size: number;
}

export interface OvalShape extends ShapeBase {
  type: "oval";
  width: number;
  height: number;
}

export interface BlobShape extends ShapeBase {
  type: "blob";
  size: number;
  points?: number;
}

export type Shape =
  | SquareShape
  | RectangleShape
  | CircleShape
  | TriangleShape
  | TrapezoidShape
  | OctagonShape
  | PolygonShape
  | OvalShape
  | BlobShape;

export interface GeneratorOutput {
  svg: string;
  metadata: {
    shapeCount: number;
  };
}

// Internal type — NOT exported from index.ts
export interface ShapeElement {
  tag: "rect" | "circle" | "polygon" | "path" | "ellipse";
  attrs: Record<string, string | number>;
  id: string;
  rotation?: number;
  cx: number;
  cy: number;
}
