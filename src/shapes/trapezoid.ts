import { fmt } from "../fmt.js";
import type { TrapezoidShape } from "../types.js";

export function renderTrapezoid(
  shape: TrapezoidShape,
  outputMode: "semantic" | "path"
): { tag: "polygon" | "path"; attrs: Record<string, string | number> } {
  const { x, y, topWidth, bottomWidth, height } = shape;

  // Bounding-box center: top edge at y - height/2, bottom at y + height/2
  const tlX = fmt(x - topWidth / 2);
  const tlY = fmt(y - height / 2);
  const trX = fmt(x + topWidth / 2);
  const trY = fmt(y - height / 2);
  const brX = fmt(x + bottomWidth / 2);
  const brY = fmt(y + height / 2);
  const blX = fmt(x - bottomWidth / 2);
  const blY = fmt(y + height / 2);

  if (outputMode === "semantic") {
    return {
      tag: "polygon",
      attrs: {
        points: `${tlX},${tlY} ${trX},${trY} ${brX},${brY} ${blX},${blY}`,
      },
    };
  } else {
    return {
      tag: "path",
      attrs: {
        d: `M ${tlX} ${tlY} L ${trX} ${trY} L ${brX} ${brY} L ${blX} ${blY} Z`,
      },
    };
  }
}
