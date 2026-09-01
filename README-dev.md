# dt-wasm-verifier

Pre-built WASM verifier for **compressed zkDTVM proofs**. No Rust toolchain required — just Node.js.

Built against **zkdtvm v0.8.0** / [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `v0.8.0` tag.

---

## Integration

The entry point is **`dt_wasm_verifier.js`** inside `pkg-web/` (browser) or `pkg-node/` (Node.js). Import it, call the verifier — that's it.

### Browser (ES module)

```js
import init, { initVerifierRuntime, verifyCompressedBytes }
  from './pkg-web/dt_wasm_verifier.js';

// 1. Load & compile WASM (once per page / worker)
await init();
initVerifierRuntime();

// 2. Verify
const proof = new Uint8Array(/* compressed_proof.bin bytes */);
const vk    = new Uint8Array(/* compressed_vk.bin bytes */);

try {
  verifyCompressedBytes(proof, vk);   // no exception = PASS
  console.log('PASS');
} catch (e) {
  console.log('FAIL', e);
}
```

### Node.js

```js
import { initVerifierRuntime, verifyCompressedBytes }
  from './pkg-node/dt_wasm_verifier.js';

initVerifierRuntime();

const proof = fs.readFileSync('compressed_proof.bin');
const vk    = fs.readFileSync('compressed_vk.bin');

verifyCompressedBytes(proof, vk);  // throws on failure
```

### API reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `init()` | `() → Promise<void>` | Load & compile WASM. **Browser only** (Node auto-loads). |
| `initVerifierRuntime()` | `() → void` | Install panic hook. Call once before verifying. |
| `verifyCompressedBytes(proof, vk)` | `(Uint8Array, Uint8Array) → void` | Verify proof. **Throws** on failure. |
| `verifyCompressedOk(proof, vk)` | `(Uint8Array, Uint8Array) → boolean` | Verify proof. Returns `true` if valid, `false` otherwise. |

### Byte format

- **`compressed_proof.bin`** — `bincode::serialize(compressed_proof)`, a `DTReduceProof<RootSC>`.
- **`compressed_vk.bin`** — `bincode::serialize(vk)`, the **full `DTVerifyingKey` struct**.

> **Changed in v0.8.0.** Earlier releases (v0.6.x) took the 32-byte VK **digest**
> here. v0.8.0 requires the complete key — native-recursion verification cannot
> run from the digest alone, and digest-only input is rejected.

---

## Smoke test

Run all fixtures in one command:

```bash
npm run verify:node
```

Output:

```
Running 1 fixture(s):

[example_1]
  proof fixtures/example_1/proof.bin (254530 bytes)
  vk    fixtures/example_1/vk.bin (2368 bytes)
  OK 44479.60 ms

```

> **Verification is far slower in v0.8.0.** The v0.6.x backend verified its
> fixture in roughly 165 ms. v0.8.0 performs full native-recursion verification,
> which costs tens of seconds. Measured on an M-series Mac with this fixture:
>
> | Runtime | Time |
> | ------- | ---- |
> | Chrome (worker, `pkg-web/`) | ~19.3 s |
> | Node 20 (`pkg-node/`) | ~44.5 s |
>
> Budget for this. In the browser, always run `verifyCompressedBytes` inside a
> worker (as `demo/` does) so the UI thread stays responsive. Note the `.wasm`
> also grew from ~1.4 MB to ~15 MB, so cache it aggressively.

Or verify a specific proof/vk pair:

```bash
node verify-node.mjs /path/to/compressed_proof.bin /path/to/compressed_vk.bin
```

---

## Browser demo

```bash
npm run demo
```

Open **http://127.0.0.1:8788/**. Two modes:

- **Fixtures tab** — select any fixture from `fixtures/index.json`, click Verify.
- **Upload tab** — drag & drop your own `compressed_proof.bin` and `compressed_vk.bin`.

---

## Adding fixtures

1. Create a folder under `fixtures/<name>/` with `proof.bin` and `vk.bin`.
2. Add an entry to `fixtures/index.json`:

```json
{
  "name": "<name>",
  "description": "...",
  "proof": "/fixtures/<name>/proof.bin",
  "vk": "/fixtures/<name>/vk.bin"
}
```

Both the demo page and `npm run verify:node` will automatically pick up the new fixture.

---

## Project structure

```
├── pkg/                  # WASM package for bundlers (npm entry point)
├── pkg-web/              # WASM package for browsers (ES module)
├── pkg-node/             # WASM package for Node.js
├── fixtures/             # Sample proof & VK files
│   ├── index.json        # Fixture manifest (auto-discovered)
│   └── example_1/        # Sample compressed STARK proof (valid)
├── demo/                 # Browser demo UI
├── serve.mjs             # Local HTTP server for the demo
├── verify-node.mjs       # Node.js smoke test (runs all fixtures)
└── package.json
```

---

## Rebuilding from source

This branch carries only the generated artifacts. The Rust build recipe lives on
the **`main`** branch (`Cargo.toml` + `src/lib.rs`). To regenerate, check out
`main` and run:

```bash
npm run wasm:bundler   # → pkg/
npm run wasm:web       # → pkg-web/
npm run wasm:node      # → pkg-node/
```

Requires the `wasm32-unknown-unknown` Rust target, `wasm-pack`, and network
access to the public `zkdtvm-stark-verifier` repository. Then copy the three
`pkg*/` directories onto this branch and re-apply the
`zkdtvm_wasm_stark_verifier.*` wrapper files and `package.json` metadata.
