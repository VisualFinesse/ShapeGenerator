import { fmt } from "../fmt.js";
import type { CircleShape } from "../types.js";

export function renderCircle(
  shape: CircleShape,
  outputMode: "semantic" | "path"
): { tag: "circle" | "path"; attrs: Record<string, string | number> } {
  const { x, y, size } = shape;
  const r = size / 2;

  if (outputMode === "semantic") {
    return {
      tag: "circle",
      attrs: {
        cx: fmt(x),
        cy: fmt(y),
        r: fmt(r),
      },
    };
  } else {
    // Exact two-arc path (no Bézier)
    const d = `M ${fmt(x + r)} ${fmt(y)} A ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(x - r)} ${fmt(y)} A ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(x + r)} ${fmt(y)} Z`;
    return {
      tag: "path",
      attrs: { d },
    };
  }
}
