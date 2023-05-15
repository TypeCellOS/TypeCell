import { describe, expect, it } from "vitest";
import * as Y from "yjs";

function toHex(arr: Uint8Array) {
  return [...arr].map((x) => x.toString(16).padStart(2, "0") as any).join("");
}

describe("SupabaseHocuspocus hex util tests", () => {
  it("should sync when Alice opens 2 connections", async () => {
    const ydoc = new Y.Doc();
    ydoc.getMap("mymap").set("hello", "world");

    const update = Y.encodeStateAsUpdate(ydoc);

    const hexMethod1 = "\\x" + Buffer.from(update).toString("hex");
    const hexMethod2 = "\\x" + toHex(update);
    expect(hexMethod1).toEqual(hexMethod2);
  });
});
