import { describe, it, expect } from "vitest";
import { renderOctagon } from "../../src/shapes/octagon.js";

describe("renderOctagon - semantic mode", () => {
  it("returns tag polygon", () => {
    const result = renderOctagon({ type: "octagon", x: 100, y: 100, size: 50 }, "semantic");
    expect(result.tag).toBe("polygon");
  });

  it("has exactly 8 coordinate pairs in points", () => {
    const result = renderOctagon({ type: "octagon", x: 100, y: 100, size: 50 }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    expect(pts).toHaveLength(8);
  });

  it("first vertex is at the top (vy < center y)", () => {
    const result = renderOctagon({ type: "octagon", x: 100, y: 100, size: 50 }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    const firstY = parseFloat(pts[0].split(",")[1]);
    expect(firstY).toBeLessThan(100);
  });

  it("first vertex is directly above center (vx ≈ cx)", () => {
    const result = renderOctagon({ type: "octagon", x: 100, y: 100, size: 50 }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    const firstX = parseFloat(pts[0].split(",")[0]);
    expect(firstX).toBeCloseTo(100, 4);
  });

  it("all vertices are at circumradius distance from center", () => {
    const cx = 100, cy = 100, size = 50;
    const result = renderOctagon({ type: "octagon", x: cx, y: cy, size }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    for (const pt of pts) {
      const [vx, vy] = pt.split(",").map(Number);
      const dist = Math.sqrt((vx - cx) ** 2 + (vy - cy) ** 2);
      expect(dist).toBeCloseTo(size, 3);
    }
  });
});

describe("renderOctagon - path mode", () => {
  it("returns tag path", () => {
    const result = renderOctagon({ type: "octagon", x: 100, y: 100, size: 50 }, "path");
    expect(result.tag).toBe("path");
  });

  it("d starts with M and ends with Z", () => {
    const result = renderOctagon({ type: "octagon", x: 100, y: 100, size: 50 }, "path");
    expect((result.attrs.d as string)).toMatch(/^M /);
    expect((result.attrs.d as string)).toMatch(/ Z$/);
  });

  it("d contains exactly 7 L commands (8 vertices)", () => {
    const result = renderOctagon({ type: "octagon", x: 100, y: 100, size: 50 }, "path");
    const lMatches = (result.attrs.d as string).match(/ L /g);
    expect(lMatches).toHaveLength(7);
  });

  it("path and polygon share the same vertices", () => {
    const shape = { type: "octagon" as const, x: 0, y: 0, size: 40 };
    const semantic = renderOctagon(shape, "semantic");
    const path = renderOctagon(shape, "path");

    const pts = (semantic.attrs.points as string).trim().split(" ").map((p) => p.split(","));
    const d = path.attrs.d as string;
    expect(d).toContain(`M ${pts[0][0]} ${pts[0][1]}`);
    expect(d).toContain(`L ${pts[1][0]} ${pts[1][1]}`);
    expect(d).toContain(`L ${pts[7][0]} ${pts[7][1]}`);
  });
});
