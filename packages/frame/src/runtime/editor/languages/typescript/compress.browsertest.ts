import { expect } from "chai";
import { compress, decompress } from "./compress";

it("compresses / decompressess", async () => {
  const str = "hello world ấɖḯƥĭṩčįɳġ ḝłįʈ 🥳";
  const compressed = await compress(str);
  const decompressed = await (await decompress(compressed));
  expect(decompressed).to.eq(str);
});
