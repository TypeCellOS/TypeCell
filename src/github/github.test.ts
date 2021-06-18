import { commit, copyTree, getTemplateTree, templateRepo } from "./github";

jest.setTimeout(20000);

const targetRepo = {
  owner: "yousefed",
  repo: "testrep",
};

it("creates commit", async () => {
  const tree = await getTemplateTree();
  const treeCopy = await copyTree(templateRepo, targetRepo, tree.data.tree, []);
  await commit(targetRepo, treeCopy);
});
