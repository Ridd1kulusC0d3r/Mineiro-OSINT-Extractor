// Deterministic mountain ridgelines (Minas = mountains and mines). Monochrome, used as a quiet backdrop.
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ridges(svg, w, h, layers = 7, seed = 7) {
  const rnd = mulberry(seed);
  let out = '';
  for (let l = 0; l < layers; l++) {
    const base = h * (0.52 + l * 0.075);
    const amp = 46 - l * 4;
    const f1 = 0.004 + rnd() * 0.004, f2 = 0.011 + rnd() * 0.007, f3 = 0.03 + rnd() * 0.01;
    const p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28;
    let d = '';
    for (let x = 0; x <= w; x += 8) {
      const y = base + Math.sin(x * f1 + p1) * amp + Math.sin(x * f2 + p2) * amp * 0.45 + Math.sin(x * f3 + p3) * amp * 0.12;
      d += (x ? 'L' : 'M') + x + ',' + y.toFixed(1);
    }
    const shade = 8 + l * 4;                        // darker far, slightly lighter near
    const stroke = `rgb(${shade + 26},${shade + 26},${shade + 26})`;
    out += `<path d="${d}L${w},${h}L0,${h}Z" fill="rgb(${Math.max(0, shade - 6)},${Math.max(0, shade - 6)},${Math.max(0, shade - 6)})" stroke="${stroke}" stroke-width="1.2"/>`;
  }
  svg.innerHTML = out;
}
