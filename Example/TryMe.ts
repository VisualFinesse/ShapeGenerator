/**
 * TryMe.ts — Variation & Perturbation Showcase
 *
 * Run: npx tsx Example/TryMe.ts
 * SVGs are written to Example/output/
 */

import { generate } from "../src/index.ts";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("Example/output", { recursive: true });

function write(name: string, svg: string) {
  writeFileSync(`Example/output/${name}`, svg, "utf8");
  console.log(`  ${name}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SAME BLOB — 6 DIFFERENT SEEDS
//    Shows: seed changes the shape completely, but each is reproducible forever
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[1] Same blob, 6 seeds:");
for (const seed of [1, 2, 3, 42, 99, 777]) {
  const { svg } = generate({
    seed,
    canvas: { width: 200, height: 200 },
    shapes: [{ type: "blob", x: 100, y: 100, size: 80, points: 8, fill: "steelblue" }],
  });
  write(`1-seed-${seed}.svg`, svg);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DISTORTION RAMP — same hexagon, distort 0 → 0.8
//    Shows: how much the distort field warps the vertices
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[2] Distortion ramp (hexagon):");
for (const distort of [0, 0.1, 0.2, 0.35, 0.5, 0.8]) {
  const label = String(distort).replace(".", "p");
  const { svg } = generate({
    seed: 42,
    canvas: { width: 200, height: 200 },
    shapes: [{
      type: "polygon", x: 100, y: 100, sides: 6, size: 80,
      fill: "tomato", distort,
    }],
  });
  write(`2-distort-${label}.svg`, svg);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SIZE VARIANCE — same cluster of circles, variance 0 → 0.8
//    Shows: sizeVariance as a "chaos dial" on scale
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[3] Size variance (circle cluster):");
const clusterPositions = [
  { x: 60,  y: 60  },
  { x: 140, y: 60  },
  { x: 60,  y: 140 },
  { x: 140, y: 140 },
  { x: 100, y: 100 },
];
for (const sizeVariance of [0, 0.2, 0.4, 0.6, 0.8]) {
  const label = String(sizeVariance).replace(".", "p");
  const { svg } = generate({
    seed: 7,
    canvas: { width: 200, height: 200 },
    shapes: clusterPositions.map(({ x, y }) => ({
      type: "circle" as const, x, y, size: 35, fill: "mediumseagreen", sizeVariance,
    })),
  });
  write(`3-sizevariance-${label}.svg`, svg);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FULL CHAOS — distort + sizeVariance + bezier on a blob
//    Shows: all variation fields combined
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[4] Full chaos (blob):");
for (const seed of [1, 2, 3, 4, 5, 6]) {
  const { svg } = generate({
    seed,
    canvas: { width: 200, height: 200 },
    shapes: [{
      type: "blob", x: 100, y: 100, size: 75, points: 10,
      fill: "orchid",
      distort: 0.4,
      sizeVariance: 0.3,
      bezier: 0.5,
    }],
  });
  write(`4-chaos-seed-${seed}.svg`, svg);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ORGANIC COMPOSITION — layered distorted shapes, like a real design element
//    Shows: how variation builds up into something visually interesting
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[5] Organic composition:");
for (const seed of [10, 20, 30]) {
  const { svg } = generate({
    seed,
    canvas: { width: 400, height: 400 },
    shapes: [
      // Large background blob
      {
        type: "blob", x: 200, y: 200, size: 170, points: 7,
        fill: "#1a1a2e", distort: 0.2, bezier: 0.4, layer: 0,
      },
      // Mid blob — slightly offset
      {
        type: "blob", x: 190, y: 210, size: 120, points: 8,
        fill: "#16213e", distort: 0.3, bezier: 0.5, layer: 1,
      },
      // Accent polygon — distorted
      {
        type: "polygon", x: 200, y: 195, sides: 6, size: 70,
        fill: "#0f3460", distort: 0.25, layer: 2,
      },
      // Small bright center circle — no distortion (clean focal point)
      {
        type: "circle", x: 200, y: 200, size: 28,
        fill: "#e94560", layer: 3,
      },
    ],
  });
  write(`5-composition-seed-${seed}.svg`, svg);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CLAMP — distorted shapes reined in by a bounding box
//    Shows: how clamp prevents variation from blowing outside a region
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[6] Clamp comparison (heavy distort, with and without clamp):");
for (const useClamp of [false, true]) {
  const { svg } = generate({
    seed: 55,
    canvas: { width: 300, height: 300 },
    shapes: [{
      type: "polygon", x: 150, y: 150, sides: 8, size: 100,
      fill: "goldenrod", distort: 0.5,
      ...(useClamp ? { clamp: { width: 160, height: 160 } } : {}),
    }],
  });
  write(`6-clamp-${useClamp ? "on" : "off"}.svg`, svg);
}

console.log("\nDone. Open Example/output/ to view all SVGs.\n");

// run with: npx tsx Example/TryMe.ts
