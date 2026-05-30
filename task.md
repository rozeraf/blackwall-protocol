# Task: Refactor `blackwall.ts` into a proper multi-file TypeScript project

## Context

You have a single file `blackwall.ts` that implements the **Blackwall Cipher** —
a cryptographic library built on a 1024-bit Wolfram cellular automaton.
It contains three variants: stream cipher, Davies-Meyer hash, and MAC.

Your job is to split it into a clean project structure **without changing any logic**.
Do not rewrite algorithms. Do not rename exported functions. Just reorganise and wire up.

**Runtime: [Bun](https://bun.sh).** Do not use Node.js, tsx, or tsc. All commands use `bun`.

---

## Target file structure

```
blackwall/
├── src/
│   ├── types.ts          ← shared type aliases
│   ├── ca.ts             ← cellular automaton core (evolve)
│   ├── kdf.ts            ← key derivation (expand, stateFromKey, rulesFromKey)
│   ├── keystream.ts      ← Keystream class
│   ├── cipher.ts         ← encrypt / decrypt
│   ├── hash.ts           ← dmPad / hash
│   ├── mac.ts            ← mac
│   └── index.ts          ← re-exports everything public
├── demo.ts               ← demo script (stays at root, import from ./src/index.ts)
├── package.json
└── tsconfig.json
```

---

## Step-by-step instructions

### 1. Create `src/types.ts`

Contains only:
```ts
export type State = Uint32Array<ArrayBuffer>;
```

---

### 2. Create `src/ca.ts`

Copy from `blackwall.ts`:
- The constants: `WIDTH`, `WORDS`
- The `evolve` function

Imports needed:
```ts
import type { State } from "./types";
```

Export: `WIDTH`, `WORDS`, `evolve`

---

### 3. Create `src/kdf.ts`

Copy from `blackwall.ts`:
- The constant: `RULE_INTERVAL` (not in ca.ts — it belongs here as it affects how rules are consumed)
- Functions: `expand`, `stateFromKey`, `rulesFromKey`

Imports needed:
```ts
import { createHash } from "node:crypto";
import { WORDS } from "./ca";
import type { State } from "./types";
```

Export: `RULE_INTERVAL`, `expand`, `stateFromKey`, `rulesFromKey`

---

### 4. Create `src/keystream.ts`

Copy from `blackwall.ts`:
- The `Keystream` class

Imports needed:
```ts
import { WORDS, evolve } from "./ca";
import { RULE_INTERVAL, stateFromKey, rulesFromKey } from "./kdf";
import type { State } from "./types";
```

Export: `Keystream`

---

### 5. Create `src/cipher.ts`

Copy from `blackwall.ts`:
- `encrypt` function
- `decrypt` constant (`export const decrypt = encrypt;`)

Imports needed:
```ts
import { Keystream } from "./keystream";
```

Export: `encrypt`, `decrypt`

---

### 6. Create `src/hash.ts`

Copy from `blackwall.ts`:
- The constant: `HASH_BLOCK`
- Functions: `dmPad`, `hash`

Imports needed:
```ts
import { Keystream } from "./keystream";
```

Export: `HASH_BLOCK`, `hash`
Do NOT export `dmPad` — it is internal.

---

### 7. Create `src/mac.ts`

Copy from `blackwall.ts`:
- The `mac` function

Imports needed:
```ts
import { hash } from "./hash";
```

Export: `mac`

---

### 8. Create `src/index.ts`

This is the public API barrel file. Re-export everything users need:

```ts
export { encrypt, decrypt } from "./cipher";
export { hash } from "./hash";
export { mac } from "./mac";
```

Do NOT export internal symbols (State, Keystream, evolve, kdf functions, HASH_BLOCK, etc.)
unless you also want to expose them — but at minimum export the three public functions.

---

### 9. Update `demo.ts`

Change the import line from:
```ts
import { encrypt, decrypt, hash, mac } from "./blackwall.js";
```
to:
```ts
import { encrypt, decrypt, hash, mac } from "./src/index";
```

Everything else in `demo.ts` stays identical.

---

### 10. Create `package.json`

```json
{
  "name": "blackwall-cipher",
  "version": "1.0.0",
  "module": "src/index.ts",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "demo": "bun run demo.ts",
    "build": "bun build ./src/index.ts --outdir ./dist --target bun",
    "typecheck": "bun tsc --noEmit"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.5.0"
  }
}
```

---

### 11. Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "declaration": true,
    "strict": true,
    "lib": ["ESNext"],
    "types": ["bun-types"]
  },
  "include": ["src/**/*.ts", "demo.ts"]
}
```

---

## Verification

After completing all files, run:

```bash
bun run demo.ts
```

Expected output must contain **all** of the following strings:
- `✓ PASS` — on the "Match" line (cipher round-trip)
- `✓ PASS` — on the "A≠B" line
- `✓ PASS` — on the "A≠C" line
- `✓ PASS` — on the "A≠∅" line
- `✓` — on the "Ideal ~50%" avalanche line
- `✓ PASS` — on the "Determinism" line
- `✓ 64 bytes` — on the 512-bit hash length line
- `✓ PASS` — on all three MAC lines

If any test shows `✗`, you have introduced a bug during the refactor.
Fix the import paths first — that is the most common mistake.

---

## Rules

1. **Do not change any function body.** Copy-paste logic verbatim.
2. **Imports use bare extensions** (e.g. `"./ca"` not `"./ca.js"`).
   Bun resolves `.ts` files natively — `.js` suffixes are not needed and will cause errors.
3. **Do not merge files.** Each file must contain only what is listed above.
4. **Do not add new dependencies** beyond what is listed in package.json.
5. Install dependencies with `bun install`, not npm or yarn.
6. **Do not use `node:crypto` alternatives.** Bun supports the full `node:crypto` API natively —
   the import `import { createHash } from "node:crypto"` works as-is.
7. Run the demo with `bun run demo.ts`. Do not compile first — Bun runs TypeScript directly.
