import { PALETTES, PALETTE_NAMES } from './palettes';

const INTERESTING_RULES = [30, 45, 73, 89, 101, 105, 110, 124, 135, 150, 161, 193, 195];
const SIZE = 256;
const Q    = 64;
const CS   = 2;

export interface FingerprintResult {
  dataUrl:     string;
  hex:         string;
  paletteName: string;
  rule:        number;
}

function stepCA(state: Uint8Array, rule: number): Uint8Array {
  const Q = state.length;
  const next = new Uint8Array(Q);
  for (let i = 0; i < Q; i++) {
    const l = state[(i - 1 + Q) % Q];
    const c = state[i];
    const r = state[(i + 1) % Q];
    next[i] = (rule >> ((l << 2) | (c << 1) | r)) & 1;
  }
  return next;
}

export function renderFingerprint(hashBuf: Uint8Array): FingerprintResult {
  const paletteIdx  = hashBuf[0] % 6;
  const ruleIdx     = hashBuf[1] % INTERESTING_RULES.length;
  const rule        = INTERESTING_RULES[ruleIdx];
  const palette     = PALETTES[paletteIdx];
  const paletteName = PALETTE_NAMES[paletteIdx];

  const initState = new Uint8Array(Q);
  for (let i = 0; i < Q; i++) {
    initState[i] = (hashBuf[i % 32] >> (i % 8)) & 1;
  }

  const patterns: Uint8Array[] = [];
  let state: Uint8Array = initState;
  for (let y = 0; y < Q; y++) {
    const pats = new Uint8Array(Q);
    for (let i = 0; i < Q; i++) {
      const l = state[(i - 1 + Q) % Q];
      const c = state[i];
      const r = state[(i + 1) % Q];
      pats[i] = (l << 2) | (c << 1) | r;
    }
    patterns.push(pats);
    state = stepCA(state, rule);
  }

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(SIZE, SIZE);
  const data = imageData.data;

  for (let y = 0; y < Q; y++) {
    for (let x = 0; x < Q; x++) {
      const color = palette[patterns[y][x]];
      for (let dy = 0; dy < CS; dy++) {
        for (let dx = 0; dx < CS; dx++) {
          const px = x * CS + dx;
          const py = y * CS + dy;
          const coords: [number, number][] = [
            [px, py],
            [SIZE - 1 - px, py],
            [px, SIZE - 1 - py],
            [SIZE - 1 - px, SIZE - 1 - py],
          ];
          for (const [cx, cy] of coords) {
            const idx = (cy * SIZE + cx) * 4;
            data[idx]     = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
            data[idx + 3] = 255;
          }
        }
      }
    }
  }

  // Circular mask
  const cxc = SIZE / 2 - 0.5;
  const cyc = SIZE / 2 - 0.5;
  const radiusSq = (SIZE / 2) * (SIZE / 2);
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const dx = px - cxc;
      const dy = py - cyc;
      if (dx * dx + dy * dy > radiusSq) {
        data[(py * SIZE + px) * 4 + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    hex: Array.from(hashBuf).map(b => b.toString(16).padStart(2, '0')).join(''),
    paletteName,
    rule,
  };
}
