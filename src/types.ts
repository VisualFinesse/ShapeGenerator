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

export type Shape = SquareShape | RectangleShape | CircleShape | TriangleShape;

export interface GeneratorOutput {
  svg: string;
  metadata: {
    shapeCount: number;
  };
}

// Internal type — NOT exported from index.ts
export interface ShapeElement {
  tag: "rect" | "circle" | "polygon" | "path";
  attrs: Record<string, string | number>;
  id: string;
  rotation?: number;
  cx: number;
  cy: number;
}
