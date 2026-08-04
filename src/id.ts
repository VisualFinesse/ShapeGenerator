/**
 * Build the stable element id for a shape.
 *
 * Without `prefix` the id is unique within one generated SVG but not across
 * several — two calls sharing a seed produce identical ids. Pass a distinct
 * `prefix` per output when composing multiple SVGs into one document.
 */
export function shapeId(seed: number, type: string, index: number, prefix?: string): string {
  const seedPart = seed < 0 ? `sn${Math.abs(seed)}` : `s${seed}`;
  const head = prefix ? `${prefix}-` : "";
  return `${head}${seedPart}-${type}-${index}`;
}

/** Valid XML id: starts with a letter, then letters/digits/`-`/`_`/`.` only. */
export const ID_PREFIX_PATTERN = /^[A-Za-z][A-Za-z0-9._-]*$/;
