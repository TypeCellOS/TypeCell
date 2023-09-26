/* eslint-disable @typescript-eslint/no-unused-vars */
import { it } from "vitest";
import { getFileFromGithub, getTemplateTree } from "./github";
/**
 * @vitest-environment jsdom
 */

const timeout = 20000;

const targetRepo = {
  owner: "yousefed",
  repo: "reactive",
};

it.skip(
  "creates commit",
  async () => {
    const tree = await getTemplateTree();
    // const treeCopy = await copyTree(templateRepo, targetRepo, tree.data.tree, []);
    // await commit(targetRepo, treeCopy);
  },
  timeout
);

it.skip(
  "read file",
  async () => {
    const target = {
      owner: "yousefed",
      repo: "reactive",
      path: "README.md",
    };
    const file = await getFileFromGithub(target);
    console.log(file);

    // const treeCopy = await copyTree(templateRepo, targetRepo, tree.data.tree, []);
    // await commit(targetRepo, treeCopy);
  },
  timeout
);
