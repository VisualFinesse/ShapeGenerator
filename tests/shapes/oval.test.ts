import { describe, it, expect } from "vitest";
import { renderOval } from "../../src/shapes/oval.js";

describe("renderOval - semantic mode", () => {
  it("returns tag ellipse", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "semantic");
    expect(result.tag).toBe("ellipse");
  });

  it("attrs contain cx, cy, rx, ry", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "semantic");
    expect(result.attrs).toHaveProperty("cx");
    expect(result.attrs).toHaveProperty("cy");
    expect(result.attrs).toHaveProperty("rx");
    expect(result.attrs).toHaveProperty("ry");
  });

  it("rx equals width/2", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "semantic");
    expect(parseFloat(result.attrs.rx as string)).toBeCloseTo(40, 4);
  });

  it("ry equals height/2", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "semantic");
    expect(parseFloat(result.attrs.ry as string)).toBeCloseTo(20, 4);
  });

  it("cx equals x and cy equals y", () => {
    const result = renderOval({ type: "oval", x: 150, y: 75, width: 80, height: 40 }, "semantic");
    expect(parseFloat(result.attrs.cx as string)).toBeCloseTo(150, 4);
    expect(parseFloat(result.attrs.cy as string)).toBeCloseTo(75, 4);
  });

  it("square oval (width===height) still renders as ellipse not circle", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 60, height: 60 }, "semantic");
    expect(result.tag).toBe("ellipse");
    expect(parseFloat(result.attrs.rx as string)).toBeCloseTo(30, 4);
    expect(parseFloat(result.attrs.ry as string)).toBeCloseTo(30, 4);
  });
});

describe("renderOval - path mode", () => {
  it("returns tag path", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "path");
    expect(result.tag).toBe("path");
  });

  it("d starts with M", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "path");
    expect((result.attrs.d as string)).toMatch(/^M /);
  });

  it("d contains exactly 2 A commands (two-arc split)", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "path");
    const aMatches = (result.attrs.d as string).match(/ A /g);
    expect(aMatches).toHaveLength(2);
  });

  it("d ends with Z", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "path");
    expect((result.attrs.d as string)).toMatch(/ Z$/);
  });

  it("two-arc path uses correct rx and ry values", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "path");
    const d = result.attrs.d as string;
    // Both arcs should use rx=40, ry=20
    expect(d).toContain("A 40 20");
  });

  it("two-arc path split points are at left (x-rx) and right (x+rx)", () => {
    const result = renderOval({ type: "oval", x: 100, y: 100, width: 80, height: 40 }, "path");
    const d = result.attrs.d as string;
    // Starts at right extreme x+rx = 140
    expect(d).toContain("M 140 100");
    // First arc goes to left extreme x-rx = 60
    expect(d).toContain("0 60 100");
    // Second arc returns to right extreme
    expect(d).toContain("0 140 100");
  });
});
