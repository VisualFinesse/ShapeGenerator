import { describe, it, expect } from "vitest";
import { renderTrapezoid } from "../../src/shapes/trapezoid.js";

describe("renderTrapezoid - semantic mode", () => {
  it("returns tag polygon", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
      "semantic"
    );
    expect(result.tag).toBe("polygon");
  });

  it("has points attribute", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
      "semantic"
    );
    expect(result.attrs).toHaveProperty("points");
  });

  it("points has exactly 4 coordinate pairs", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
      "semantic"
    );
    const points = (result.attrs.points as string).trim().split(" ");
    expect(points).toHaveLength(4);
  });

  it("symmetric trapezoid (topWidth===bottomWidth) has same x-extents on top and bottom", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 80, bottomWidth: 80, height: 60 },
      "semantic"
    );
    const pts = (result.attrs.points as string).split(" ").map((p) => p.split(",").map(Number));
    // TL.x === BL.x and TR.x === BR.x for a symmetric trapezoid
    expect(pts[0][0]).toBeCloseTo(pts[3][0], 5); // TL.x ≈ BL.x
    expect(pts[1][0]).toBeCloseTo(pts[2][0], 5); // TR.x ≈ BR.x
  });

  it("vertex math is correct for asymmetric trapezoid", () => {
    const x = 100, y = 100, topWidth = 60, bottomWidth = 100, height = 60;
    const result = renderTrapezoid(
      { type: "trapezoid", x, y, topWidth, bottomWidth, height },
      "semantic"
    );
    const pts = (result.attrs.points as string).split(" ").map((p) => p.split(",").map(Number));
    // TL
    expect(pts[0][0]).toBeCloseTo(x - topWidth / 2, 4);
    expect(pts[0][1]).toBeCloseTo(y - height / 2, 4);
    // TR
    expect(pts[1][0]).toBeCloseTo(x + topWidth / 2, 4);
    expect(pts[1][1]).toBeCloseTo(y - height / 2, 4);
    // BR
    expect(pts[2][0]).toBeCloseTo(x + bottomWidth / 2, 4);
    expect(pts[2][1]).toBeCloseTo(y + height / 2, 4);
    // BL
    expect(pts[3][0]).toBeCloseTo(x - bottomWidth / 2, 4);
    expect(pts[3][1]).toBeCloseTo(y + height / 2, 4);
  });

  it("center is bounding-box midpoint between top and bottom edges", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 0, y: 0, topWidth: 40, bottomWidth: 80, height: 60 },
      "semantic"
    );
    const pts = (result.attrs.points as string).split(" ").map((p) => p.split(",").map(Number));
    // Top y should be -30, bottom y should be +30
    expect(pts[0][1]).toBeCloseTo(-30, 4);
    expect(pts[2][1]).toBeCloseTo(30, 4);
  });
});

describe("renderTrapezoid - path mode", () => {
  it("returns tag path", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
      "path"
    );
    expect(result.tag).toBe("path");
  });

  it("d starts with M", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
      "path"
    );
    expect((result.attrs.d as string)).toMatch(/^M /);
  });

  it("d contains exactly 3 L commands (4 vertices)", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
      "path"
    );
    const lMatches = (result.attrs.d as string).match(/ L /g);
    expect(lMatches).toHaveLength(3);
  });

  it("d ends with Z", () => {
    const result = renderTrapezoid(
      { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
      "path"
    );
    expect((result.attrs.d as string)).toMatch(/ Z$/);
  });

  it("path and polygon share the same vertex coordinates", () => {
    const shape = { type: "trapezoid" as const, x: 50, y: 80, topWidth: 40, bottomWidth: 70, height: 50 };
    const semantic = renderTrapezoid(shape, "semantic");
    const path = renderTrapezoid(shape, "path");

    const pts = (semantic.attrs.points as string).split(" ").map((p) => p.split(","));
    const d = path.attrs.d as string;
    expect(d).toContain(`M ${pts[0][0]} ${pts[0][1]}`);
    expect(d).toContain(`L ${pts[1][0]} ${pts[1][1]}`);
    expect(d).toContain(`L ${pts[2][0]} ${pts[2][1]}`);
    expect(d).toContain(`L ${pts[3][0]} ${pts[3][1]}`);
  });
});
