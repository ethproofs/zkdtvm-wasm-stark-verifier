import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { main, verify_stark } from './pkg-node/zkdtvm_wasm_stark_verifier.js';

async function testVerification() {
  console.log('Testing zkDTVM WASM STARK Verifier\n');

  try {
    main();
    console.log('WASM module initialized\n');

    // Load fixtures
    const indexPath = path.join(__dirname, 'fixtures', 'index.json');
    const fixtures = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    console.log(`Running ${fixtures.length} fixture(s):\n`);

    let passed = 0;
    let failed = 0;

    for (const fixture of fixtures) {
      const proofPath = path.join(__dirname, fixture.proof.replace(/^\//, ''));
      const vkPath = path.join(__dirname, fixture.vk.replace(/^\//, ''));

      console.log(`[${fixture.name}]`);

      const proofBytes = fs.readFileSync(proofPath);
      const vkBytes = fs.readFileSync(vkPath);

      console.log(`  Proof size: ${proofBytes.length} bytes`);
      console.log(`  VK size: ${vkBytes.length} bytes`);

      const start = performance.now();
      const result = verify_stark(proofBytes, vkBytes);
      const elapsed = (performance.now() - start).toFixed(2);

      if (result) {
        console.log(`  VALID (${elapsed} ms)`);
        passed++;
      } else {
        console.log(`  INVALID (${elapsed} ms)`);
        failed++;
      }
      console.log('');
    }

    console.log(`Done: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Error during verification:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testVerification();
