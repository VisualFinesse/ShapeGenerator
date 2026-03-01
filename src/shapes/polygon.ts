import { fmt } from "../fmt.js";
import type { PolygonShape } from "../types.js";

export function renderPolygon(
  shape: PolygonShape,
  outputMode: "semantic" | "path"
): { tag: "polygon" | "path"; attrs: Record<string, string | number> } {
  const { x, y, size, sides } = shape;

  // Regular n-gon: n vertices at 2πk/n − π/2, first vertex at top
  const vertices: [string, string][] = [];
  for (let k = 0; k < sides; k++) {
    const angle = (k * Math.PI * 2) / sides - Math.PI / 2;
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
