// import * as octokit from "octokit";
import { CellModel } from "../../models/CellModel";

import { base64 } from "@typecell-org/util";

type ParentCommit = {
  version: string | undefined;
  commitSHA: string;
  defaultBranch: string;
};

type RepoOptions = {
  owner: string;
  repo: string;
};

// TODO: octokit is unmaintained and not compatible with ESM. If we need GH integration we should use / build a different lib
export const githubClient = "" as any; /*new octokit.Octokit({
  auth: "",
});*/

export const templateRepo = {
  owner: "yousefed",
  repo: "typecell-package",
};

export async function copyTree(
  repo: RepoOptions,
  targetRepo: RepoOptions,
  treeData: any[],
  cells: CellModel[],
  version: string,
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
          // file
          const blob = await githubClient.rest.git.getBlob({
            ...repo,
            file_sha: entry.sha,
          });

          if (entry.path === "package.json") {
            // add version and name

            let content = JSON.parse(
              base64.decodeBase64UTF8(blob.data.content)
            );
            content.name = "@" + targetRepo.owner + "/" + targetRepo.repo;
            content.version = version;
            content.description = "Notebook " + content.name;
            newEntry.content = JSON.stringify(content, undefined, 2);
            // newEntry.encoding = blob.data.encoding;
          } else if (entry.path === "README.md" && dirName === "root") {
            newEntry.content =
              "# Notebook " + targetRepo.owner + "/" + targetRepo.repo;
          } else {
            const newBlob = await githubClient.rest.git.createBlob({
              ...targetRepo,
              file_sha: entry.sha,
              content: blob.data.content,
              encoding: blob.data.encoding,
            });
            newEntry.sha = newBlob.data.sha;
          }
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
            version,
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

  if (dirName === "src" && children.find((c) => c.path === "c1.tsx")) {
    children = children.filter(
      (p) => p.path !== "c1.tsx" && p.path !== "c2.tsx"
    );
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

export async function commit(
  repoOptions: RepoOptions,
  tree: any,
  branch: string,
  parent?: string
) {
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
    message: "export " + branch,
    tree: tree.data.sha,
    parents: parent ? [parent] : undefined,
  });

  await githubClient.rest.git.createRef({
    ...repoOptions,
    ref: "refs/heads/" + branch,
    sha: commit.data.sha,
  });
  // await githubClient.rest.git.updateRef({
  //   ...repoOptions,
  //   ref: "heads/" + branch,
  //   sha: commit.data.sha,
  // });
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

export async function getTargetInfo(repo: RepoOptions): Promise<ParentCommit> {
  const repoInfo = await githubClient.rest.repos.get(repo);
  const defaultBranch = repoInfo.data.default_branch;

  const branchInfo = await githubClient.rest.git.getRef({
    ...repo,
    ref: "heads/" + defaultBranch,
  });

  let version: string | undefined;
  try {
    const packageJSON = await getFileFromGithub({
      ...repo,
      path: "package.json",
    });
    version = JSON.parse(packageJSON).version;
  } catch (e) {
    // TODO: only catch 404
  }

  return {
    version,
    defaultBranch,
    commitSHA: branchInfo.data.object.sha,
  };
  // branchInfo.data.object.sha
  // return {repoInfo.data.default_branch;
}

// export async function saveDocumentToGithub(id: Identifier) {
//   const targetRepo = {
//     owner: "yousefed",
//     repo: "testrep",
//   };

//   const dc = DocConnection.load(id);
//   const doc = await dc.waitForDoc();
//   const template = await getTemplateTree();

//   const targetInfo = await getTargetInfo(targetRepo);

//   let newVersion = "1.0.0";
//   if (targetInfo.version) {
//     let versionBumped = inc(targetInfo.version, "minor");
//     if (!versionBumped) {
//       throw new Error("couldn't parse version");
//     }
//     newVersion = versionBumped;
//   }
//   const copy = await copyTree(
//     templateRepo,
//     targetRepo,
//     template.data.tree,
//     doc.doc.cells,
//     newVersion
//   );

//   let branch: string = await getUnusedBranch(targetRepo, "v" + newVersion);

//   await commit(targetRepo, copy, branch, targetInfo.commitSHA);

//   await githubClient.rest.pulls.create({
//     ...targetRepo,
//     head: branch,
//     base: targetInfo.defaultBranch,
//     title: branch,
//   });

//   return template;
// }

export async function getUnusedBranch(repo: RepoOptions, branch: string) {
  let tryN = 1;
  let branchToTry = "";
  while (true) {
    try {
      branchToTry = branch + (tryN > 1 ? "-" + (tryN + 1) : "");
      await githubClient.rest.git.getRef({
        ...repo,
        ref: "heads/" + branchToTry,
      });

      tryN++;
    } catch (e: any) {
      if (e.status !== 404) {
        throw e;
      }
      // not found, so we're good with this "branch" name
      return branchToTry;
    }
  }
}

export async function getFileFromGithub(file: {
  repo: string;
  owner: string;
  path: string;
}) {
  const object = await getFileOrDirFromGithub(file);
  if (object === "not-found" || object.type === "directory") {
    throw new Error("not a file returned");
  }
  return object.data;
}

export async function getTreeFromGithub(dir: {
  repo: string;
  owner: string;
  tree_sha: string;
  recursive?: boolean;
}) {
  const ret = await githubClient.rest.git.getTree({
    ...dir,
    recursive: dir.recursive ? "true" : undefined,
  });
  return ret.data.tree;
}

export async function getFileOrDirFromGithub(file: {
  repo: string;
  owner: string;
  path: string;
}) {
  // const githubClient = new octokit.Octokit();
  try {
    const ret = await githubClient.rest.repos.getContent(file);

    if (Array.isArray(ret.data)) {
      // if we're requesting the root of a repository (empty file.path), the etag works as tree_sha for the required path
      let tree_sha = ret.headers.etag!.match(/W\/"(.*)"/)![1];

      if (file.path) {
        // we're requesting a subdirectory. Unfortunately, we need to list the contents of the parentdirectory in
        // order to get the tree_sha of the subdirectory
        // (TODO: maybe check on github forums if there's an easier way, imo getContents should return the tree_sha of the requested dir)
        const parent = file.path.split("/");
        parent.pop();

        const parentContent = await githubClient.rest.repos.getContent({
          ...file,
          path: parent.join("/"),
        });
        if (!Array.isArray(parentContent.data)) {
          throw new Error("expected directory");
        }
        const directory = parentContent.data.find(
          (el: any) => el.path === file.path
        )!;
        if (directory.type !== "dir") {
          throw new Error("expected to find directory");
        }
        tree_sha = directory!.sha;
      }
      const tree = await getTreeFromGithub({
        ...file,
        tree_sha,
        recursive: true,
      });
      return {
        type: "directory" as "directory",
        tree,
      };
    } else if (ret.data.type === "file") {
      return {
        type: "file" as "file",
        data: base64.decodeBase64UTF8((ret.data as any).content),
      };
    } else {
      throw new Error("unknown github response");
    }
  } catch (e: any) {
    if (e.status === 404) {
      return "not-found";
    }
    throw e;
  }
}

/*
- react types
- react import
- export markdown cells
- types for imported modules
- imported modules to package
- typecell helpers

*/
