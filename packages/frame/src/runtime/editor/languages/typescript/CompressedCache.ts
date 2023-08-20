import lzstring from "lz-string";
import { compress, decompress } from "./compress";

const SUPPORTS_COMPRESSIONSTREAM = "CompressionStream" in window;
const SEPARATOR = "-=-^-=-";

export class CompressedCache {
  constructor(private readonly cacheTimeout: number = 604800000 /* 1 week*/) {}

  async getItem(key: string): Promise<string | undefined> {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return undefined;
    }

    const [dateString, format, text] = cached.split("-=-^-=-");
    const cachedDate = new Date(dateString);
    const now = new Date();

    if (now.getTime() - cachedDate.getTime() > this.cacheTimeout) {
      // timed out
      return undefined;
    }
    if (format === "lz") {
      return lzstring.decompressFromUTF16(text);
    }

    if (format === "csgzip" && SUPPORTS_COMPRESSIONSTREAM) {
      return (
        await decompress(new Blob([text], { type: "text/plain" }))
      ).text();
    }
    return undefined;
  }

  async setItem(key: string, value: string) {
    const now = new Date();

    let compressed: string;
    let format: string;

    if (SUPPORTS_COMPRESSIONSTREAM) {
      format = "csgzip";
      compressed = await (
        await compress(new Blob([value], { type: "text/plain" }))
      ).text();
    } else {
      format = "lz";
      compressed = lzstring.compressToUTF16(value);
    }

    const cacheContent = `${now.toISOString()}${SEPARATOR}${format}${SEPARATOR}${compressed}`;
    localStorage.setItem(key, cacheContent);
  }
}
