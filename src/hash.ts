import { Keystream } from "./keystream";

// ─── Variant 2: Davies-Meyer hash ─────────────────────────────────────────────
//
// H_0 = 0^256
// H_i = Encrypt_{k1=M_i, k2=H_{i-1}}(H_{i-1}) XOR H_{i-1}
//
// The CA stream cipher acts as the block cipher E.
// M_i sets the CA initial state (k1); H_{i-1} drives the rule schedule (k2).
// The XOR back of H_{i-1} is the feed-forward that ensures one-wayness.
//
// Padding: length-strengthened Merkle-Damgård.

export const HASH_BLOCK = 32; // Davies-Meyer block size in bytes (= hash output size)

function dmPad(data: Buffer): Buffer {
  const lenBytes = 8;
  const padLen = HASH_BLOCK - ((data.length + 1 + lenBytes) % HASH_BLOCK);
  const out = Buffer.alloc(data.length + 1 + padLen + lenBytes);
  data.copy(out);
  out[data.length] = 0x80;
  const bitLen = BigInt(data.length) * 8n;
  out.writeBigUInt64BE(bitLen, out.length - lenBytes);
  return out;
}

export function hash(data: Buffer, outputBits = 256): Buffer {
  if (outputBits % 8 !== 0) throw new Error("outputBits must be a multiple of 8");

  const padded = dmPad(data);
  let H = Buffer.alloc(HASH_BLOCK); // H_0 = 0^256

  for (let off = 0; off < padded.length; off += HASH_BLOCK) {
    const M = padded.subarray(off, off + HASH_BLOCK);
    // E_{k1=M, k2=H}(H): encrypt the current hash value using this block as k1
    const ks = new Keystream(M, H).nextBytes(HASH_BLOCK);
    H = Buffer.from(H.map((b, i) => b ^ ks[i])); // Davies-Meyer feed-forward
  }

  if (outputBits / 8 <= HASH_BLOCK) return H.subarray(0, outputBits / 8);

  // Extend output beyond 256 bits via chained re-hashing
  const parts = [H];
  let prev = H;
  let got = HASH_BLOCK;
  let idx = 0;
  while (got < outputBits / 8) {
    const ext = Buffer.from(Buffer.concat([prev, Buffer.from([0xff, idx++ & 0xff])]));
    prev = hash(ext, 256);
    parts.push(prev);
    got += HASH_BLOCK;
  }
  return Buffer.concat(parts).subarray(0, outputBits / 8);
}
