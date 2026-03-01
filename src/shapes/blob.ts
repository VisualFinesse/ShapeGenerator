import { fmt } from "../fmt.js";
import { createPrng, blobSeed } from "../prng.js";
import type { BlobShape } from "../types.js";

export function renderBlob(
  shape: BlobShape,
  _outputMode: "semantic" | "path",
  generatorSeed: number,
  shapeIndex: number
): { tag: "path"; attrs: Record<string, string | number> } {
  const { x, y, size } = shape;
  const n = shape.points ?? 6;
  const prng = createPrng(blobSeed(generatorSeed, shapeIndex));

  // Place n control points at evenly-spaced angles with seed-based radial variation
  const pts: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const angle = (k * Math.PI * 2) / n;
    const radius = size * (0.6 + 0.4 * prng());
    pts.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)]);
  }

  // Convert closed Catmull-Rom spline to cubic Bézier segments
  // For segment pts[i] → pts[i+1]:
  //   CP1 = pts[i]   + (pts[i+1] − pts[i−1]) / 6
  //   CP2 = pts[i+1] − (pts[i+2] − pts[i])   / 6
  // Indices are taken modulo n for the closed loop.
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
  const d = `M ${fmt(startX)} ${fmt(startY)} ${segments.join(" ")} Z`;

  return { tag: "path", attrs: { d } };
}
