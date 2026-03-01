import { describe, it, expect } from "vitest";
import { renderSquare } from "../../src/shapes/square.js";

describe("renderSquare - semantic mode", () => {
  it("returns tag rect", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.tag).toBe("rect");
  });

  it("computes x as cx - size/2", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs.x).toBe("0");
  });

  it("computes y as cy - size/2", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs.y).toBe("0");
  });

  it("computes width = size", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs.width).toBe("100");
  });

  it("computes height = size", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs.height).toBe("100");
  });

  it("strips trailing zeros from numeric values", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "semantic");
    // 50.000000 should be "50" not "50.000000"
    expect(result.attrs.x).not.toContain(".");
    expect(result.attrs.width).not.toContain(".");
  });

  it("preserves precision for non-integer values", () => {
    const result = renderSquare({ type: "square", x: 33.333333, y: 0, size: 10 }, "semantic");
    // x - size/2 = 33.333333 - 5 = 28.333333
    expect(result.attrs.x).toBe("28.333333");
  });
});

describe("renderSquare - path mode", () => {
  it("returns tag path", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "path");
    expect(result.tag).toBe("path");
  });

  it("d attribute starts with M and contains L and Z", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    expect(d).toMatch(/^M /);
    expect(d).toContain(" L ");
    expect(d).toContain(" Z");
  });

  it("path vertices are TL TR BR BL for x=50 y=50 size=100", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    // TL(0,0), TR(100,0), BR(100,100), BL(0,100)
    expect(d).toBe("M 0 0 L 100 0 L 100 100 L 0 100 Z");
  });

  it("no rect attributes in path mode", () => {
    const result = renderSquare({ type: "square", x: 50, y: 50, size: 100 }, "path");
    expect(result.attrs).not.toHaveProperty("width");
    expect(result.attrs).not.toHaveProperty("height");
  });
});
