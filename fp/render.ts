import sharp from "/home/raf/projects/blackwall-protocol/node_modules/sharp/lib/index.js";
import { PALETTES, PALETTE_NAMES, type RGB } from "./palettes";

const INTERESTING_RULES = [30, 45, 73, 89, 101, 105, 110, 124, 135, 150, 161, 193, 195];
const SIZE = 256;   // итоговый PNG: 256×256 px
const Q    = 64;    // половина стороны = размер четверти
const CS   = 2;     // масштаб (пикселей на клетку), Q * CS = 128 = SIZE / 2

export interface FingerprintResult {
  png:         Buffer;        // готовый PNG
  hex:         string;        // хеш в hex (64 символа)
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

export async function renderFingerprint(hashBuf: Buffer): Promise<FingerprintResult> {
  const paletteIdx = hashBuf[0] % 6;
  const ruleIdx    = hashBuf[1] % INTERESTING_RULES.length;
  const rule       = INTERESTING_RULES[ruleIdx];
  const palette    = PALETTES[paletteIdx];
  const paletteName = PALETTE_NAMES[paletteIdx];

  // начальное состояние CA: Q бит, каждый бит = (hashBuf[i % 32] >> (i % 8)) & 1
  const initState = new Uint8Array(Q);
  for (let i = 0; i < Q; i++) {
    initState[i] = (hashBuf[i % 32] >> (i % 8)) & 1;
  }

  const patterns: Uint8Array[] = [];
  let state = initState;
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

  const rawRGBA = Buffer.alloc(SIZE * SIZE * 4);

  // Рендеринг пикселей с отражением
  for (let y = 0; y < Q; y++) {
    for (let x = 0; x < Q; x++) {
      const color: RGB = palette[patterns[y][x]]; // паттерн = индекс цвета (0–7)
      
      // закрашиваем CS×CS пикселей
      for (let dy = 0; dy < CS; dy++) {
        for (let dx = 0; dx < CS; dx++) {
          const px = x * CS + dx;  // 0..127
          const py = y * CS + dy;  // 0..127
          
          // 4 симметричных позиции
          const coords = [
            [px, py],
            [SIZE - 1 - px, py],
            [px, SIZE - 1 - py],
            [SIZE - 1 - px, SIZE - 1 - py]
          ];
          
          for (const [cx, cy] of coords) {
            const idx = (cy * SIZE + cx) * 4;
            rawRGBA[idx] = color[0];
            rawRGBA[idx + 1] = color[1];
            rawRGBA[idx + 2] = color[2];
            rawRGBA[idx + 3] = 255;
          }
        }
      }
    }
  }

  // Круговая маска
  const cx = SIZE / 2 - 0.5;
  const cy = SIZE / 2 - 0.5;
  const radiusSq = (SIZE / 2) * (SIZE / 2);

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy > radiusSq) {
        const idx = (py * SIZE + px) * 4;
        rawRGBA[idx + 3] = 0; // alpha = 0
      }
    }
  }

  // Сохранение через sharp
  const png = await sharp(rawRGBA, {
    raw: { width: SIZE, height: SIZE, channels: 4 }
  })
  .png()
  .toBuffer();

  return {
    png,
    hex: hashBuf.toString("hex"),
    paletteName,
    rule
  };
}
