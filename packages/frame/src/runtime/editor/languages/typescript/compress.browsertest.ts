import { expect } from "chai";
import { compress, decompress } from "./compress";

it("compresses / decompressess", async () => {
  const str = "hello world ấɖḯƥĭṩčįɳġ ḝłįʈ 🥳";
  const compressed = await compress(new Blob([str], { type: "text/plain" }));
  const decompressed = await (await decompress(compressed)).text();
  expect(decompressed).to.eq(str);
});
