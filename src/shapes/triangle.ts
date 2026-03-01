import { fmt } from "../fmt.js";
import type { TriangleShape } from "../types.js";

export function renderTriangle(
  shape: TriangleShape,
  outputMode: "semantic" | "path"
): { tag: "polygon" | "path"; attrs: Record<string, string | number> } {
  const { x, y, size } = shape;
  const h = size * Math.sqrt(3) / 2;

  // Equilateral triangle centroid vertices
  const topX = fmt(x);
  const topY = fmt(y - (2 * h) / 3);
  const blX = fmt(x - size / 2);
  const blY = fmt(y + h / 3);
  const brX = fmt(x + size / 2);
  const brY = fmt(y + h / 3);

  if (outputMode === "semantic") {
    return {
      tag: "polygon",
      attrs: {
        points: `${topX},${topY} ${blX},${blY} ${brX},${brY}`,
      },
    };
  } else {
    return {
      tag: "path",
      attrs: {
        d: `M ${topX} ${topY} L ${blX} ${blY} L ${brX} ${brY} Z`,
      },
    };
  }
}
