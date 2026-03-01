import type { Canvas, ShapeElement } from "./types.js";

export function assembleSvg(canvas: Canvas, elements: ShapeElement[], defs?: string[]): string {
  const children = elements.map((el) => {
    const attrs: string[] = [];
    attrs.push(`id="${el.id}"`);
    for (const [k, v] of Object.entries(el.attrs)) {
      attrs.push(`${k}="${v}"`);
    }
    if (el.rotation !== undefined && el.rotation !== 0) {
      attrs.push(`transform="rotate(${el.rotation}, ${el.cx}, ${el.cy})"`);
    }
    return `<${el.tag} ${attrs.join(" ")}/>`;
  });
  const defsBlock = defs && defs.length > 0
    ? [`  <defs>`, ...defs, `  </defs>`]
    : [];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`,
    ...defsBlock,
    ...children.map((c) => `  ${c}`),
    `</svg>`,
  ].join("\n");
}
