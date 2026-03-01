import { describe, it, expect } from "vitest";
import { renderPolygon } from "../../src/shapes/polygon.js";

describe("renderPolygon - semantic mode", () => {
  it("returns tag polygon", () => {
    const result = renderPolygon({ type: "polygon", x: 100, y: 100, sides: 5, size: 50 }, "semantic");
    expect(result.tag).toBe("polygon");
  });

  it("triangle (sides=3) produces 3 vertex pairs", () => {
    const result = renderPolygon({ type: "polygon", x: 0, y: 0, sides: 3, size: 40 }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    expect(pts).toHaveLength(3);
  });

  it("pentagon (sides=5) produces 5 vertex pairs", () => {
    const result = renderPolygon({ type: "polygon", x: 0, y: 0, sides: 5, size: 40 }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    expect(pts).toHaveLength(5);
  });

  it("hexagon (sides=6) produces 6 vertex pairs", () => {
    const result = renderPolygon({ type: "polygon", x: 0, y: 0, sides: 6, size: 40 }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    expect(pts).toHaveLength(6);
  });

  it("first vertex is above center (vy < cy)", () => {
    for (const sides of [3, 5, 6, 7, 12]) {
      const result = renderPolygon({ type: "polygon", x: 100, y: 100, sides, size: 50 }, "semantic");
      const pts = (result.attrs.points as string).trim().split(" ");
      const firstY = parseFloat(pts[0].split(",")[1]);
      expect(firstY).toBeLessThan(100);
    }
  });

  it("all vertices are at circumradius from center", () => {
    const cx = 50, cy = 50, size = 30, sides = 7;
    const result = renderPolygon({ type: "polygon", x: cx, y: cy, sides, size }, "semantic");
    const pts = (result.attrs.points as string).trim().split(" ");
    for (const pt of pts) {
      const [vx, vy] = pt.split(",").map(Number);
      const dist = Math.sqrt((vx - cx) ** 2 + (vy - cy) ** 2);
      expect(dist).toBeCloseTo(size, 3);
    }
  });
});

describe("renderPolygon - path mode", () => {
  it("returns tag path", () => {
    const result = renderPolygon({ type: "polygon", x: 100, y: 100, sides: 5, size: 50 }, "path");
    expect(result.tag).toBe("path");
  });

  it("pentagon path has 4 L commands (5 vertices)", () => {
    const result = renderPolygon({ type: "polygon", x: 0, y: 0, sides: 5, size: 40 }, "path");
    const lMatches = (result.attrs.d as string).match(/ L /g);
    expect(lMatches).toHaveLength(4);
  });

  it("hexagon path has 5 L commands (6 vertices)", () => {
    const result = renderPolygon({ type: "polygon", x: 0, y: 0, sides: 6, size: 40 }, "path");
    const lMatches = (result.attrs.d as string).match(/ L /g);
    expect(lMatches).toHaveLength(5);
  });

  it("d starts with M and ends with Z", () => {
    const result = renderPolygon({ type: "polygon", x: 0, y: 0, sides: 4, size: 40 }, "path");
    expect((result.attrs.d as string)).toMatch(/^M /);
    expect((result.attrs.d as string)).toMatch(/ Z$/);
  });

  it("path and polygon share the same vertices", () => {
    const shape = { type: "polygon" as const, x: 0, y: 0, sides: 5, size: 30 };
    const semantic = renderPolygon(shape, "semantic");
    const path = renderPolygon(shape, "path");

    const pts = (semantic.attrs.points as string).trim().split(" ").map((p) => p.split(","));
    const d = path.attrs.d as string;
    expect(d).toContain(`M ${pts[0][0]} ${pts[0][1]}`);
    expect(d).toContain(`L ${pts[1][0]} ${pts[1][1]}`);
    expect(d).toContain(`L ${pts[4][0]} ${pts[4][1]}`);
  });
});
