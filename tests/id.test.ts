import { describe, it, expect } from "vitest";
import { shapeId } from "../src/id.js";

describe("shapeId", () => {
  it("encodes positive seed correctly", () => {
    expect(shapeId(42, "square", 0)).toBe("s42-square-0");
  });

  it("encodes negative seed with sn prefix", () => {
    expect(shapeId(-7, "circle", 2)).toBe("sn7-circle-2");
  });

  it("encodes zero seed as s0", () => {
    expect(shapeId(0, "triangle", 1)).toBe("s0-triangle-1");
  });

  it("encodes type string correctly", () => {
    expect(shapeId(1, "rectangle", 0)).toBe("s1-rectangle-0");
    expect(shapeId(1, "circle", 0)).toBe("s1-circle-0");
    expect(shapeId(1, "triangle", 0)).toBe("s1-triangle-0");
    expect(shapeId(1, "square", 0)).toBe("s1-square-0");
  });

  it("encodes index correctly", () => {
    expect(shapeId(10, "square", 0)).toBe("s10-square-0");
    expect(shapeId(10, "square", 1)).toBe("s10-square-1");
    expect(shapeId(10, "square", 99)).toBe("s10-square-99");
  });

  it("produces XML name-valid identifiers (starts with letter, only letters/digits/hyphens)", () => {
    const xmlNamePattern = /^[a-zA-Z][a-zA-Z0-9\-]*$/;
    expect(shapeId(42, "square", 0)).toMatch(xmlNamePattern);
    expect(shapeId(-7, "circle", 2)).toMatch(xmlNamePattern);
    expect(shapeId(0, "triangle", 5)).toMatch(xmlNamePattern);
    expect(shapeId(-100, "rectangle", 10)).toMatch(xmlNamePattern);
  });

  it("negative seed with large absolute value", () => {
    expect(shapeId(-100, "square", 3)).toBe("sn100-square-3");
  });
});
