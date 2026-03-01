import type {
  GeneratorInput,
  Canvas,
  Shape,
  SquareShape,
  RectangleShape,
  CircleShape,
  TriangleShape,
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
    ...(shape.rotation !== undefined ? { rotation: shape.rotation } : {}),
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
