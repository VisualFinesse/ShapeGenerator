import { fmt } from "../fmt.js";
import type { SquareShape } from "../types.js";

export function renderSquare(
  shape: SquareShape,
  outputMode: "semantic" | "path"
): { tag: "rect" | "path"; attrs: Record<string, string | number> } {
  const { x, y, size } = shape;
  const halfW = size / 2;
  const halfH = size / 2;

  if (outputMode === "semantic") {
    return {
      tag: "rect",
      attrs: {
        x: fmt(x - halfW),
        y: fmt(y - halfH),
        width: fmt(size),
        height: fmt(size),
      },
    };
  } else {
    // TL → TR → BR → BL
    const x1 = fmt(x - halfW);
    const y1 = fmt(y - halfH);
    const x2 = fmt(x + halfW);
    const y2 = fmt(y - halfH);
    const x3 = fmt(x + halfW);
    const y3 = fmt(y + halfH);
    const x4 = fmt(x - halfW);
    const y4 = fmt(y + halfH);
    return {
      tag: "path",
      attrs: {
        d: `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`,
      },
    };
  }
}
