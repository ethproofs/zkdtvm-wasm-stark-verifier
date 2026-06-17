import init, { initSync, initVerifierRuntime, verifyCompressedOk } from './dt_wasm_verifier.js';

export function main() {
    initVerifierRuntime();
}

export function verify_stark(proof_bytes, vk_bytes) {
    return verifyCompressedOk(proof_bytes, vk_bytes);
}

export { initSync };
export default init;
