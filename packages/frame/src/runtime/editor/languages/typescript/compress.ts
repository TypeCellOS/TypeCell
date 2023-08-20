/* eslint-disable @typescript-eslint/ban-ts-comment */
export async function compress(text: string) {
  const byteArray = new TextEncoder().encode(text)
  // @ts-ignore
  const cs = new CompressionStream("deflate")
  const writer = cs.writable.getWriter()
  writer.write(byteArray)
  writer.close()
  const ret = await new Response(cs.readable).arrayBuffer()
  return ret;
}

export async function decompress(bytes: ArrayBuffer) {
  // @ts-ignore
  const cs = new DecompressionStream("deflate")
  const writer = cs.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const arrayBuffer = await new Response(cs.readable).arrayBuffer()
  return new TextDecoder().decode(arrayBuffer)
}
