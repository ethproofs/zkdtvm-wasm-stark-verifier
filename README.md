# zkDTVM Wasm Stark Verifier

WebAssembly bindings for the zkDTVM STARK verifier.

## Overview

This module provides WebAssembly bindings for the zkDTVM STARK verifier, enabling proof verification to run directly in both web browsers and Node.js environments.

| Component        | Version |
| ---------------- | ------- |
| zkdtvm           | v0.8.0  |
| Verifier backend | [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `v0.8.0` tag |

> **Breaking change in 0.2.0.** The verification key input is now the **full**
> bincode-serialized `DTVerifyingKey` (2368 bytes), not the 32-byte digest used
> by 0.1.x. Native-recursion verification requires the complete key, so
> digest-only input is rejected. See [Byte format](#byte-format).

> **Also note:** v0.8.0 performs full native-recursion verification. The module
> grew from ~1.4 MB to ~15 MB, and a single verification takes ~19 s in Chrome
> and ~45 s under Node 20 (M-series Mac), versus ~165 ms on 0.1.x. Run
> `verify_stark` in a worker so it does not block the UI thread.

## Usage

### Installation

```bash
npm install @ethproofs/zkdtvm-wasm-stark-verifier
```

### React Integration

```typescript
import init, { main, verify_stark } from '@ethproofs/zkdtvm-wasm-stark-verifier';

await init(); // Initialize WASM (if needed)
main(); // Initialize panic hook

// Verify a proof
const isValid = verify_stark(proofBytes, vkBytes);
```

### Node.js Usage

```javascript
const { main, verify_stark } = require('@ethproofs/zkdtvm-wasm-stark-verifier');

// The Node.js version initializes automatically

main(); // Initialize panic hook
const result = verify_stark(proofBytes, vkBytes);
```

### Byte format

- **`proof`** — `bincode::serialize(compressed_proof)`, a `DTReduceProof<RootSC>`.
- **`vk`** — `bincode::serialize(vk)`, the full `DTVerifyingKey` struct.

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
