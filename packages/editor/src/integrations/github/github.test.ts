/* eslint-disable @typescript-eslint/no-unused-vars */
import { getFileFromGithub, getTemplateTree } from "./github";
jest.setTimeout(20000);

const targetRepo = {
  owner: "yousefed",
  repo: "reactive",
};

it.skip("creates commit", async () => {
  const tree = await getTemplateTree();
  // const treeCopy = await copyTree(templateRepo, targetRepo, tree.data.tree, []);
  // await commit(targetRepo, treeCopy);
});

it.skip("read file", async () => {
  const target = {
    owner: "yousefed",
    repo: "reactive",
    path: "README.md",
  };
  const file = await getFileFromGithub(target);
  console.log(file);

  // const treeCopy = await copyTree(templateRepo, targetRepo, tree.data.tree, []);
  // await commit(targetRepo, treeCopy);
});
