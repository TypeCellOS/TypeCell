import * as octokit from "octokit";
import { Identifier } from "../identifiers/Identifier";
import { CellModel } from "../models/CellModel";
import { DocConnection } from "../store/DocConnection";

import { decodeBase64UTF8 } from "../util/base64";

type RepoOptions = {
  owner: string;
  repo: string;
};
export const githubClient = new octokit.Octokit({
  auth: "",
});

export const templateRepo = {
  owner: "yousefed",
  repo: "typecell-package",
};

export async function copyTree(
  repo: RepoOptions,
  targetRepo: RepoOptions,
  treeData: any[],
  cells: CellModel[],
  dirName: string = "root"
) {
  // TODO: maybe use repos.getContent(), probably faster
  let children = await Promise.all(
    treeData
      .map(async (entry) => {
        const newEntry: any = {
          path: entry.path,
          mode: entry.mode,
          type: entry.type,
        };
        if (entry.mode !== "040000") {
          // directory
          const blob = await githubClient.rest.git.getBlob({
            ...repo,
            file_sha: entry.sha,
          });
          const newBlob = await githubClient.rest.git.createBlob({
            ...targetRepo,
            file_sha: entry.sha,
            content: blob.data.content,
            encoding: blob.data.encoding,
          });
          // newEntry.content = blob.data.content;
          // newEntry.encoding = blob.data.encoding;
          newEntry.sha = newBlob.data.sha;
        } else {
          const subTree = await githubClient.rest.git.getTree({
            ...repo,
            tree_sha: entry.sha,
          });
          const subTreeCopied = await copyTree(
            repo,
            targetRepo,
            subTree.data.tree,
            cells,
            newEntry.path
          );
          newEntry.sha = subTreeCopied.data.sha;
        }
        return newEntry;
      })
      .filter((f) => f)
  );

  const fileNames = cells.map((c, i) => {
    const name = "c" + (i + "").padStart(2, "0") + "_" + c.id;
    return {
      name,
      path: name + "." + c.extension,
    };
  });
  if (dirName === "types") {
    const index = children.find((c) => c.path === "index.ts");
    delete index.sha;
    const imports = cells
      .map((c, i) => {
        if (c.language !== "typescript") {
          return "";
        }
        return `
    import type * as fc${c.id} from "../src/${fileNames[i].name}";`;
      })
      .join("");

    const contents = cells
      .map((c) => {
        if (c.language !== "typescript") {
          return "";
        }
        return `
    type tc${c.id} = Omit<typeof fc${c.id}, "default">;
    export interface IContext extends tc${c.id} {}`;
      })
      .join("\n");

    index.content = `
    // this is a .ts file so it gets copied to the build folder

    ${imports}
    ${contents}`;
  }

  if (dirName === "src" && children.find((c) => c.path === "c1.ts")) {
    children = children.filter((p) => p.path !== "c1.ts" && p.path !== "c2.ts");
    cells.forEach((c, i) => {
      const content =
        c.language === "typescript"
          ? `import * as React from "react";\n` + c.code.toJSON()
          : c.code.toJSON();
      children.push({
        path: fileNames[i].path,
        mode: "100644",
        type: "blob",
        content,
      });
    });
  }
  const created = await githubClient.rest.git.createTree({
    ...targetRepo,
    tree: children,
  });
  console.log("created", children);
  return created;
}

export async function commit(repoOptions: RepoOptions, tree: any) {
  // await oc.rest.repos.createOrUpdateFileContents({
  //   ...repoOptions,
  //   path: "initial.txt",
  //   branch: "master",
  //   message: "Create a dummy file for the sake of creating a branch",
  //   content: "ZHVtbXk=",
  // });
  // const treeData = [
  //   {
  //     content: "hello2",
  //     path: "test2.txt",
  //     mode: "100644",
  //   },
  // ],

  const commit = await githubClient.rest.git.createCommit({
    ...repoOptions,
    message: "test",
    tree: tree.data.sha,
    // parents: ["5ba6486f8d48f29ce5f186294da35728d7a38813"],
  });

  // await githubClient.rest.git.createRef({
  //   ...repoOptions,
  //   ref: "refs/heads/typecell",
  //   sha: commit.data.sha,
  // });

  await githubClient.rest.git.updateRef({
    ...repoOptions,
    ref: "heads/typecell",
    sha: commit.data.sha,
    force: true, // TODO: set to false and use parents[] in commit
  });
}

export async function getTemplateTree() {
  const ref = await githubClient.rest.git.getRef({
    ...templateRepo,
    ref: "heads/main",
  });

  const commit = await githubClient.rest.git.getCommit({
    ...templateRepo,
    commit_sha: ref.data.object.sha,
  });

  const tree = await githubClient.rest.git.getTree({
    ...templateRepo,
    tree_sha: commit.data.tree.sha,
  });
  return tree;
}

export async function saveDocumentToGithub(id: Identifier) {
  const targetRepo = {
    owner: "yousefed",
    repo: "testrep",
  };

  const dc = DocConnection.load(id);
  const doc = await dc.waitForDoc();
  const template = await getTemplateTree();

  const copy = await copyTree(
    templateRepo,
    targetRepo,
    template.data.tree,
    doc.doc.cells
  );
  await commit(targetRepo, copy);
  return template;
}

export async function getFileFromGithub(file: {
  repo: string;
  owner: string;
  path: string;
}) {
  const githubClient = new octokit.Octokit();
  const ret = await githubClient.rest.repos.getContent(file);
  return decodeBase64UTF8((ret.data as any).content);
}

/*
- react types
- react import
- export markdown cells
- types for imported modules
- imported modules to package
- typecell helpers

*/
