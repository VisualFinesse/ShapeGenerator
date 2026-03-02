import type { MaskShape, Shape } from "./types.js";
import { createPrng, maskSeed } from "./prng.js";
import { applySizeVariance, renderVaried, extractVertices, verticesToPath } from "./variation.js";
import { buildGradientDef, buildStylingAttrs } from "./styling.js";
import { shapeId } from "./id.js";
import { renderSquare } from "./shapes/square.js";
import { renderRectangle } from "./shapes/rectangle.js";
import { renderCircle } from "./shapes/circle.js";
import { renderTriangle } from "./shapes/triangle.js";
import { renderTrapezoid } from "./shapes/trapezoid.js";
import { renderOctagon } from "./shapes/octagon.js";
import { renderPolygon } from "./shapes/polygon.js";
import { renderOval } from "./shapes/oval.js";
import { renderBlob } from "./shapes/blob.js";

// ---------------------------------------------------------------------------
// buildMaskDef — renders mask shapes into a <mask> SVG element string.
//
// maskId        — the id attribute for the <mask> element (e.g. "mask-s1-circle-0")
// maskShapes    — the canonical MaskShape[] (mask/layer fields already dropped)
// mode          — "semantic" | "path" (passed through to shape renderers)
// generatorSeed — top-level generator seed (for deterministic PRNG)
// parentIndex   — original index of the masked shape (for maskSeed independence)
// gradientDefs  — accumulator array; mask shape gradients are pushed here so they
//                 appear in the top-level <defs> block alongside main-shape gradients
// ---------------------------------------------------------------------------
export function buildMaskDef(
  maskId: string,
  maskShapes: MaskShape[],
  mode: "semantic" | "path",
  generatorSeed: number,
  parentIndex: number,
  gradientDefs: string[]
): string {
  const elementStrings: string[] = [];

  for (let mi = 0; mi < maskShapes.length; mi++) {
    const ms = maskShapes[mi] as Shape;
    const sv = ms.sizeVariance ?? 0;
    const dt = ms.distort ?? 0;
    const bz = ms.bezier ?? 0;

    // Isolated PRNG for this mask shape — independent from parent shape's varPrng
    const varPrng = (sv > 0 || dt > 0) ? createPrng(maskSeed(generatorSeed, parentIndex, mi)) : null;

    // Apply sizeVariance if present
    const workShape = (sv > 0 && varPrng) ? applySizeVariance(ms, varPrng) : ms;

    // Render geometry
    let tag: string;
    let attrs: Record<string, string | number>;

    if (dt > 0 || bz > 0) {
      if (dt > 0 && varPrng) {
        const r = renderVaried(workShape, varPrng, generatorSeed, mi, bz, workShape.bezierDirection ?? "out");
        tag = r.tag; attrs = r.attrs;
      } else {
        const verts = extractVertices(workShape, generatorSeed, mi);
        const d = verticesToPath(verts, bz, workShape.bezierDirection ?? "out");
        tag = "path"; attrs = { d };
      }
    } else {
      switch (workShape.type) {
        case "square":    { const r = renderSquare(workShape, mode);    tag = r.tag; attrs = r.attrs; break; }
        case "rectangle": { const r = renderRectangle(workShape, mode); tag = r.tag; attrs = r.attrs; break; }
        case "circle":    { const r = renderCircle(workShape, mode);    tag = r.tag; attrs = r.attrs; break; }
        case "triangle":  { const r = renderTriangle(workShape, mode);  tag = r.tag; attrs = r.attrs; break; }
        case "trapezoid": { const r = renderTrapezoid(workShape, mode); tag = r.tag; attrs = r.attrs; break; }
        case "octagon":   { const r = renderOctagon(workShape, mode);   tag = r.tag; attrs = r.attrs; break; }
        case "polygon":   { const r = renderPolygon(workShape, mode);   tag = r.tag; attrs = r.attrs; break; }
        case "oval":      { const r = renderOval(workShape, mode);      tag = r.tag; attrs = r.attrs; break; }
        case "blob":      { const r = renderBlob(workShape, mode, generatorSeed, mi); tag = r.tag; attrs = r.attrs; break; }
        default: throw new Error(`Unsupported shape type in mask: ${(workShape as { type: string }).type}`);
      }
    }

    // Accumulate gradient defs for this mask shape (if any)
    const msId = shapeId(generatorSeed, ms.type, mi);
    let fillGradId: string | undefined;
    if (ms.fillGradient) {
      fillGradId = `grad-${msId}-mask-fill`;
      gradientDefs.push(buildGradientDef(fillGradId, ms.fillGradient));
    }
    let strokeGradId: string | undefined;
    if (ms.strokeGradient) {
      strokeGradId = `grad-${msId}-mask-stroke`;
      gradientDefs.push(buildGradientDef(strokeGradId, ms.strokeGradient));
    }

    // Apply styling attrs; inject fill="white" default when no fill or fillGradient
    const stylingAttrs = buildStylingAttrs(ms, fillGradId, strokeGradId);
    if (stylingAttrs.fill === undefined && fillGradId === undefined) {
      stylingAttrs.fill = "white";
    }
    Object.assign(attrs, stylingAttrs);

    // Apply rotation as transform attr if present
    if (ms.rotation !== undefined && ms.rotation !== 0) {
      attrs["transform"] = `rotate(${ms.rotation}, ${ms.x}, ${ms.y})`;
    }

    // Build element string (no id attribute — mask shapes are anonymous)
    const attrParts = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`);
    elementStrings.push(`    <${tag} ${attrParts.join(" ")}/>`);
  }

  return [
    `    <mask id="${maskId}" maskUnits="userSpaceOnUse">`,
    ...elementStrings,
    `    </mask>`,
  ].join("\n");
}
