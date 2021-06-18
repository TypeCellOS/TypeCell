import * as octokit from "octokit";
const oc = new octokit.Octokit({
  auth: "<key>",
});

const repoOptions = {
  owner: "yousefed",
  repo: "testrep",
};

jest.setTimeout(20000);

export async function commit() {
  // await oc.rest.repos.createOrUpdateFileContents({
  //   ...repoOptions,
  //   path: "initial.txt",
  //   branch: "master",
  //   message: "Create a dummy file for the sake of creating a branch",
  //   content: "ZHVtbXk=",
  // });
  const tree = await oc.rest.git.createTree({
    ...repoOptions,
    tree: [
      {
        content: "hello2",
        path: "test2.txt",
        mode: "100644",
      },
    ],
  });

  const commit = await oc.rest.git.createCommit({
    ...repoOptions,
    message: "test",
    tree: tree.data.sha,
    parents: ["beb3b874d114b15b78c55fe1091dab58ebbd179e"],
  });

  // await oc.rest.git.createRef({
  //   ...repoOptions,
  //   ref: "refs/heads/typecell",
  //   sha: commit.data.sha,
  // });

  await oc.rest.git.updateRef({
    ...repoOptions,
    ref: "heads/typecell",
    sha: commit.data.sha,
  });
}

it("creates commit", async () => {
  await commit();
});
