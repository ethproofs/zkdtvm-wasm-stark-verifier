# dt-wasm-verifier

Pre-built WASM verifier for **compressed zkDTVM proofs**. No Rust toolchain required — just Node.js.

Built against **zkdtvm v0.8.0** / [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `v0.8.0` tag,
which currently resolves to commit `6bb8a737bdc5473332b980820921c090211069c7`.

> **The `v0.8.0` tag is mutable and has already moved once.** It previously
> resolved to `c5da37f5d187616c9ffe445e2e29e1f4d21c612d`; upstream retagged it
> to `6bb8a73` to ship the reusable elided L4 verifier. `main`'s `Cargo.toml`
> selects the backend by tag, so only `Cargo.lock` pins the exact commit —
> always build with the committed lock, and re-verify fixtures after any
> `cargo update`.

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
| `initVerifierRuntime()` | `() → void` | Install panic hook **and run the one-time L4 setup (~3.7 s)**. Call once per worker before verifying. **Throws** if setup fails. |
| `verifyCompressedBytes(proof, vk)` | `(Uint8Array, Uint8Array) → void` | Verify proof. **Throws** on failure. |
| `verifyCompressedOk(proof, vk)` | `(Uint8Array, Uint8Array) → boolean` | Verify proof. Returns `true` if valid, `false` otherwise. |

### Byte format

- **`compressed_proof.bin`** — `bincode::serialize(compressed_proof)`, a `DTReduceProof<RootSC>`, in the **elided** form.
- **`compressed_vk.bin`** — `bincode::serialize(vk)`, the **full `DTVerifyingKey` struct** (the program/core VK).

> **Changed in the retagged v0.8.0 backend.** The verifier now accepts only the
> compact **elided** proof form. The fixed L4 machine, program and VK are
> embedded in the WASM package and are no longer API inputs; a proof that still
> carries the L4 preprocessing opening is rejected even when otherwise valid.

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
  OK 42.96 ms

```

> **The cost moved from verify to init.** The retagged v0.8.0 backend embeds the
> fixed L4 verifier and reuses it, so `initVerifierRuntime()` pays a one-time
> setup and each verification is cheap. Measured on an M-series Mac with this
> fixture:
>
> | Runtime | One-time init | Verify (first) | Verify (subsequent) |
> | ------- | ------------- | -------------- | ------------------- |
> | Chrome (worker, `pkg-web/`) | ~3.7 s | ~47 ms | ~47 ms |
> | Node 20 (`pkg-node/`) | ~3.7 s | ~43 ms | ~13 ms |
>
> The previous build verified this fixture in ~19.3 s (Chrome) / ~44.5 s
> (Node 20). In the browser, still run this inside a worker (as `demo/` does):
> the per-call cost is now small, but `initVerifierRuntime()` blocks for
> seconds. The `.wasm` shrank from ~15 MB to ~3.2 MB; keep caching it.

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
