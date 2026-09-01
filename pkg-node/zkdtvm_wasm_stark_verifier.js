const dt = require('./dt_wasm_verifier.js');

function main() {
    dt.initVerifierRuntime();
}

function verify_stark(proof_bytes, vk_bytes) {
    return dt.verifyCompressedOk(proof_bytes, vk_bytes);
}

exports.main = main;
exports.verify_stark = verify_stark;
