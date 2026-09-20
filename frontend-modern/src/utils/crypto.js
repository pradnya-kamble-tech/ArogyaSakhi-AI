const ENC_ALGO = 'AES-GCM';
const HASH_ALGO = 'SHA-256';

export async function deriveKey(pin, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
    );

    const salt = saltHex
        ? new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
        : crypto.getRandomValues(new Uint8Array(16));

    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: HASH_ALGO },
        keyMaterial,
        { name: ENC_ALGO, length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    return {
        key,
        saltHex: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
    };
}

export async function encryptData(key, data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encryptedBuf = await crypto.subtle.encrypt(
        { name: ENC_ALGO, iv }, key, enc.encode(JSON.stringify(data))
    );

    return {
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuf)))
    };
}

export async function decryptData(key, ivHex, ciphertextB64) {
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(atob(ciphertextB64).split('').map(c => c.charCodeAt(0)));
    const decBuf = await crypto.subtle.decrypt({ name: ENC_ALGO, iv }, key, ciphertext);
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decBuf));
}
