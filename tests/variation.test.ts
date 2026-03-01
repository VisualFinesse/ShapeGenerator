import { describe, it, expect } from "vitest";
import {
  charSizeOf,
  extractVertices,
  applyDistort,
  applyClamp,
  verticesToPath,
  applySizeVariance,
  renderVaried,
} from "../src/variation.js";
import { createPrng } from "../src/prng.js";

// ---------------------------------------------------------------------------
// charSizeOf
// ---------------------------------------------------------------------------
describe("charSizeOf", () => {
  it("square: size/2", () => {
    expect(charSizeOf({ type: "square", x: 0, y: 0, size: 80 })).toBe(40);
  });
  it("circle: size/2", () => {
    expect(charSizeOf({ type: "circle", x: 0, y: 0, size: 60 })).toBe(30);
  });
  it("triangle: size/2", () => {
    expect(charSizeOf({ type: "triangle", x: 0, y: 0, size: 50 })).toBe(25);
  });
  it("octagon: size/2", () => {
    expect(charSizeOf({ type: "octagon", x: 0, y: 0, size: 40 })).toBe(20);
  });
  it("polygon: size/2", () => {
    expect(charSizeOf({ type: "polygon", x: 0, y: 0, sides: 5, size: 30 })).toBe(15);
  });
  it("blob: size/2", () => {
    expect(charSizeOf({ type: "blob", x: 0, y: 0, size: 100 })).toBe(50);
  });
  it("rectangle: min(w,h)/2", () => {
    expect(charSizeOf({ type: "rectangle", x: 0, y: 0, width: 120, height: 60 })).toBe(30);
  });
  it("oval: min(w,h)/2", () => {
    expect(charSizeOf({ type: "oval", x: 0, y: 0, width: 80, height: 40 })).toBe(20);
  });
  it("trapezoid: min(topWidth,bottomWidth,height)/2", () => {
    expect(charSizeOf({ type: "trapezoid", x: 0, y: 0, topWidth: 40, bottomWidth: 80, height: 60 })).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// extractVertices — vertex counts
// ---------------------------------------------------------------------------
describe("extractVertices — vertex counts", () => {
  it("square returns 4 vertices", () => {
    expect(extractVertices({ type: "square", x: 0, y: 0, size: 50 }, 1, 0)).toHaveLength(4);
  });
  it("rectangle returns 4 vertices", () => {
    expect(extractVertices({ type: "rectangle", x: 0, y: 0, width: 80, height: 40 }, 1, 0)).toHaveLength(4);
  });
  it("circle returns 16 vertices", () => {
    expect(extractVertices({ type: "circle", x: 0, y: 0, size: 50 }, 1, 0)).toHaveLength(16);
  });
  it("triangle returns 3 vertices", () => {
    expect(extractVertices({ type: "triangle", x: 0, y: 0, size: 50 }, 1, 0)).toHaveLength(3);
  });
  it("trapezoid returns 4 vertices", () => {
    expect(extractVertices({ type: "trapezoid", x: 0, y: 0, topWidth: 40, bottomWidth: 80, height: 60 }, 1, 0)).toHaveLength(4);
  });
  it("octagon returns 8 vertices", () => {
    expect(extractVertices({ type: "octagon", x: 0, y: 0, size: 50 }, 1, 0)).toHaveLength(8);
  });
  it("polygon(sides=5) returns 5 vertices", () => {
    expect(extractVertices({ type: "polygon", x: 0, y: 0, sides: 5, size: 50 }, 1, 0)).toHaveLength(5);
  });
  it("polygon(sides=12) returns 12 vertices", () => {
    expect(extractVertices({ type: "polygon", x: 0, y: 0, sides: 12, size: 50 }, 1, 0)).toHaveLength(12);
  });
  it("oval returns 16 vertices", () => {
    expect(extractVertices({ type: "oval", x: 0, y: 0, width: 80, height: 40 }, 1, 0)).toHaveLength(16);
  });
  it("blob default (points=6) returns 6 vertices", () => {
    expect(extractVertices({ type: "blob", x: 0, y: 0, size: 60 }, 1, 0)).toHaveLength(6);
  });
  it("blob with points=10 returns 10 vertices", () => {
    expect(extractVertices({ type: "blob", x: 0, y: 0, size: 60, points: 10 }, 1, 0)).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// extractVertices — coordinate correctness
// ---------------------------------------------------------------------------
describe("extractVertices — coordinates", () => {
  it("square TL is at (x-h, y-h)", () => {
    const verts = extractVertices({ type: "square", x: 100, y: 100, size: 60 }, 1, 0);
    expect(verts[0][0]).toBeCloseTo(70, 4);
    expect(verts[0][1]).toBeCloseTo(70, 4);
  });
  it("circle all vertices at circumradius from center", () => {
    const r = 30;
    const verts = extractVertices({ type: "circle", x: 50, y: 50, size: r * 2 }, 1, 0);
    for (const [vx, vy] of verts) {
      const dist = Math.sqrt((vx - 50) ** 2 + (vy - 50) ** 2);
      expect(dist).toBeCloseTo(r, 4);
    }
  });
  it("octagon first vertex directly above center", () => {
    const verts = extractVertices({ type: "octagon", x: 100, y: 100, size: 50 }, 1, 0);
    expect(verts[0][0]).toBeCloseTo(100, 4);
    expect(verts[0][1]).toBeCloseTo(50, 4);
  });
  it("blob vertices re-derive deterministically from blobSeed", () => {
    const shape = { type: "blob" as const, x: 0, y: 0, size: 60 };
    const a = extractVertices(shape, 42, 0);
    const b = extractVertices(shape, 42, 0);
    expect(a).toEqual(b);
  });
  it("blob vertices change with different generatorSeed", () => {
    const shape = { type: "blob" as const, x: 0, y: 0, size: 60 };
    const a = extractVertices(shape, 42, 0);
    const b = extractVertices(shape, 99, 0);
    expect(a).not.toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// applyDistort
// ---------------------------------------------------------------------------
describe("applyDistort", () => {
  it("each vertex offset is within [-charSize*distort, +charSize*distort]", () => {
    const vertices: [number, number][] = [[100, 100], [200, 100], [200, 200], [100, 200]];
    const charSize = 50, distort = 0.2;
    const prng = createPrng(42);
    const distorted = applyDistort(vertices, charSize, distort, prng);
    const mag = charSize * distort;
    for (let i = 0; i < vertices.length; i++) {
      expect(Math.abs(distorted[i][0] - vertices[i][0])).toBeLessThanOrEqual(mag + 1e-9);
      expect(Math.abs(distorted[i][1] - vertices[i][1])).toBeLessThanOrEqual(mag + 1e-9);
    }
  });

  it("with distort=1 offsets can be up to ±charSize", () => {
    const vertices: [number, number][] = [[0, 0]];
    const charSize = 50;
    const prng = createPrng(1);
    const distorted = applyDistort(vertices, charSize, 1, prng);
    expect(Math.abs(distorted[0][0])).toBeLessThanOrEqual(50 + 1e-9);
    expect(Math.abs(distorted[0][1])).toBeLessThanOrEqual(50 + 1e-9);
  });

  it("returns same vertex count as input", () => {
    const vertices: [number, number][] = [[1, 2], [3, 4], [5, 6]];
    const prng = createPrng(7);
    expect(applyDistort(vertices, 10, 0.5, prng)).toHaveLength(3);
  });

  it("produces different results with different PRNG state", () => {
    const vertices: [number, number][] = [[100, 100]];
    const prng1 = createPrng(1);
    const prng2 = createPrng(999);
    const a = applyDistort(vertices, 50, 0.5, prng1);
    const b = applyDistort(vertices, 50, 0.5, prng2);
    // Very unlikely to be equal with different seeds
    expect(a[0][0] === b[0][0] && a[0][1] === b[0][1]).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyClamp
// ---------------------------------------------------------------------------
describe("applyClamp", () => {
  it("vertex inside box is unchanged", () => {
    const verts: [number, number][] = [[100, 100]];
    const result = applyClamp(verts, 100, 100, 200, 200);
    expect(result[0][0]).toBeCloseTo(100, 8);
    expect(result[0][1]).toBeCloseTo(100, 8);
  });

  it("vertex to the right of box is clamped to xMax", () => {
    const verts: [number, number][] = [[250, 100]];
    const result = applyClamp(verts, 100, 100, 100, 200); // xMax = 150
    expect(result[0][0]).toBeCloseTo(150, 8);
  });

  it("vertex above box is clamped to yMin", () => {
    const verts: [number, number][] = [[100, 10]];
    const result = applyClamp(verts, 100, 100, 200, 100); // yMin = 50
    expect(result[0][1]).toBeCloseTo(50, 8);
  });

  it("returns same vertex count as input", () => {
    const verts: [number, number][] = [[1, 2], [3, 4], [5, 6], [7, 8]];
    expect(applyClamp(verts, 0, 0, 10, 10)).toHaveLength(4);
  });

  it("all four boundary directions are clamped correctly", () => {
    const cx = 0, cy = 0, w = 100, h = 100;
    const verts: [number, number][] = [
      [200, 0],   // right overflow → clamped to 50
      [-200, 0],  // left overflow → clamped to -50
      [0, 200],   // bottom overflow → clamped to 50
      [0, -200],  // top overflow → clamped to -50
    ];
    const result = applyClamp(verts, cx, cy, w, h);
    expect(result[0][0]).toBeCloseTo(50, 8);
    expect(result[1][0]).toBeCloseTo(-50, 8);
    expect(result[2][1]).toBeCloseTo(50, 8);
    expect(result[3][1]).toBeCloseTo(-50, 8);
  });

  it("empty vertex list returns empty list", () => {
    expect(applyClamp([], 0, 0, 100, 100)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// verticesToPath
// ---------------------------------------------------------------------------
describe("verticesToPath", () => {
  it("starts with M", () => {
    const result = verticesToPath([[10, 20], [30, 40], [50, 60]]);
    expect(result).toMatch(/^M /);
  });

  it("ends with Z", () => {
    const result = verticesToPath([[10, 20], [30, 40], [50, 60]]);
    expect(result).toMatch(/ Z$/);
  });

  it("contains L commands for each vertex after the first", () => {
    const result = verticesToPath([[10, 20], [30, 40], [50, 60], [70, 80]]);
    const lCount = (result.match(/ L /g) ?? []).length;
    expect(lCount).toBe(3);
  });

  it("includes first vertex coordinates in M", () => {
    const result = verticesToPath([[100, 200], [300, 400]]);
    expect(result).toContain("M 100 200");
  });
});

// ---------------------------------------------------------------------------
// applySizeVariance
// ---------------------------------------------------------------------------
describe("applySizeVariance", () => {
  it("sizeVariance=0 returns shape unchanged", () => {
    const shape = { type: "square" as const, x: 0, y: 0, size: 50, sizeVariance: 0 };
    const prng = createPrng(1);
    const result = applySizeVariance(shape, prng);
    expect((result as typeof shape).size).toBe(50);
  });

  it("sizeVariance=0.3 scales square size within [0.7,1.3] range", () => {
    const shape = { type: "square" as const, x: 0, y: 0, size: 100, sizeVariance: 0.3 };
    const prng = createPrng(42);
    const result = applySizeVariance(shape, prng) as typeof shape;
    expect(result.size).toBeGreaterThanOrEqual(70);
    expect(result.size).toBeLessThanOrEqual(130);
  });

  it("minimum size is clamped to 1", () => {
    // sizeVariance=1 could produce f near 0 for some seeds
    // We use a shape with tiny size to trigger the clamp
    const shape = { type: "circle" as const, x: 0, y: 0, size: 0.5, sizeVariance: 1 };
    const prng = createPrng(5);
    const result = applySizeVariance(shape, prng) as typeof shape;
    expect(result.size).toBeGreaterThanOrEqual(1);
  });

  it("rectangle scales both width and height", () => {
    const shape = { type: "rectangle" as const, x: 0, y: 0, width: 100, height: 60, sizeVariance: 0.2 };
    const prng = createPrng(10);
    const result = applySizeVariance(shape, prng) as typeof shape;
    expect(result.width).not.toBe(100);
    expect(result.height).not.toBe(60);
    // Both should be scaled by the same factor
    expect(result.width / result.height).toBeCloseTo(100 / 60, 3);
  });

  it("trapezoid scales topWidth, bottomWidth, and height", () => {
    const shape = { type: "trapezoid" as const, x: 0, y: 0, topWidth: 40, bottomWidth: 80, height: 60, sizeVariance: 0.2 };
    const prng = createPrng(7);
    const result = applySizeVariance(shape, prng) as typeof shape;
    expect(result.topWidth).not.toBe(40);
    expect(result.bottomWidth).not.toBe(80);
    expect(result.height).not.toBe(60);
  });

  it("consumes exactly one prng draw", () => {
    const shape = { type: "square" as const, x: 0, y: 0, size: 50, sizeVariance: 0.2 };
    const prng = createPrng(99);
    const v1 = prng(); // first draw
    const prng2 = createPrng(99);
    applySizeVariance(shape, prng2); // consumes one draw
    const v2 = prng2(); // should equal what prng would give after one draw
    expect(v2).toBe(prng()); // prng is now on its second draw
  });

  it("is deterministic — same prng seed = same result", () => {
    const shape = { type: "polygon" as const, x: 0, y: 0, sides: 6, size: 80, sizeVariance: 0.25 };
    const a = applySizeVariance(shape, createPrng(55)) as typeof shape;
    const b = applySizeVariance(shape, createPrng(55)) as typeof shape;
    expect(a.size).toBe(b.size);
  });
});

// ---------------------------------------------------------------------------
// renderVaried
// ---------------------------------------------------------------------------
describe("renderVaried", () => {
  it("always returns tag: path", () => {
    const shape = { type: "square" as const, x: 100, y: 100, size: 60, distort: 0.1 };
    const prng = createPrng(1);
    expect(renderVaried(shape, prng, 42, 0).tag).toBe("path");
  });

  it("d starts with M and ends with Z", () => {
    const shape = { type: "circle" as const, x: 0, y: 0, size: 50, distort: 0.1 };
    const prng = createPrng(1);
    const d = renderVaried(shape, prng, 1, 0).attrs.d as string;
    expect(d).toMatch(/^M /);
    expect(d).toMatch(/ Z$/);
  });

  it("is deterministic — same inputs produce same d", () => {
    const shape = { type: "octagon" as const, x: 100, y: 100, size: 50, distort: 0.2 };
    const a = renderVaried(shape, createPrng(42), 7, 0).attrs.d;
    const b = renderVaried(shape, createPrng(42), 7, 0).attrs.d;
    expect(a).toBe(b);
  });

  it("distort=1 produces path different from undistorted", () => {
    // At distort=1 the perturbation is significant — coordinates will differ
    const shape = { type: "square" as const, x: 100, y: 100, size: 80, distort: 1 };
    const prng = createPrng(55);
    const d = renderVaried(shape, prng, 1, 0).attrs.d as string;
    // The path should NOT be the same as a plain square (undistorted corners at 60,60 etc.)
    expect(d).not.toContain("M 60 60");
  });

  it("blob with distort produces path with C commands (smooth spline)", () => {
    const shape = { type: "blob" as const, x: 100, y: 100, size: 60, distort: 0.15 };
    const prng = createPrng(7);
    const d = renderVaried(shape, prng, 42, 0).attrs.d as string;
    expect(d).toContain(" C ");
  });

  it("non-blob with distort produces path with L commands (straight lines)", () => {
    const shape = { type: "polygon" as const, x: 0, y: 0, sides: 5, size: 50, distort: 0.1 };
    const prng = createPrng(3);
    const d = renderVaried(shape, prng, 1, 0).attrs.d as string;
    expect(d).toContain(" L ");
    expect(d).not.toContain(" C ");
  });

  it("clamp constrains vertices within bounding box", () => {
    const shape = {
      type: "square" as const,
      x: 100, y: 100, size: 60,
      distort: 1.0,
      clamp: { width: 60, height: 60 },
    };
    const prng = createPrng(77);
    const d = renderVaried(shape, prng, 1, 0).attrs.d as string;
    // Extract numeric coordinate pairs from path
    const coords = [...d.matchAll(/[-\d.]+\s+[-\d.]+/g)].map(m => m[0].trim().split(/\s+/).map(Number));
    for (const [vx, vy] of coords) {
      if (!isNaN(vx)) {
        expect(vx).toBeGreaterThanOrEqual(70 - 1e-6);
        expect(vx).toBeLessThanOrEqual(130 + 1e-6);
        expect(vy).toBeGreaterThanOrEqual(70 - 1e-6);
        expect(vy).toBeLessThanOrEqual(130 + 1e-6);
      }
    }
  });
});
