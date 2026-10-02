// Perceptual avatar hashing (dHash). Pure: takes decoded RGBA pixels, returns a 64-bit hex hash.

/** Area-average resample of RGBA pixels into a w x h grayscale grid. */
export function toGrayGrid(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let gy = 0; gy < h; gy++) {
    for (let gx = 0; gx < w; gx++) {
      const x0 = Math.floor((gx * width) / w), x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * width) / w));
      const y0 = Math.floor((gy * height) / h), y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * height) / h));
      let sum = 0, count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
          count++;
        }
      }
      out[gy * w + gx] = Math.round(sum / Math.max(1, count));
    }
  }
  return out;
}

export function dHash(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number): string {
  const grid = toGrayGrid(rgba, width, height, 9, 8);
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += grid[y * 9 + x] < grid[y * 9 + x + 1] ? '1' : '0';
  let hex = '';
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { distance += x & 1; x >>= 1; }
  }
  return distance;
}

/** Distance <= 10/64 bits usually means the same image re-encoded or resized. */
export function avatarSimilarity(a: string, b: string): number {
  return Math.round((1 - hammingDistance(a, b) / 64) * 100);
}
