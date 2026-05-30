/**
 * Blackwall Cipher — Demo
 * Exercises all three variants: stream cipher, hash, MAC.
 */

import { encrypt, decrypt, hash, mac } from "./src/index";

const hr = (label: string) =>
  console.log(`\n${"─".repeat(60)}\n  ${label}\n${"─".repeat(60)}`);

const hex = (b: Buffer) => b.toString("hex");

function hamming(a: Buffer, b: Buffer): number {
  let bits = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let x = a[i] ^ b[i];
    while (x) { bits += x & 1; x >>>= 1; }
  }
  return bits;
}

// ─── Keys ────────────────────────────────────────────────────────────────────
const k1 = Buffer.from("DEADBEEF_BLACKWALL_KEY_ONE", "utf8");
const k2 = Buffer.from("CAFEBABE_BLACKWALL_KEY_TWO", "utf8");

// ─── Variant 1: Stream cipher ────────────────────────────────────────────────
hr("VARIANT 1 — STREAM CIPHER");

const msg = Buffer.from("BLACKWALL PROTOCOL BREACH DETECTED", "utf8");
console.log("Plaintext : ", msg.toString());

const ct = encrypt(msg, k1, k2);
console.log("Ciphertext:", hex(ct));

const rt = decrypt(ct, k1, k2);
console.log("Recovered :", rt.toString());
console.log("Match      :", msg.equals(rt) ? "✓ PASS" : "✗ FAIL");

// Wrong key produces garbage
const ctWrong = decrypt(ct, k2, k1);
console.log("Wrong keys:", ctWrong.toString());

// ─── Variant 2: Hash ─────────────────────────────────────────────────────────
hr("VARIANT 2 — DAVIES-MEYER HASH");

const msgA = Buffer.from("BLACKWALL PROTOCOL BREACH DETECTED", "utf8");
const msgB = Buffer.from("BLACKWALL PROTOCOL BREACH DETECTED!", "utf8"); // +1 char
const msgC = Buffer.from("BLACKWALL PROTOCOL BREACH DETECTEE", "utf8"); // 1-bit diff at end
const empty = Buffer.alloc(0);

const hA = hash(msgA);
const hB = hash(msgB);
const hC = hash(msgC);
const hE = hash(empty);

console.log("H(A)  =", hex(hA));
console.log("H(B)  =", hex(hB));
console.log("H(C)  =", hex(hC));
console.log("H(∅)  =", hex(hE));
console.log("");
console.log("A≠B   :", !hA.equals(hB) ? "✓ PASS" : "✗ FAIL");
console.log("A≠C   :", !hA.equals(hC) ? "✓ PASS" : "✗ FAIL");
console.log("A≠∅   :", !hA.equals(hE) ? "✓ PASS" : "✗ FAIL");

// Avalanche: 1-bit input diff → how many output bits flip?
const avalanche = hamming(hA, hC);
const pct = ((avalanche / 256) * 100).toFixed(1);
console.log(`\nAvalanche (A vs C, 1-bit diff): ${avalanche}/256 bits flipped (${pct}%)`);
console.log("Ideal ~50% :", (avalanche > 96 && avalanche < 160) ? "✓" : "⚠");

// Determinism check
console.log("\nDeterminism H(A) == H(A):", hash(msgA).equals(hA) ? "✓ PASS" : "✗ FAIL");

// 512-bit output
const h512 = hash(msgA, 512);
console.log("\nH(A, 512b) =", hex(h512));
console.log("Length     :", h512.length === 64 ? "✓ 64 bytes" : "✗ FAIL");

// ─── Variant 3: MAC ──────────────────────────────────────────────────────────
hr("VARIANT 3 — MAC");

const m1 = mac(msgA, k1);
const m2 = mac(msgA, k2);          // same data, different key
const m3 = mac(msgB, k1);          // different data, same key
const m4 = mac(msgA, k1);          // same as m1 — should match

console.log("MAC(A, k1) =", hex(m1));
console.log("MAC(A, k2) =", hex(m2));
console.log("MAC(B, k1) =", hex(m3));

console.log("");
console.log("Different keys → different MAC :", !m1.equals(m2) ? "✓ PASS" : "✗ FAIL");
console.log("Different data → different MAC :", !m1.equals(m3) ? "✓ PASS" : "✗ FAIL");
console.log("Determinism MAC(A,k1)==MAC(A,k1):", m1.equals(m4) ? "✓ PASS" : "✗ FAIL");

hr("ALL TESTS COMPLETE");
