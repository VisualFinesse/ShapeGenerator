import { describe, it, expect } from "vitest";
import { renderBlob } from "../../src/shapes/blob.js";

const baseShape = { type: "blob" as const, x: 100, y: 100, size: 50 };

describe("renderBlob - determinism", () => {
  it("two calls with identical args produce identical d string", () => {
    const r1 = renderBlob(baseShape, "semantic", 42, 0);
    const r2 = renderBlob(baseShape, "semantic", 42, 0);
    expect(r1.attrs.d).toBe(r2.attrs.d);
  });

  it("different seeds produce different d strings", () => {
    const r1 = renderBlob(baseShape, "semantic", 42, 0);
    const r2 = renderBlob(baseShape, "semantic", 99, 0);
    expect(r1.attrs.d).not.toBe(r2.attrs.d);
  });

  it("different shape indexes produce different d strings", () => {
    const r1 = renderBlob(baseShape, "semantic", 42, 0);
    const r2 = renderBlob(baseShape, "semantic", 42, 1);
    expect(r1.attrs.d).not.toBe(r2.attrs.d);
  });
});

describe("renderBlob - tag is always path", () => {
  it("returns tag path in semantic mode", () => {
    const result = renderBlob(baseShape, "semantic", 1, 0);
    expect(result.tag).toBe("path");
  });

  it("returns tag path in path mode", () => {
    const result = renderBlob(baseShape, "path", 1, 0);
    expect(result.tag).toBe("path");
  });
});

describe("renderBlob - control point count", () => {
  it("default 6 points produces 6 C (cubic Bézier) segments", () => {
    const result = renderBlob(baseShape, "semantic", 1, 0);
    const cMatches = (result.attrs.d as string).match(/ C /g);
    expect(cMatches).toHaveLength(6);
  });

  it("custom points=4 produces 4 C segments", () => {
    const shape = { ...baseShape, points: 4 };
    const result = renderBlob(shape, "semantic", 1, 0);
    const cMatches = (result.attrs.d as string).match(/ C /g);
    expect(cMatches).toHaveLength(4);
  });

  it("custom points=10 produces 10 C segments", () => {
    const shape = { ...baseShape, points: 10 };
    const result = renderBlob(shape, "semantic", 1, 0);
    const cMatches = (result.attrs.d as string).match(/ C /g);
    expect(cMatches).toHaveLength(10);
  });
});

describe("renderBlob - path structure", () => {
  it("d starts with M", () => {
    const result = renderBlob(baseShape, "semantic", 1, 0);
    expect((result.attrs.d as string)).toMatch(/^M /);
  });

  it("d ends with Z", () => {
    const result = renderBlob(baseShape, "semantic", 1, 0);
    expect((result.attrs.d as string)).toMatch(/ Z$/);
  });

  it("has a d attribute", () => {
    const result = renderBlob(baseShape, "semantic", 1, 0);
    expect(result.attrs).toHaveProperty("d");
    expect(typeof result.attrs.d).toBe("string");
  });
});
