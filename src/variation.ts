import { fmt } from "./fmt.js";
import { createPrng, blobSeed } from "./prng.js";
import type { Shape } from "./types.js";

// ---------------------------------------------------------------------------
// charSizeOf — characteristic half-size used as distortion magnitude basis
// ---------------------------------------------------------------------------
export function charSizeOf(shape: Shape): number {
  switch (shape.type) {
    case "square":    return shape.size / 2;
    case "circle":    return shape.size / 2;
    case "triangle":  return shape.size / 2;
    case "octagon":   return shape.size / 2;
    case "polygon":   return shape.size / 2;
    case "blob":      return shape.size / 2;
    case "rectangle": return Math.min(shape.width, shape.height) / 2;
    case "oval":      return Math.min(shape.width, shape.height) / 2;
    case "trapezoid": return Math.min(shape.topWidth, shape.bottomWidth, shape.height) / 2;
    default:          return 1;
  }
}

// ---------------------------------------------------------------------------
// extractVertices — get [x, y] vertex list from a shape
// For circle/oval: samples 16 points around the perimeter.
// For blob: re-derives N control points using blobSeed PRNG.
// ---------------------------------------------------------------------------
export function extractVertices(
  shape: Shape,
  generatorSeed: number,
  shapeIndex: number
): [number, number][] {
  const { x, y } = shape;
  switch (shape.type) {
    case "square": {
      const h = shape.size / 2;
      return [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]];
    }
    case "rectangle": {
      const hw = shape.width / 2, hh = shape.height / 2;
      return [[x - hw, y - hh], [x + hw, y - hh], [x + hw, y + hh], [x - hw, y + hh]];
    }
    case "circle": {
      const r = shape.size / 2;
      const pts: [number, number][] = [];
      for (let k = 0; k < 16; k++) {
        const angle = (k * Math.PI * 2) / 16;
        pts.push([x + r * Math.cos(angle), y + r * Math.sin(angle)]);
      }
      return pts;
    }
    case "triangle": {
      const h = shape.size * Math.sqrt(3) / 2;
      return [
        [x, y - (2 * h) / 3],
        [x - shape.size / 2, y + h / 3],
        [x + shape.size / 2, y + h / 3],
      ];
    }
    case "trapezoid": {
      const htw = shape.topWidth / 2, hbw = shape.bottomWidth / 2, hh = shape.height / 2;
      return [
        [x - htw, y - hh],
        [x + htw, y - hh],
        [x + hbw, y + hh],
        [x - hbw, y + hh],
      ];
    }
    case "octagon": {
      const pts: [number, number][] = [];
      for (let k = 0; k < 8; k++) {
        const angle = k * Math.PI / 4 - Math.PI / 2;
        pts.push([x + shape.size * Math.cos(angle), y + shape.size * Math.sin(angle)]);
      }
      return pts;
    }
    case "polygon": {
      const pts: [number, number][] = [];
      for (let k = 0; k < shape.sides; k++) {
        const angle = (k * Math.PI * 2) / shape.sides - Math.PI / 2;
        pts.push([x + shape.size * Math.cos(angle), y + shape.size * Math.sin(angle)]);
      }
      return pts;
    }
    case "oval": {
      const rx = shape.width / 2, ry = shape.height / 2;
      const pts: [number, number][] = [];
      for (let k = 0; k < 16; k++) {
        const angle = (k * Math.PI * 2) / 16;
        pts.push([x + rx * Math.cos(angle), y + ry * Math.sin(angle)]);
      }
      return pts;
    }
    case "blob": {
      const n = shape.points ?? 6;
      const prng = createPrng(blobSeed(generatorSeed, shapeIndex));
      const pts: [number, number][] = [];
      for (let k = 0; k < n; k++) {
        const angle = (k * Math.PI * 2) / n;
        const radius = shape.size * (0.6 + 0.4 * prng());
        pts.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)]);
      }
      return pts;
    }
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// applyDistort — perturb each vertex by ±(charSize * distort)
// Consumes 2 prng() draws per vertex (dx, dy).
// ---------------------------------------------------------------------------
export function applyDistort(
  vertices: [number, number][],
  charSize: number,
  distort: number,
  prng: () => number
): [number, number][] {
  const mag = charSize * distort;
  return vertices.map(([vx, vy]) => [
    vx + (prng() * 2 - 1) * mag,
    vy + (prng() * 2 - 1) * mag,
  ]);
}

