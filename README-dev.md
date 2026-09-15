# dt-wasm-verifier

Pre-built WASM verifier for **zkDTVM Seal proofs**. No Rust toolchain required — just Node.js.

Built against **zkdtvm v0.8.0** / [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `v0.8.0` tag,
which currently resolves to commit `e02a91464d94a5d1d5d3123003ddd2f86b54eeb8`.

> **The `v0.8.0` tag is mutable and has moved twice.** It previously resolved to
> `c5da37f5d187616c9ffe445e2e29e1f4d21c612d`, then to `6bb8a737bdc5473332b980820921c090211069c7`
> (the reusable elided L4 verifier), and now to `e02a9146` (the Seal proof API).
> `main`'s `Cargo.toml` selects the backend by tag, so only `Cargo.lock` pins the
> exact commit — always build with the committed lock, and re-verify fixtures
> after any `cargo update`.

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
const proof = new Uint8Array(/* block_NNNNN.seal bytes */);
const vk    = new Uint8Array(/* application key bytes */);

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

const proof = fs.readFileSync('block_25954917.seal');
const vk    = fs.readFileSync('vk.bin');

verifyCompressedBytes(proof, vk);  // throws on failure
```

### API reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `init()` | `() → Promise<void>` | Load & compile WASM. **Browser only** (Node auto-loads). |
| `initVerifierRuntime()` | `() → void` | Install panic hook and initialize the verifier for reuse (~30 ms). Call once per worker before verifying. **Throws** if setup fails. |
| `verifyCompressedBytes(proof, vk)` | `(Uint8Array, Uint8Array) → void` | Verify proof. **Throws** on failure. |
| `verifyCompressedOk(proof, vk)` | `(Uint8Array, Uint8Array) → boolean` | Verify proof. Returns `true` if valid, `false` otherwise. |

Inputs are capped at **4 MiB** (proof) and **1 MiB** (VK). The limit is enforced
at the ABI boundary before either buffer is copied into WASM, so oversize input
is cheap to reject. Every rejection is a `DTV_*` error, never a WASM trap, and
the runtime remains usable afterwards.

### Byte format

- **`proof`** — zkDTVM **SealProof v6** bytes, as written to a `.seal` file.
- **`vk`** — the complete **SDK application key** (schema 1), 2,440 bytes.

> **Changed in the current v0.8.0 backend.** The API takes Seal proof bytes and
> an SDK application key. The fixed Seal key is embedded in the WASM package and
> is not an API input. Inputs cross the ABI as `js_sys::Uint8Array` rather than
> `&[u8]` so lengths can be validated before copying.

> **Changed earlier in v0.8.0.** The previous backend took an *elided*
> `DTReduceProof<RootSC>` plus a 2,368-byte `DTVerifyingKey`. Those inputs are
> rejected by the current build; re-export proofs in the Seal format.

> **Changed in v0.8.0.** Releases before v0.8.0 (v0.6.x) took the 32-byte VK
> **digest**. Digest-only input is rejected.

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
  proof fixtures/example_1/proof.bin (267918 bytes)
  vk    fixtures/example_1/vk.bin (2440 bytes)
  OK 34.79 ms

Done: 1 passed, 0 failed
```

> **The one-time init cost is gone.** The v0.8.0 Seal backend no longer builds a
> fixed L4 verifier at startup, so `initVerifierRuntime()` is now milliseconds
> rather than seconds. Measured on an M-series Mac with this fixture:
>
> | Runtime | Load & compile | `initVerifierRuntime()` | Verify (first) | Verify (subsequent) |
> | ------- | -------------- | ----------------------- | -------------- | ------------------- |
> | Chrome 151 (worker, `pkg-web/`) | ~11 ms | ~3 ms | ~10 ms | ~9 ms |
> | Node 20 (`pkg-node/`) | ~13 ms | ~29 ms | ~35 ms | ~11 ms |
>
> The previous build paid ~3.7 s in init before the first verification. The
> `.wasm` shrank from ~3.2 MB to ~2.1 MB; keep caching it. The browser demo still
> verifies inside a worker (as `demo/` does) to keep the main thread free.

Or verify a specific proof/vk pair:

```bash
node verify-node.mjs /path/to/proof.seal /path/to/vk.bin
```

---

## Browser demo

```bash
npm run demo
```

Open **http://127.0.0.1:8788/**. Two modes:

- **Fixtures tab** — select any fixture from `fixtures/index.json`, click Verify.
- **Upload tab** — drag & drop your own `.seal` proof and application key.

---

## Fixtures

`fixtures/example_1/` is the upstream sample for Ethereum block 25954917.
`fixtures/example_1/source.json` records its provenance — source revision,
prover image, `program_identity`, `verifier_id` and SHA-256 checksums for each
file. Verify the fixture bytes against it after any refresh:

```bash
shasum -a 256 fixtures/example_1/proof.bin fixtures/example_1/vk.bin
```

### Adding fixtures

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
│   └── example_1/        # Sample Seal proof (valid) + source.json provenance
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

`main` ships pre-built `pkg-web/` and `pkg-node/` artifacts; `pkg/` (bundler) is
not committed upstream and must be built. The `_bg.wasm` is identical across all
three wasm-pack targets, so the bundler package can reuse the upstream binary
with locally generated `dt_wasm_verifier_bg.js` glue. Builds are not
bit-reproducible across toolchain versions — prefer the upstream-committed
`.wasm` for releases and confirm the generated glue matches upstream byte for
byte.
