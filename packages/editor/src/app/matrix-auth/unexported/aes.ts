/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { base64 } from "@typecell-org/util";
import { getCrypto } from "./utils";

const subtleCrypto =
  typeof window !== "undefined" && window.crypto
    ? window.crypto.subtle || (window.crypto as any).webkitSubtle
    : null;

// salt for HKDF, with 8 bytes of zeros
const zerosalt = new Uint8Array(8);

/**
 * encrypt a string in Node.js
 *
 * @param {string} data the plaintext to encrypt
 * @param {Uint8Array} key the encryption key to use
 * @param {string} name the name of the secret
 * @param {string} ivStr the initialization vector to use
 */
async function encryptNode(
  data: string,
  key: Uint8Array,
  name: string,
  ivStr: string
) {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error("No usable crypto implementation");
  }

  let iv;
  if (ivStr) {
    iv = base64.decodeBase64(ivStr);
  } else {
    iv = crypto.randomBytes(16);
  }

  // clear bit 63 of the IV to stop us hitting the 64-bit counter boundary
  // (which would mean we wouldn't be able to decrypt on Android). The loss
  // of a single bit of iv is a price we have to pay.
  iv[8] &= 0x7f;

  const [aesKey, hmacKey] = deriveKeysNode(key, name);

  const cipher = crypto.createCipheriv("aes-256-ctr", aesKey, iv);
  const ciphertext =
    cipher.update(data, "utf-8", "base64") + cipher.final("base64");

  const hmac = crypto
    .createHmac("sha256", hmacKey)
    .update(ciphertext, "base64")
    .digest("base64");

  return {
    iv: base64.encodeBase64(iv),
    ciphertext: ciphertext,
    mac: hmac,
  };
}

/**
 * decrypt a string in Node.js
 *
 * @param {object} data the encrypted data
 * @param {string} data.ciphertext the ciphertext in base64
 * @param {string} data.iv the initialization vector in base64
 * @param {string} data.mac the HMAC in base64
 * @param {Uint8Array} key the encryption key to use
 * @param {string} name the name of the secret
 */
async function decryptNode(data: any, key: Uint8Array, name: string) {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error("No usable crypto implementation");
  }

  const [aesKey, hmacKey] = deriveKeysNode(key, name);

  const hmac = crypto
    .createHmac("sha256", hmacKey)
    .update(data.ciphertext, "base64")
    .digest("base64")
    .replace(/=+$/g, "");

  if (hmac !== data.mac.replace(/=+$/g, "")) {
    throw new Error(`Error decrypting secret ${name}: bad MAC`);
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-ctr",
    aesKey,
    base64.decodeBase64(data.iv)
  );
  return (
    decipher.update(data.ciphertext, "base64", "utf-8") +
    decipher.final("utf-8")
  );
}

function deriveKeysNode(key: Uint8Array, name: string) {
  const crypto = getCrypto();
  const prk = crypto.createHmac("sha256", zerosalt).update(key).digest();

  const b = Buffer.alloc(1, 1);
  const aesKey = crypto
    .createHmac("sha256", prk)
    .update(name, "utf-8")
    .update(b)
    .digest();
  b[0] = 2;
  const hmacKey = crypto
    .createHmac("sha256", prk)
    .update(aesKey)
    .update(name, "utf-8")
    .update(b)
    .digest();

  return [aesKey, hmacKey];
}

/**
 * encrypt a string in Node.js
 *
 * @param {string} data the plaintext to encrypt
 * @param {Uint8Array} key the encryption key to use
 * @param {string} name the name of the secret
 * @param {string} ivStr the initialization vector to use
 */
async function encryptBrowser(
  data: string,
  key: Uint8Array,
  name: string,
  ivStr: string
) {
  let iv;
  if (ivStr) {
    iv = base64.decodeBase64(ivStr);
  } else {
    iv = new Uint8Array(16);
    window.crypto.getRandomValues(iv);
  }

  // clear bit 63 of the IV to stop us hitting the 64-bit counter boundary
  // (which would mean we wouldn't be able to decrypt on Android). The loss
  // of a single bit of iv is a price we have to pay.
  iv[8] &= 0x7f;

  const [aesKey, hmacKey] = await deriveKeysBrowser(key, name);
  const encodedData = new TextEncoder().encode(data);

  const ciphertext = await subtleCrypto!.encrypt(
    {
      name: "AES-CTR",
      counter: iv,
      length: 64,
    },
    aesKey,
    encodedData
  );

  const hmac = await subtleCrypto!.sign({ name: "HMAC" }, hmacKey, ciphertext);

  return {
    iv: base64.encodeBase64(iv),
    ciphertext: base64.encodeBase64(ciphertext),
    mac: base64.encodeBase64(hmac),
  };
}

/**
 * decrypt a string in the browser
 *
 * @param {object} data the encrypted data
 * @param {string} data.ciphertext the ciphertext in base64
 * @param {string} data.iv the initialization vector in base64
 * @param {string} data.mac the HMAC in base64
 * @param {Uint8Array} key the encryption key to use
 * @param {string} name the name of the secret
 */
async function decryptBrowser(data: any, key: Uint8Array, name: string) {
  const [aesKey, hmacKey] = await deriveKeysBrowser(key, name);

  const ciphertext = base64.decodeBase64(data.ciphertext);

  if (
    !(await subtleCrypto!.verify(
      { name: "HMAC" },
      hmacKey,
      base64.decodeBase64(data.mac),
      ciphertext
    ))
  ) {
    throw new Error(`Error decrypting secret ${name}: bad MAC`);
  }

  const plaintext = await subtleCrypto!.decrypt(
    {
      name: "AES-CTR",
      counter: base64.decodeBase64(data.iv),
      length: 64,
    },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(new Uint8Array(plaintext));
}

async function deriveKeysBrowser(key: Uint8Array, name: string) {
  const hkdfkey = await subtleCrypto!.importKey(
    "raw",
    key,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  const keybits = await subtleCrypto!.deriveBits(
    {
      name: "HKDF",
      salt: zerosalt,
      info: new TextEncoder().encode(name),
      hash: "SHA-256",
    },
    hkdfkey,
    512
  );

  const aesKey = keybits.slice(0, 32);
  const hmacKey = keybits.slice(32);

  const aesProm = subtleCrypto!.importKey(
    "raw",
    aesKey,
    { name: "AES-CTR" },
    false,
    ["encrypt", "decrypt"]
  );

  const hmacProm = subtleCrypto!.importKey(
    "raw",
    hmacKey,
    {
      name: "HMAC",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign", "verify"]
  );

  return await Promise.all([aesProm, hmacProm]);
}

export function encryptAES(...args: any) {
  return subtleCrypto
    ? (encryptBrowser as any)(...args)
    : (encryptNode as any)(...args);
}

export function decryptAES(...args: any) {
  return subtleCrypto
    ? (decryptBrowser as any)(...args)
    : (decryptNode as any)(...args);
}
