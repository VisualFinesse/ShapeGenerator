import { describe, expect, test } from "vitest";
import { generate } from "../src/index.js";
import type { GeneratorInput } from "../src/types.js";

const gradient = {
  type: "linear" as const,
  stops: [
    { offset: 0, color: "#ff0000" },
    { offset: 1, color: "#0000ff" },
  ],
};

const input = (idPrefix?: string): GeneratorInput => ({
  seed: 42,
  canvas: { width: 100, height: 100 },
  ...(idPrefix !== undefined ? { idPrefix } : {}),
  shapes: [
    {
      type: "circle",
      x: 50,
      y: 50,
      size: 40,
      fillGradient: gradient,
      mask: [{ type: "square", x: 50, y: 50, size: 20, fillGradient: gradient }],
    },
  ],
});

const idsIn = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const refsIn = (svg: string) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);

describe("idPrefix", () => {
  test("namespaces shape, gradient and mask ids", () => {
    const ids = idsIn(generate(input("hero")).svg);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id.startsWith("hero-")).toBe(true);
  });

  test("references stay internally consistent", () => {
    const svg = generate(input("hero")).svg;
    const ids = new Set(idsIn(svg));
    for (const ref of refsIn(svg)) expect(ids.has(ref)).toBe(true);
  });

  test("two outputs with the same seed no longer collide when composed", () => {
    // The bug this field exists for: identical config, same seed, both inlined
    // into one document.
    const a = generate(input("a")).svg;
    const b = generate(input("b")).svg;

    const overlap = idsIn(a).filter((id) => new Set(idsIn(b)).has(id));
    expect(overlap).toEqual([]);

    // ...and without a prefix they DO collide, which is the behaviour being fixed.
    const bare1 = idsIn(generate(input()).svg);
    const bare2 = idsIn(generate(input()).svg);
    expect(bare1).toEqual(bare2);
  });

  test("omitting idPrefix leaves ids unchanged", () => {
    expect(idsIn(generate(input()).svg).every((id) => id.startsWith("s42-"))).toBe(true);
  });

  test("rejects a prefix that would produce an invalid XML id", () => {
    for (const bad of ["9lead", "has space", "has#hash", ""]) {
      expect(() => generate(input(bad))).toThrow(/idPrefix/);
    }
  });

  test("output is unchanged apart from ids", () => {
    const strip = (svg: string) =>
      svg.replace(/ id="[^"]+"/g, "").replace(/url\(#[^)]+\)/g, "url(#X)");
    expect(strip(generate(input("hero")).svg)).toBe(strip(generate(input()).svg));
  });
});
