# zkDTVM Wasm Stark Verifier

WebAssembly bindings for the zkDTVM STARK verifier.

## Overview

This module provides WebAssembly bindings for the zkDTVM STARK verifier, enabling proof verification to run directly in both web browsers and Node.js environments.

| Component        | Version |
| ---------------- | ------- |
| zkdtvm           | v0.8.0  |
| Verifier backend | [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `v0.8.0` tag |

> **Breaking change in 0.3.0.** The verifier now accepts only the compact
> **elided** proof form. A full proof that still carries the fixed L4
> preprocessing opening is rejected, even when it is otherwise valid. Proofs
> that verified under 0.2.0 in the non-elided form must be re-exported. See
> [Byte format](#byte-format).

> **Breaking change in 0.2.0.** The verification key input is the **full**
> bincode-serialized `DTVerifyingKey` (2368 bytes), not the 32-byte digest used
> by 0.1.x. Native-recursion verification requires the complete key, so
> digest-only input is rejected.

> **Performance.** 0.3.0 embeds the fixed L4 verifier and reuses it across
> calls. The module shrank from ~15 MB to ~3.2 MB, and verification dropped from
> tens of seconds to tens of milliseconds. `main()` now performs the one-time L4
> setup (~3.7 s) and **throws** if that setup fails, so call it once per worker
> and keep the module alive. See [Performance](#performance).

## Usage

### Installation

```bash
npm install @ethproofs/zkdtvm-wasm-stark-verifier
```

### React Integration

```typescript
import init, { main, verify_stark } from '@ethproofs/zkdtvm-wasm-stark-verifier';

await init(); // Load & compile WASM (if needed)
main(); // One-time L4 setup (~3.7 s); throws if setup fails

// Verify a proof — fast, and reuses the state main() built
const isValid = verify_stark(proofBytes, vkBytes);
```

Run this in a worker. `main()` is slow and blocking; `verify_stark` afterwards
is not.

### Node.js Usage

```javascript
const { main, verify_stark } = require('@ethproofs/zkdtvm-wasm-stark-verifier');

// The Node.js version loads the WASM module automatically

main(); // One-time L4 setup (~3.7 s); throws if setup fails
const result = verify_stark(proofBytes, vkBytes);
```

### Byte format

- **`proof`** — `bincode::serialize(compressed_proof)`, a `DTReduceProof<RootSC>`,
  in the **elided** form. The fixed L4 preprocessing opening is supplied by the
  verifier, not the proof; a proof that still contains it is rejected.
- **`vk`** — `bincode::serialize(vk)`, the full `DTVerifyingKey` struct (the
  program/core VK). The fixed L4 machine, program and VK are embedded in the
  WASM package and are not API inputs.

Malformed bytes, a mismatched program VK, a mismatched fixed L4 VK, an invalid
proof, and a non-elided proof all fail closed.

## Performance

Measured on an M-series Mac against `fixtures/example_1` (254,530-byte proof,
2,368-byte VK):

| Runtime | One-time `main()` | Verify (first) | Verify (subsequent) |
| ------- | ----------------- | -------------- | ------------------- |
| Chrome (worker, `pkg-web/`) | ~3.7 s | ~47 ms | ~47 ms |
| Node 20 (`pkg-node/`) | ~3.7 s | ~43 ms | ~13 ms |

For comparison, 0.2.0 verified the same fixture in ~19 s under Chrome and
~44.5 s under Node 20. The `.wasm` is ~3.2 MB (was ~15 MB), so cache it.

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
