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

export interface ShapeBase {
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
