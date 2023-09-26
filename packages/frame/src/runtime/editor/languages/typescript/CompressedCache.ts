import * as localForage from "localforage";
import lzstring from "lz-string";
import { compress, decompress } from "./compress";

const SUPPORTS_COMPRESSIONSTREAM = "CompressionStream" in window;

export class CompressedCache {
  constructor(private readonly cacheTimeout: number = 604800000 /* 1 week*/) {}

  async getItem(key: string): Promise<string | undefined> {
    const cached = await localForage.getItem<{
      date: string;
      format: string;
      data: string | ArrayBuffer
    }>(key);
    if (!cached) {
      return undefined;
    }

    // const [dateString, format, text] = cached.split("-=-^-=-");
    const cachedDate = new Date(cached.date);
    const now = new Date();

    if (now.getTime() - cachedDate.getTime() > this.cacheTimeout) {
      // timed out
      return undefined;
    }
    if (cached.format === "lz") {
      return lzstring.decompressFromUTF16(cached.data as string);
    }

    if (cached.format === "csgzip" && SUPPORTS_COMPRESSIONSTREAM) {
      const dc = await decompress(cached.data as ArrayBuffer)
      return dc;
    }
    return undefined;
  }

  async setItem(key: string, value: string) {
    const now = new Date();

    let compressed: string | ArrayBuffer;
    let format: string;

    if (SUPPORTS_COMPRESSIONSTREAM) {
      format = "csgzip";
      compressed = 
        await compress(value)
      
    } else {
      format = "lz";
      compressed = lzstring.compressToUTF16(value);
    }

    const cacheContent = {
      date: now.toISOString(),
      format,
      data: compressed
    }

    localForage.setItem(key, cacheContent);
  }
}
