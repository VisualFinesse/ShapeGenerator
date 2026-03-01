import type { GeneratorInput, GeneratorOutput, ShapeElement } from "./types.js";
import { shapeId } from "./id.js";
import { assembleSvg } from "./svg.js";
import { renderSquare } from "./shapes/square.js";
import { renderRectangle } from "./shapes/rectangle.js";
import { renderCircle } from "./shapes/circle.js";
import { renderTriangle } from "./shapes/triangle.js";
import { renderTrapezoid } from "./shapes/trapezoid.js";
import { renderOctagon } from "./shapes/octagon.js";
import { renderPolygon } from "./shapes/polygon.js";
import { renderOval } from "./shapes/oval.js";
import { renderBlob } from "./shapes/blob.js";
import { canonicalize } from "./canonicalize.js";
import { validate } from "./validate.js";
import { createPrng, varSeed } from "./prng.js";
import { applySizeVariance, renderVaried } from "./variation.js";

export function generate(input: GeneratorInput): GeneratorOutput {
  const canonical = canonicalize(input);
  validate(canonical);
  const mode = canonical.outputMode ?? "semantic";
  const elements: ShapeElement[] = canonical.shapes.map((shape, i) => {
    const sv = shape.sizeVariance ?? 0;
    const dt = shape.distort ?? 0;

    // Create variation PRNG only when needed
    const varPrng = (sv > 0 || dt > 0) ? createPrng(varSeed(canonical.seed, i)) : null;

    // 1. Apply sizeVariance (scale size dims, consumes one prng draw)
    const workShape = (sv > 0 && varPrng) ? applySizeVariance(shape, varPrng) : shape;

    let tag: ShapeElement["tag"];
    let attrs: Record<string, string | number>;

    if (dt > 0 && varPrng) {
      // 2. Apply distortion → always <path>
      const r = renderVaried(workShape, varPrng, canonical.seed, i);
      tag = r.tag; attrs = r.attrs;
    } else {
      // Normal render pipeline
      switch (workShape.type) {
        case "square":    { const r = renderSquare(workShape, mode);    tag = r.tag; attrs = r.attrs; break; }
        case "rectangle": { const r = renderRectangle(workShape, mode); tag = r.tag; attrs = r.attrs; break; }
        case "circle":    { const r = renderCircle(workShape, mode);    tag = r.tag; attrs = r.attrs; break; }
        case "triangle":  { const r = renderTriangle(workShape, mode);  tag = r.tag; attrs = r.attrs; break; }
        case "trapezoid": { const r = renderTrapezoid(workShape, mode); tag = r.tag; attrs = r.attrs; break; }
        case "octagon":   { const r = renderOctagon(workShape, mode);   tag = r.tag; attrs = r.attrs; break; }
        case "polygon":   { const r = renderPolygon(workShape, mode);   tag = r.tag; attrs = r.attrs; break; }
        case "oval":      { const r = renderOval(workShape, mode);      tag = r.tag; attrs = r.attrs; break; }
        case "blob":      { const r = renderBlob(workShape, mode, canonical.seed, i); tag = r.tag; attrs = r.attrs; break; }
        default: throw new Error(`Unsupported shape type: ${(workShape as { type: string }).type}`);
      }
    }

    return { tag, attrs, id: shapeId(canonical.seed, shape.type, i), rotation: shape.rotation, cx: shape.x, cy: shape.y };
  });
  return { svg: assembleSvg(canonical.canvas, elements), metadata: { shapeCount: canonical.shapes.length } };
}
