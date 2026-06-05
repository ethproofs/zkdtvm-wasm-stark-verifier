//! WASM surface for `zkdtvm_stark_verifier::verify_compressed_bytes`
//! (compressed reduce proof + core VK digest).
//!
//! Inputs are bincode-serialized byte buffers:
//! - `proof_bytes`: `DTReduceProof<InnerSC>` (carries both the compress-stage VK and the
//!   shard proof).
//! - `vk_bytes`: bincode-serialized `[u32; DIGEST_SIZE]` — the Poseidon2 digest of
//!   the core `DTVerifyingKey` embedded in the proof's public values. Legacy
//!   bincode-serialized `DTVerifyingKey` bytes are also accepted by the backend.

use wasm_bindgen::prelude::*;
use zkdtvm_stark_verifier::verify_compressed_bytes as backend_verify_compressed_bytes;

#[wasm_bindgen(js_name = initVerifierRuntime)]
pub fn init_verifier_runtime() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = verifyCompressedBytes)]
pub fn verify_compressed_bytes(proof_bytes: &[u8], vk_bytes: &[u8]) -> Result<(), JsValue> {
    backend_verify_compressed_bytes(proof_bytes, vk_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen(js_name = verifyCompressedOk)]
pub fn verify_compressed_ok(proof_bytes: &[u8], vk_bytes: &[u8]) -> bool {
    backend_verify_compressed_bytes(proof_bytes, vk_bytes).is_ok()
}
