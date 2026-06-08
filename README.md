# zkDTVM Wasm Stark Verifier

WebAssembly bindings for the zkDTVM STARK verifier.

## Overview

This module provides WebAssembly bindings for the zkDTVM STARK verifier, enabling proof verification to run directly in both web browsers and Node.js environments.

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

## Testing

### Node.js Example

```bash
npm run test:node
```

This runs the Node.js example that loads proof and verification key files from the filesystem and verifies them.

### Browser Example

```bash
npm test
```

This starts a local HTTP server with a browser example that demonstrates:

- Loading the WASM module in a browser environment
- File upload interface for proof and verification key files
- Interactive STARK proof verification
- Performance metrics and detailed logging
- Error handling and user feedback

**Note:** The browser example requires files to be served over HTTP due to WASM CORS restrictions. The included server script handles this automatically.
