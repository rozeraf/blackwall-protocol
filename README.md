# Blackwall Cipher

Blackwall Cipher is a cryptographic library built on a 1024-bit cellular automaton with adaptive Wolfram rules.

## Features

The library implements three variants of the Blackwall protocol:

1. **Stream Cipher** — Encrypt and decrypt data using a pair of keys `(k1, k2)`. Irreversible without the keys.
2. **Davies-Meyer Hash** — A one-way hash function using the CA stream cipher as a block cipher. No key needed.
3. **MAC (Message Authentication Code)** — A double-pass keyed hash (HMAC-like construction). Irreversible without the key.

## Installation & Setup

This project uses **[Bun](https://bun.sh)** as the runtime. Ensure you have Bun installed.

```bash
# Install dependencies
bun install
```

## Usage

### Stream Cipher

```typescript
import { encrypt, decrypt } from "./src/index";

const msg = Buffer.from("Hello World", "utf8");
const k1 = Buffer.from("KEY_ONE", "utf8");
const k2 = Buffer.from("KEY_TWO", "utf8");

// Encrypt
const ciphertext = encrypt(msg, k1, k2);

// Decrypt
const plaintext = decrypt(ciphertext, k1, k2);
```

### Hash

```typescript
import { hash } from "./src/index";

const msg = Buffer.from("Hello World", "utf8");

// Generate a 256-bit hash
const h256 = hash(msg);

// Generate a 512-bit hash
const h512 = hash(msg, 512);
```

### MAC

```typescript
import { mac } from "./src/index";

const msg = Buffer.from("Hello World", "utf8");
const key = Buffer.from("SECRET_KEY", "utf8");

const signature = mac(msg, key);
```

## Running the Demo

A demo script is provided to exercise all three variants and verify correctness:

```bash
bun run demo.ts
```

## Structure

- `src/` - Source code broken down into core components (CA, Key Derivation, Keystream, Cipher, Hash, MAC).
- `demo.ts` - Demonstration script verifying the implementation.
- `AGENT.md` - Agent instructions and project conventions.
