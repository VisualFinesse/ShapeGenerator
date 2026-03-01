import type { GeneratorInput, GeneratorOutput, ShapeElement } from "./types.js";
import { shapeId } from "./id.js";
import { assembleSvg } from "./svg.js";
import { renderSquare } from "./shapes/square.js";
import { renderRectangle } from "./shapes/rectangle.js";
import { renderCircle } from "./shapes/circle.js";
import { renderTriangle } from "./shapes/triangle.js";
import { canonicalize } from "./canonicalize.js";
import { validate } from "./validate.js";

export function generate(input: GeneratorInput): GeneratorOutput {
  const canonical = canonicalize(input);
  validate(canonical);
  const mode = canonical.outputMode ?? "semantic";
  const elements: ShapeElement[] = canonical.shapes.map((shape, i) => {
    let tag: ShapeElement["tag"];
    let attrs: Record<string, string | number>;
    switch (shape.type) {
      case "square": { const r = renderSquare(shape, mode); tag = r.tag; attrs = r.attrs; break; }
      case "rectangle": { const r = renderRectangle(shape, mode); tag = r.tag; attrs = r.attrs; break; }
      case "circle": { const r = renderCircle(shape, mode); tag = r.tag; attrs = r.attrs; break; }
      case "triangle": { const r = renderTriangle(shape, mode); tag = r.tag; attrs = r.attrs; break; }
      default: throw new Error(`Unsupported shape type: ${(shape as { type: string }).type}`);
    }
    return { tag, attrs, id: shapeId(canonical.seed, shape.type, i), rotation: shape.rotation, cx: shape.x, cy: shape.y };
  });
  return { svg: assembleSvg(canonical.canvas, elements), metadata: { shapeCount: canonical.shapes.length } };
}
