import { DocConnection } from "../store/DocConnection";
import * as octokit from "octokit";

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
  treeData: any[]
) {
  // TODO: maybe use repos.getContent(), probably faster
  const children = await Promise.all(
    treeData.map(async (entry) => {
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
          subTree.data.tree
        );
        newEntry.sha = subTreeCopied.data.sha;
      }
      return newEntry;
    })
  );

  const created = await githubClient.rest.git.createTree({
    ...targetRepo,
    tree: children,
  });
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

export async function getGithubTree(owner: string, document: string) {
  const dc = DocConnection.load({ owner, document });
  const doc = await dc.waitForDoc();
  const template = await getTemplateTree();
  return template;
}
