# dt-wasm-verifier (source branch)

Source-build recipe for the WASM bindings of **`zkdtvm-stark-verifier::verify_compressed_bytes`**. Running `wasm-pack` against this crate produces the `pkg-node/` and `pkg-web/` artifacts that downstream projects (and the sibling [`ethproofs`](#relationship-with-the-ethproofs-branch) branch) actually consume.

If you only want to **use** the pre-built WASM (Node / browser integration, demo, fixtures), grab the `ethproofs` branch instead — no Rust toolchain required there.

---

## Version matrix

| Component        | Version / Source                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| zkdtvm           | **v0.6.2** (prover is not yet open-source)                                                         |
| Verifier backend | [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `v0.6.2` tag |

> `zkdtvm_vks/v0.6.2/vk.bin` is the **official verifying-key digest bin**
> for the current `ethproofs` release — it is bound to both the zkdtvm
> version and the Ant Eth client version pinned above. The file is a
> 32-byte bincode-serialized `[u32; 8]` Poseidon2 digest of the verifying
> key, **not** the verifying key itself.

### History

Each row pins both the **zkdtvm release** (the proving side) and the **Ant Eth client release** (the program whose verifying key the digest commits to). A bump on either side invalidates some of the artifacts produced by this recipe:

- A **zkdtvm** change invalidates the built `pkg-node/` / `pkg-web/` WASM artifacts **and** the verifying-key digest under `zkdtvm_vks/`.
- An **Ant Eth client** change invalidates the verifying-key digest under `zkdtvm_vks/` only.

| Tag / Branch | zkdtvm | Ant Eth client | Backend                                           |
| ------------ | ------ | -------------- | ------------------------------------------------- |
| *(current)*  | v0.6.2 | v0.6.2         | `zkdtvm-stark-verifier` open-source repo, `v0.6.2` tag |

---

## Prerequisites

- **Rust** nightly toolchain matching `zkdtvm-stark-verifier` (current: `nightly-2025-09-22`, auto-installed by `rust-toolchain.toml` of transitive deps).
- **Node.js** ≥ 18 (for the demo server and the Node smoke test).
- **`wasm-pack`** and **`wasm-opt`** on `PATH` if you want to rebuild the WASM packages from source. For example: `cargo install wasm-pack --version 0.15.0` and `brew install binaryen`.
- Network access to `https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier.git` (and `crates.io` for Plonky3 deps) during `cargo` / `wasm-pack` build.

---

## Build

```bash
npm run wasm:node    # output: pkg-node/  (Node.js target, default smoke test)
npm run wasm:web     # output: pkg-web/   (browser target, for the web demo)
```

Artifact layout under each `pkg-*/`:

```
dt_wasm_verifier.js         # JS glue
dt_wasm_verifier_bg.wasm    # compiled WASM (~950 KB after wasm-opt -O3)
dt_wasm_verifier.d.ts       # TypeScript defs
package.json                # npm package metadata
```

The release profile in `Cargo.toml` favours **runtime speed** (`opt-level = 3`, `lto = true`) over minimal `.wasm` size.

---

## Exported JS API

| Function                           | Signature                                   | Description                                                  |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `init()` *(web only)*              | `() → Promise<void>`                        | Load & compile WASM. Node auto-loads.                        |
| `initVerifierRuntime()`            | `() → void`                                 | Install panic hook. Call once before verifying.              |
| `verifyCompressedBytes(proof, vk)` | `(Uint8Array, Uint8Array) → void`           | Verify; **throws** on failure. `vk` is normally the 32-byte digest file. |
| `verifyCompressedOk(proof, vk)`    | `(Uint8Array, Uint8Array) → boolean`        | Verify; returns `true` on success, `false` otherwise.        |

### Byte layout

- `proof` — serialized bytes of the compressed proof produced by zkdtvm.
- `vk`    — bincode-serialized `[u32; 8]` **hash digest of the verifying key**, **not** the full verifying key. Legacy bincode-serialized `DTVerifyingKey` bytes are also accepted.

This matches `zkdtvm_stark_verifier::verify_compressed_bytes` one-to-one.

---

## Smoke test (post-build sanity check)

```bash
npm run test:node
# → OK <ms>
```

Defaults to `web/samples/compressed_proof.bin` + `web/samples/compressed_vk.bin` (a checked-in sample pair matching the current backend). To verify an arbitrary pair:

```bash
node scripts/verify_node.mjs /path/to/proof.bin /path/to/vk.bin
```

---

## Web demo

```bash
npm run demo
# open http://127.0.0.1:8788/
```

The UI loads `pkg-web/` once per tab and runs `verifyCompressedBytes` inside a worker. Use **Load sample (Fibonacci)** to pull `web/samples/`, or drop your own `compressed_proof.bin` / `compressed_vk.bin`.

---

## Relationship with the `ethproofs` branch

This branch (**`ethproofs_source`**) holds the **build recipe**: Rust sources + `Cargo.toml` + `wasm-pack` configuration. Running the `Build` section above produces the `pkg-node/` / `pkg-web/` directories and the corresponding `web/samples/` smoke-test pair.

The **`ethproofs`** branch is the **consumer-facing drop**: it ships only the already-built `pkg-node/` / `pkg-web/` along with a fixture suite and integration notes — no Rust toolchain required there. Every pkg refresh on `ethproofs` is expected to be produced by this branch first.

Downstream flow (integration, fixtures, demo wiring, CI templates) lives on `ethproofs`; refer to its README for end-user usage.

---

## Generating production `compressed_proof.bin` / `compressed_vk.bin`

The sample pair under `web/samples/` is a regenerable artifact. To produce real proofs for zkdtvm v0.6.2, use the zkdtvm prover pipeline (not yet open-source) and export `proof` / `vk` as raw serialized bytes using the same layout described in [Byte layout](#byte-layout). The `vk` bytes must be the 32-byte **hash digest of the verifying key**, not the full verifying key.

Refer to the zkdtvm SDK documentation for full prover setup.

---

## License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). See [LICENSE](./LICENSE) for the full license text.
