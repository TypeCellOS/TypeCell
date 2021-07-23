/**
 * Decode a base64 string to a typed array of uint8.
 * @param {string} base64 The base64 to decode.
 * @return {Uint8Array} The decoded data.
 */
export function decodeBase64(base64: string) {
  return Buffer.from(base64, "base64");
}

/**
 * Decode a base64 string to a typed array of uint8.
 * @param {string} base64 The base64 to decode.
 * @return {Uint8Array} The decoded data.
 */
export function decodeBase64UTF8(base64: string) {
  return Buffer.from(base64, "base64").toString("utf-8");
}
