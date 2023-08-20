/* eslint-disable @typescript-eslint/ban-ts-comment */
export function compress(blob: Blob) {
  const compressedReadableStream = blob
    .stream()
    // @ts-ignore
    .pipeThrough(new CompressionStream("deflate"));
  return new Response(compressedReadableStream).blob();
}

export async function decompress(blob: Blob) {
  // @ts-ignore
  const ds = new DecompressionStream("deflate");
  const decompressedStream = blob.stream().pipeThrough(ds);
  return new Response(decompressedStream).blob();
}
