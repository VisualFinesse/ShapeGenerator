import type {
  GeneratorInput,
  Canvas,
  Shape,
  SquareShape,
  RectangleShape,
  CircleShape,
  TriangleShape,
  TrapezoidShape,
  OctagonShape,
  PolygonShape,
  OvalShape,
  BlobShape,
} from "./types.js";

function canonicalizeCanvas(canvas: Canvas): Canvas {
  return {
    width: canvas.width,
    height: canvas.height,
  };
}

function canonicalizeShape(shape: Shape): Shape {
  const base = {
    x: shape.x,
    y: shape.y,
    ...(shape.rotation !== undefined     ? { rotation: shape.rotation } : {}),
    ...(shape.distort !== undefined      ? { distort: shape.distort } : {}),
    ...(shape.sizeVariance !== undefined ? { sizeVariance: shape.sizeVariance } : {}),
    ...(shape.clamp !== undefined        ? { clamp: shape.clamp } : {}),
  };

  switch (shape.type) {
    case "square": {
      const s = shape as SquareShape;
      const result: SquareShape = { type: "square", ...base, size: s.size };
      return result;
    }
    case "rectangle": {
      const s = shape as RectangleShape;
      const result: RectangleShape = {
        type: "rectangle",
        ...base,
        width: s.width,
        height: s.height,
      };
      return result;
    }
    case "circle": {
      const s = shape as CircleShape;
      const result: CircleShape = { type: "circle", ...base, size: s.size };
      return result;
    }
    case "triangle": {
      const s = shape as TriangleShape;
      const result: TriangleShape = {
        type: "triangle",
        ...base,
        size: s.size,
      };
      return result;
    }
    case "trapezoid": {
      const s = shape as TrapezoidShape;
      const result: TrapezoidShape = {
        type: "trapezoid",
        ...base,
        topWidth: s.topWidth,
        bottomWidth: s.bottomWidth,
        height: s.height,
      };
      return result;
    }
    case "octagon": {
      const s = shape as OctagonShape;
      const result: OctagonShape = { type: "octagon", ...base, size: s.size };
      return result;
    }
    case "polygon": {
      const s = shape as PolygonShape;
      const result: PolygonShape = {
        type: "polygon",
        ...base,
        sides: s.sides,
        size: s.size,
      };
      return result;
    }
    case "oval": {
      const s = shape as OvalShape;
      const result: OvalShape = {
        type: "oval",
        ...base,
        width: s.width,
        height: s.height,
      };
      return result;
    }
    case "blob": {
      const s = shape as BlobShape;
      const result: BlobShape = {
        type: "blob",
        ...base,
        size: s.size,
        ...(s.points !== undefined ? { points: s.points } : {}),
      };
      return result;
    }
    default:
      // Unknown type — pass through with only base fields; validate() will catch it
      return { type: (shape as Shape).type, ...base } as Shape;
  }
}

export function canonicalize(input: GeneratorInput): GeneratorInput {
  const result: GeneratorInput = {
    seed: input.seed,
    canvas: canonicalizeCanvas(input.canvas),
    shapes: input.shapes.map(canonicalizeShape),
    ...(input.outputMode !== undefined ? { outputMode: input.outputMode } : {}),
  };
  return result;
}
