# zkDTVM Wasm Stark Verifier

WebAssembly bindings for the zkDTVM STARK verifier.

## Overview

This module provides WebAssembly bindings for the zkDTVM STARK verifier, enabling proof verification to run directly in both web browsers and Node.js environments.

| Component        | Version |
| ---------------- | ------- |
| zkdtvm           | v0.8.0  |
| Verifier backend | [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `v0.8.0` tag |

> **Breaking change in 0.4.0.** The verifier now consumes **SealProof v6** bytes
> and an **SDK application key (schema 1)**. Both inputs changed shape: the
> application key is **2,440 bytes** (was 2,368) and proofs are exported as
> `.seal` files. Proofs and keys that verified under 0.3.0 are rejected in every
> combination and must be re-exported. See [Byte format](#byte-format).
>
> **`main()` is no longer slow.** 0.3.0 paid a one-time ~3.7 s L4 setup; the
> v0.8.0 backend removes it. `main()` now returns in ~30 ms, the module shrank
> from ~3.2 MB to ~2.1 MB, and warm verification runs in ~10 ms. See
> [Performance](#performance).

> **Breaking change in 0.3.0.** The verifier accepted only the compact
> **elided** proof form. Superseded by the 0.4.0 Seal format above.

> **Breaking change in 0.2.0.** The verification key input became the full
> serialized key rather than the 32-byte digest used by 0.1.x. Digest-only input
> is still rejected.

## Usage

### Installation

```bash
npm install @ethproofs/zkdtvm-wasm-stark-verifier
```

### React Integration

```typescript
import init, { main, verify_stark } from '@ethproofs/zkdtvm-wasm-stark-verifier';

await init(); // Load & compile WASM (if needed)
main(); // One-time verifier setup (~30 ms); throws if setup fails

// Verify a proof — reuses the state main() built
const isValid = verify_stark(proofBytes, vkBytes);
```

`main()` is cheap now, but keep the module alive and call it once per worker:
`verify_stark` reuses the runtime it installs.

### Node.js Usage

```javascript
const { main, verify_stark } = require('@ethproofs/zkdtvm-wasm-stark-verifier');

// The Node.js version loads the WASM module automatically

main(); // One-time verifier setup (~30 ms); throws if setup fails
const result = verify_stark(proofBytes, vkBytes);
```

### Byte format

- **`proof`** — zkDTVM **SealProof v6** bytes, as written to a `.seal` file.
  EthProofs records carry these bytes Base64-encoded in the `proof` field.
  Decode to a `Uint8Array` before calling; do not pass a receipt, proof hash or
  VK digest.
- **`vk`** — the complete **SDK application key** (schema 1) for the program
  being verified, 2,440 bytes. Identified on EthProofs by `verifier_id`; use the
  trusted key registered for that ID. The fixed Seal key is embedded in the WASM
  package and is not an API input.

Inputs are limited to **4 MiB** for the proof and **1 MiB** for the VK; oversize
input is rejected before it is copied into WASM. Malformed bytes, a mismatched
application key, a mismatched Seal key, and an invalid proof all fail closed with
a `DTV_*` error rather than trapping the module, and the runtime stays usable for
subsequent calls.

## Performance

Measured on an M-series Mac against `fixtures/example_1` (267,918-byte Seal
proof for Ethereum block 25954917, 2,440-byte application key):

| Runtime | Load & compile | `main()` | Verify (first) | Verify (subsequent) |
| ------- | -------------- | -------- | -------------- | ------------------- |
| Chrome 151 (worker, `pkg-web/`) | ~11 ms | ~3 ms | ~10 ms | ~9 ms |
| Node 20 (`pkg-node/`) | ~13 ms | ~29 ms | ~35 ms | ~11 ms |

For comparison, 0.3.0 required a ~3.7 s `main()` before the first verification,
and 0.2.0 took ~19 s (Chrome) / ~44.5 s (Node) per verification. The `.wasm` is
~2.1 MB (was ~3.2 MB), so cache it. Verification is now fast enough to run
inline, but a worker still keeps the main thread free.

## Testing

### Node.js Example

```bash
npm run test:node
```

This runs the Node.js example that loads proof and verification key files from the filesystem and verifies them.

### Browser Example

```bash
npm run demo
```

This starts a local HTTP server with a browser example that demonstrates:

- Loading the WASM module in a browser environment
- File upload interface for proof and verification key files
- Interactive STARK proof verification
- Performance metrics and detailed logging
- Error handling and user feedback

**Note:** The browser example requires files to be served over HTTP due to WASM CORS restrictions. The included server script handles this automatically.
