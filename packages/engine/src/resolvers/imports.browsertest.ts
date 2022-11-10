import { SkypackResolver } from "./cdns/SkypackResolver.js";
import { ImportShimResolver } from "./ImportShimResolver.js";
import { LocalModuleResolver } from "./LocalModuleResolver.js";

import { expect } from "chai";

const localResolver = new LocalModuleResolver(async (moduleName) => {
  if (moduleName === "react") {
    return "fakereact";
  }
  return undefined;
});

const resolvers: any[] = [new SkypackResolver()];
const resolver = new ImportShimResolver(resolvers, localResolver);

describe("import tests", () => {
  it("directly importing a local module", async () => {
    const ret = await resolver.resolveImport("react");
    expect(ret.module).to.equal("fakereact");
  });

  it("directly importing a module", async () => {
    const ret = await resolver.resolveImport("lodash");
    expect(ret.module.chunk(["a", "b", "c", "d"], 2)).to.deep.equal([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});
