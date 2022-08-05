import { Buffer } from "buffer";

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

/**
 * Encode a typed array of uint8 as base64.
 * @param {Uint8Array} uint8Array The data to encode.
 * @return {string} The base64.
 */
export function encodeBase64(uint8Array: Uint8Array | ArrayBuffer) {
  return Buffer.from(uint8Array).toString("base64");
}

/**
 * Encode a typed array of uint8 as unpadded base64.
 * @param {Uint8Array} uint8Array The data to encode.
 * @return {string} The unpadded base64.
 */
export function encodeUnpaddedBase64(uint8Array: Uint8Array | ArrayBuffer) {
  return encodeBase64(uint8Array).replace(/=+$/g, "");
}
