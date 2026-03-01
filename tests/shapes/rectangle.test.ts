import { describe, it, expect } from "vitest";
import { renderRectangle } from "../../src/shapes/rectangle.js";

describe("renderRectangle - semantic mode", () => {
  it("returns tag rect", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "semantic");
    expect(result.tag).toBe("rect");
  });

  it("computes x as cx - width/2", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "semantic");
    expect(result.attrs.x).toBe("0");
  });

  it("computes y as cy - height/2", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "semantic");
    expect(result.attrs.y).toBe("20");
  });

  it("computes width correctly", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "semantic");
    expect(result.attrs.width).toBe("100");
  });

  it("computes height correctly", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "semantic");
    expect(result.attrs.height).toBe("60");
  });

  it("strips trailing zeros", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "semantic");
    expect(String(result.attrs.x)).not.toMatch(/\.0+$/);
  });

  it("preserves non-integer precision", () => {
    const result = renderRectangle({ type: "rectangle", x: 10.5, y: 10.5, width: 5.5, height: 3.3 }, "semantic");
    // x - w/2 = 10.5 - 2.75 = 7.75
    expect(result.attrs.x).toBe("7.75");
  });
});

describe("renderRectangle - path mode", () => {
  it("returns tag path", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "path");
    expect(result.tag).toBe("path");
  });

  it("d attribute has correct vertices TL TR BR BL", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "path");
    const d = result.attrs.d as string;
    // TL(0,20), TR(100,20), BR(100,80), BL(0,80)
    expect(d).toBe("M 0 20 L 100 20 L 100 80 L 0 80 Z");
  });

  it("d attribute starts with M and contains L and Z", () => {
    const result = renderRectangle({ type: "rectangle", x: 50, y: 50, width: 100, height: 60 }, "path");
    const d = result.attrs.d as string;
    expect(d).toMatch(/^M /);
    expect(d).toContain(" L ");
    expect(d).toContain(" Z");
  });
});
