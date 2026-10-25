// Convierte una grilla de caracteres en un canvas a escala 1:1.
export function rasterize(rows, palette, overrides = {}) {
  const h = rows.length;
  const w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = overrides[ch] ?? palette[ch] ?? '#f0f';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export const Z_GLYPH = ['###', '.#.', '###'];
