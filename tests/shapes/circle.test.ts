import { describe, it, expect } from "vitest";
import { renderCircle } from "../../src/shapes/circle.js";

describe("renderCircle - semantic mode", () => {
  it("returns tag circle", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.tag).toBe("circle");
  });

  it("sets cx to x", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs.cx).toBe("50");
  });

  it("sets cy to y", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs.cy).toBe("50");
  });

  it("sets r to size/2", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "semantic");
    expect(result.attrs.r).toBe("50");
  });

  it("strips trailing zeros", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "semantic");
    expect(String(result.attrs.cx)).not.toMatch(/\.0+$/);
    expect(String(result.attrs.r)).not.toMatch(/\.0+$/);
  });

  it("handles non-integer size", () => {
    const result = renderCircle({ type: "circle", x: 0, y: 0, size: 33 }, "semantic");
    expect(result.attrs.r).toBe("16.5");
  });
});

describe("renderCircle - path mode", () => {
  it("returns tag path", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "path");
    expect(result.tag).toBe("path");
  });

  it("d attribute uses A (arc) commands not C (cubic bezier)", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    expect(d).toContain(" A ");
    expect(d).not.toContain(" C ");
  });

  it("d attribute contains two arc commands", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    const arcMatches = d.match(/ A /g);
    expect(arcMatches).toHaveLength(2);
  });

  it("d attribute starts at x+r and ends with Z", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    // x+r = 50+50 = 100, y = 50
    expect(d).toMatch(/^M 100 50/);
    expect(d).toMatch(/ Z$/);
  });

  it("d attribute is correct for x=50 y=50 r=50", () => {
    const result = renderCircle({ type: "circle", x: 50, y: 50, size: 100 }, "path");
    const d = result.attrs.d as string;
    expect(d).toBe("M 100 50 A 50 50 0 1 0 0 50 A 50 50 0 1 0 100 50 Z");
  });
});