// ---------------------------------------------------------------------------
// applyClamp — constrain vertices to bounding box [cx±w/2, cy±h/2]
// ---------------------------------------------------------------------------
export function applyClamp(
  vertices: [number, number][],
  cx: number,
  cy: number,
  clampWidth: number,
  clampHeight: number
): [number, number][] {
  const xMin = cx - clampWidth / 2, xMax = cx + clampWidth / 2;
  const yMin = cy - clampHeight / 2, yMax = cy + clampHeight / 2;
  return vertices.map(([vx, vy]) => [
    Math.max(xMin, Math.min(xMax, vx)),
    Math.max(yMin, Math.min(yMax, vy)),
  ]);
}

// ---------------------------------------------------------------------------
// verticesToPath — straight-line path: M x0 y0 L x1 y1 ... Z
// ---------------------------------------------------------------------------
export function verticesToPath(vertices: [number, number][]): string {
  const [first, ...rest] = vertices;
  const lines = rest.map(([vx, vy]) => `L ${fmt(vx)} ${fmt(vy)}`);
  return `M ${fmt(first[0])} ${fmt(first[1])} ${lines.join(" ")} Z`;
}

// ---------------------------------------------------------------------------
// blobVariedPath — Catmull-Rom → cubic Bézier through perturbed control points
// ---------------------------------------------------------------------------
function blobVariedPath(pts: [number, number][]): string {
  const n = pts.length;
  const p = (i: number): [number, number] => pts[((i % n) + n) % n];
  const segments: string[] = [];
  for (let i = 0; i < n; i++) {
    const [p0x, p0y] = p(i);
    const [p1x, p1y] = p(i + 1);
    const [pm1x, pm1y] = p(i - 1);
    const [p2x, p2y] = p(i + 2);
    const cp1x = p0x + (p1x - pm1x) / 6;
    const cp1y = p0y + (p1y - pm1y) / 6;
    const cp2x = p1x - (p2x - p0x) / 6;
    const cp2y = p1y - (p2y - p0y) / 6;
    segments.push(
      `C ${fmt(cp1x)} ${fmt(cp1y)} ${fmt(cp2x)} ${fmt(cp2y)} ${fmt(p1x)} ${fmt(p1y)}`
    );
  }
  const [startX, startY] = pts[0];
  return `M ${fmt(startX)} ${fmt(startY)} ${segments.join(" ")} Z`;
}

// ---------------------------------------------------------------------------
// applySizeVariance — scale all size dimensions; consumes exactly one prng() draw.
// Returns a new shape object with scaled dimensions; all other fields unchanged.
// ---------------------------------------------------------------------------
export function applySizeVariance(shape: Shape, prng: () => number): Shape {
  const sv = shape.sizeVariance ?? 0;
  if (sv === 0) return shape;
  const f = 1 + (prng() * 2 - 1) * sv;
  const scale = (dim: number) => Math.max(1, dim * f);
  switch (shape.type) {
    case "square":    return { ...shape, size: scale(shape.size) };
    case "circle":    return { ...shape, size: scale(shape.size) };
    case "triangle":  return { ...shape, size: scale(shape.size) };
    case "octagon":   return { ...shape, size: scale(shape.size) };
    case "polygon":   return { ...shape, size: scale(shape.size) };
    case "blob":      return { ...shape, size: scale(shape.size) };
    case "rectangle": return { ...shape, width: scale(shape.width), height: scale(shape.height) };
    case "oval":      return { ...shape, width: scale(shape.width), height: scale(shape.height) };
    case "trapezoid": return {
      ...shape,
      topWidth:    scale(shape.topWidth),
      bottomWidth: scale(shape.bottomWidth),
      height:      scale(shape.height),
    };
    default: return shape;
  }
}

// ---------------------------------------------------------------------------
// renderVaried — full distortion pipeline (sizeVariance assumed already applied).
// extractVertices → applyDistort → applyClamp (if shape.clamp) → path
// Always returns tag: "path".
// ---------------------------------------------------------------------------
export function renderVaried(
  shape: Shape,
  varPrng: () => number,
  generatorSeed: number,
  shapeIndex: number
): { tag: "path"; attrs: Record<string, string | number> } {
  const dt = shape.distort ?? 0;
  const cs = charSizeOf(shape);

  let vertices = extractVertices(shape, generatorSeed, shapeIndex);
  vertices = applyDistort(vertices, cs, dt, varPrng);

  if (shape.clamp) {
    vertices = applyClamp(vertices, shape.x, shape.y, shape.clamp.width, shape.clamp.height);
  }

  const d = shape.type === "blob" ? blobVariedPath(vertices) : verticesToPath(vertices);
  return { tag: "path", attrs: { d } };
}
