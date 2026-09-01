import * as wasm from "./dt_wasm_verifier_bg.wasm";
import { __wbg_set_wasm, initVerifierRuntime, verifyCompressedOk } from "./dt_wasm_verifier_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();

export function main() {
    initVerifierRuntime();
}

export function verify_stark(proof_bytes, vk_bytes) {
    return verifyCompressedOk(proof_bytes, vk_bytes);
}
