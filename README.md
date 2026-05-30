# Blackwall Protocol

The Blackwall Protocol is an experimental cryptographic suite built around a **1024-bit one-dimensional Cellular Automaton (CA)** with adaptive Wolfram rules. It provides a Stream Cipher, a Hash Function, a Message Authentication Code (MAC), and deterministic visual fingerprints.

The project includes both a core TypeScript backend (running on Bun) and a Vue 3 web interface styled with a custom "Blackwall Cyberpunk" aesthetic.

## Architecture & Technical Details

### 1. Cellular Automaton Core
At the heart of the protocol is a 1024-bit CA state (represented as 32 words of 32-bits). Unlike simple CA systems with fixed rules (e.g., Wolfram Rule 30), Blackwall evolves dynamically:
- The state evolves based on three neighbors (Left, Center, Right) per bit.
- The **Rule** applied to the CA changes periodically every 64 steps (`RULE_INTERVAL`).
- This dynamic rule swapping creates a non-periodic, highly chaotic keystream that resists standard CA cryptanalysis.

### 2. Stream Cipher
The cipher takes two keys: `k1` and `k2`.
- `k1` defines the **initial state** of the 1024-bit CA via SHA-256 expansion.
- `k2` defines the **rule sequence** (512 different rules used cyclically).
- Encryption is performed by XORing the plaintext with the center 32-bits of the CA output on each step. 
- Because the CA evolution is irreversible without knowing the exact rule sequence and initial state, the keystream acts as a cryptographically secure pseudo-random number generator (CSPRNG).

### 3. Hash Function (Davies-Meyer)
The hash function adapts the stream cipher into a block cipher context using the classic **Davies-Meyer** construction:
- `H = H ⊕ E(M, H)`
- The message block `M` acts as `k1`, and the current hash state `H` acts as `k2`.
- Blocks are processed in 32-byte (256-bit) chunks. The final state is the hash.
- To produce hashes larger than 256 bits, the protocol utilizes chained re-hashing with length extension padding.

### 4. Message Authentication Code (MAC)
The MAC implements a two-pass HMAC-like structure to prevent length-extension attacks:
- Inner Hash: `H(key ‖ "bw:inner" ‖ data)`
- Outer Hash: `H(key ‖ "bw:outer" ‖ inner_hash)`

### 5. Visual Fingerprints
The Blackwall protocol generates deterministic, symmetric 2D visual fingerprints from data. By hashing the input, it determines an initial seed, a specific Wolfram rule, and a predefined deterministic color palette. The 1D CA is evolved row by row, mirrored for symmetry, to create a unique identifer for files or text.

## UI / Web Client

A fully interactive client is available in the `client/` directory, built with **Vue 3** and **Vite**. 

The UI features a unique **Blackwall Cyberpunk** aesthetic:
- A crimson neon glow layered over a deep black background with dark red thermal blooms.
- Glassmorphism surfaces without rigid borders, relying on multi-layered shadows and inset glows for depth.
- Animated dynamic elements for tab routing, hex chunk rendering, and avalanche effect visualization.
- Real-time cipher interaction, MAC verification, and visual fingerprint generation directly in the browser using the `@noble/hashes` SHA-256 fallback.

### Running the Web Client

```bash
cd client
npm install
npm run dev
```

## Backend Setup

This project uses **[Bun](https://bun.sh)** for backend execution and testing.

```bash
# Install backend dependencies
bun install

# Run the backend cryptography demo
bun run demo.ts
```

## Structure

- `src/` - Backend cryptography library (CA, Keystream, Cipher, Hash, MAC).
- `client/` - Vue 3 Web Application (Frontend port of the protocol).
- `demo.ts` - Demonstration script verifying the implementation.
