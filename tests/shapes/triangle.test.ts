import { describe, it, expect } from "vitest";
import { renderTriangle } from "../../src/shapes/triangle.js";

describe("renderTriangle - semantic mode", () => {
  it("returns tag polygon", () => {
    const result = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.tag).toBe("polygon");
  });

  it("has points attribute", () => {
    const result = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs).toHaveProperty("points");
  });

  it("points has 3 coordinate pairs", () => {
    const result = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "semantic");
    const points = (result.attrs.points as string).trim().split(" ");
    expect(points).toHaveLength(3);
  });

  it("computes correct centroid math for x=50 y=50 size=100", () => {
    const result = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "semantic");
    const h = 100 * Math.sqrt(3) / 2;
    const topY = 50 - (2 * h) / 3;
    const blY = 50 + h / 3;

    const points = result.attrs.points as string;
    // top point should be at x=50
    expect(points).toContain("50,");
    // base-left x should be 50 - 50 = 0
    expect(points).toContain("0,");
    // base-right x should be 50 + 50 = 100
    expect(points).toContain("100,");

    // check top y value is formatted correctly
    const topYFmt = parseFloat(topY.toFixed(6)).toString();
    expect(points).toContain(`50,${topYFmt}`);
  });
});

describe("renderTriangle - path mode", () => {
  it("returns tag path", () => {
    const result = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "path");
    expect(result.tag).toBe("path");
  });

  it("d attribute starts with M and has L and Z", () => {
    const result = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    expect(d).toMatch(/^M /);
    expect(d).toContain(" L ");
    expect(d).toContain(" Z");
  });

  it("d has exactly 2 L commands for triangle (3 vertices)", () => {
    const result = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    const lMatches = d.match(/ L /g);
    expect(lMatches).toHaveLength(2);
  });

  it("path and polygon share the same vertices", () => {
    const semantic = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "semantic");
    const path = renderTriangle({ type: "triangle", x: 50, y: 50, size: 100 }, "path");

    // Extract vertices from polygon points "x1,y1 x2,y2 x3,y3"
    const points = (semantic.attrs.points as string).trim().split(" ");
    const [p1, p2, p3] = points.map((p) => p.split(","));

    // Extract vertices from path "M x1 y1 L x2 y2 L x3 y3 Z"
    const d = path.attrs.d as string;
    // path uses "M x y L x y L x y Z" format (space-separated coords)
    expect(d).toContain(`M ${p1[0]} ${p1[1]}`);
    expect(d).toContain(`L ${p2[0]} ${p2[1]}`);
    expect(d).toContain(`L ${p3[0]} ${p3[1]}`);
  });
});
