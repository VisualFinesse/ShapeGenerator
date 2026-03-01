/**
 * Derive a deterministic seed for a blob shape from the generator seed and shape index.
 * Combines two integer values into a new seed using prime multiplication.
 */
export function blobSeed(generatorSeed: number, index: number): number {
  return (Math.imul(generatorSeed | 0, 1000003) + Math.imul(index, 2654435761)) | 0;
}

/**
 * Create a mulberry32 PRNG function seeded with the given value.
 * Each call to the returned function advances state and returns a float in [0, 1).
 */
export function createPrng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let z = Math.imul(s ^ (s >>> 15), s | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}
