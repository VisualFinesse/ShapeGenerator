import { fmt } from "../fmt.js";
import type { OctagonShape } from "../types.js";

export function renderOctagon(
  shape: OctagonShape,
  outputMode: "semantic" | "path"
): { tag: "polygon" | "path"; attrs: Record<string, string | number> } {
  const { x, y, size } = shape;
  const n = 8;

  // Regular octagon: 8 vertices at k·π/4 − π/2, first vertex at top
  const vertices: [string, string][] = [];
  for (let k = 0; k < n; k++) {
    const angle = (k * Math.PI * 2) / n - Math.PI / 2;
    vertices.push([fmt(x + size * Math.cos(angle)), fmt(y + size * Math.sin(angle))]);
  }

  if (outputMode === "semantic") {
    return {
      tag: "polygon",
      attrs: {
        points: vertices.map(([vx, vy]) => `${vx},${vy}`).join(" "),
      },
    };
  } else {
    const [first, ...rest] = vertices;
    const d = `M ${first[0]} ${first[1]} ` + rest.map(([vx, vy]) => `L ${vx} ${vy}`).join(" ") + " Z";
    return { tag: "path", attrs: { d } };
  }
}
