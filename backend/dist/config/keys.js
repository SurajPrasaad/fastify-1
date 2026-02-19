import crypto from "crypto";
// Mock Key Manager (Replace with KMS in production)
// Generating logic here ensures consistent keys across imports in the same process
export const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
//# sourceMappingURL=keys.js.map