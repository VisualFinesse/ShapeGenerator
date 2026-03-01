import { fmt } from "../fmt.js";
import type { OvalShape } from "../types.js";

export function renderOval(
  shape: OvalShape,
  outputMode: "semantic" | "path"
): { tag: "ellipse" | "path"; attrs: Record<string, string | number> } {
  const { x, y, width, height } = shape;
  const rx = width / 2;
  const ry = height / 2;

  if (outputMode === "semantic") {
    return {
      tag: "ellipse",
      attrs: {
        cx: fmt(x),
        cy: fmt(y),
        rx: fmt(rx),
        ry: fmt(ry),
      },
    };
  } else {
    // Two-arc path split at left and right extremes (exact ellipse representation)
    const right = fmt(x + rx);
    const left = fmt(x - rx);
    const cy = fmt(y);
    const rxF = fmt(rx);
    const ryF = fmt(ry);
    return {
      tag: "path",
      attrs: {
        d: `M ${right} ${cy} A ${rxF} ${ryF} 0 1 0 ${left} ${cy} A ${rxF} ${ryF} 0 1 0 ${right} ${cy} Z`,
      },
    };
  }
}
