import { fmt } from "./fmt.js";
import type { Gradient, ShapeBase } from "./types.js";

// ---------------------------------------------------------------------------
// buildGradientDef — build SVG <linearGradient> or <radialGradient> element string
// ---------------------------------------------------------------------------
export function buildGradientDef(gradientId: string, gradient: Gradient): string {
  const stops = gradient.stops.map((stop) => {
    let s = `      <stop offset="${fmt(stop.offset)}" stop-color="${stop.color}"`;
    if (stop.opacity !== undefined) s += ` stop-opacity="${fmt(stop.opacity)}"`;
    s += "/>";
    return s;
  }).join("\n");

  if (gradient.type === "linear") {
    const x1 = gradient.x1 ?? 0;
    const y1 = gradient.y1 ?? 0;
    const x2 = gradient.x2 ?? 1;
    const y2 = gradient.y2 ?? 0;
    return [
      `    <linearGradient id="${gradientId}" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" gradientUnits="objectBoundingBox">`,
      stops,
      `    </linearGradient>`,
    ].join("\n");
  } else {
    const cx = gradient.cx ?? 0.5;
    const cy = gradient.cy ?? 0.5;
    const r  = gradient.r  ?? 0.5;
    return [
      `    <radialGradient id="${gradientId}" cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" gradientUnits="objectBoundingBox">`,
      stops,
      `    </radialGradient>`,
    ].join("\n");
  }
}

// ---------------------------------------------------------------------------
// buildStylingAttrs — build SVG presentation attributes from styling fields
// Handles fill/stroke precedence: gradient URL overrides string color.
// ---------------------------------------------------------------------------
export function buildStylingAttrs(
  shape: ShapeBase,
  fillGradId?: string,
  strokeGradId?: string
): Record<string, string | number> {
  const attrs: Record<string, string | number> = {};

  // Fill: gradient URL takes precedence over string color
  if (fillGradId !== undefined) {
    attrs.fill = `url(#${fillGradId})`;
  } else if (shape.fill !== undefined) {
    attrs.fill = shape.fill;
  }

  // Stroke: gradient URL takes precedence over string color
  if (strokeGradId !== undefined) {
    attrs.stroke = `url(#${strokeGradId})`;
  } else if (shape.stroke !== undefined) {
    attrs.stroke = shape.stroke;
  }

  // stroke-width: only emitted when there is a stroke source
  const hasStrokeSrc = strokeGradId !== undefined || shape.stroke !== undefined;
  if (hasStrokeSrc && shape.strokeWidth !== undefined) {
    attrs["stroke-width"] = fmt(shape.strokeWidth);
  }

  // Opacity
  if (shape.opacity !== undefined) {
    attrs.opacity = fmt(shape.opacity);
  }

  return attrs;
}
