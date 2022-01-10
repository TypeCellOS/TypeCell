import { TreeData } from "@atlaskit/tree";
import { TreeNode } from "./treeNodeUtil";

/**
 * Convert a TreeNode[] tree to Atlaskit TreeData format
 */
export function treeToTreeData(tree: TreeNode[]) {
  // tree.sort(sortTreeItems);
  const ret: TreeData = {
    rootId: "root",
    items: {
      root: {
        id: "root",
        children: tree.map((t) => t.fileName),
        hasChildren: true,
        isExpanded: true,
        isChildrenLoading: false,
        data: {
          title: "root",
        },
      },
    },
  };

  function processTree(parent: string, tree: TreeNode[]) {
    for (let child of tree) {
      // child.children.sort(sortTreeItems);
      const fullName = parent + child.fileName;
      ret.items[fullName] = {
        id: fullName,
        children: child.children.map((t) => fullName + "/" + t.fileName),
        hasChildren: child.children.length ? true : false,
        isExpanded: false,
        isChildrenLoading: false,
        data: {
          title: child.fileName,
          path: fullName,
        },
      };
      processTree(fullName + "/", child.children);
    }
  }
  processTree("", tree);
  //   console.log(ret);
  return ret;
}

/*
Example atlaskit treedata:

export const tree: TreeData = {
  rootId: "1",
  items: {
    "1": {
      id: "1",
      children: ["1-1", "1-2"],
      hasChildren: true,
      isExpanded: true,
      isChildrenLoading: false,
      data: {
        title: "root",
      },
    },
    "1-1": {
      id: "1-1",
      children: ["1-1-1", "1-1-2"],
      hasChildren: true,
      isExpanded: true,
      isChildrenLoading: false,
      data: {
        title: "First parent",
      },
    },
    "1-2": {
      id: "1-2",
      children: ["1-2-1", "1-2-2"],
      hasChildren: true,
      isExpanded: true,
      isChildrenLoading: false,
      data: {
        title: "Second parent",
      },
    },
    "1-1-1": {
      id: "1-1-1",
      children: [],
      hasChildren: false,
      isExpanded: false,
      isChildrenLoading: false,
      data: {
        title: "Child one",
      },
    },
    "1-1-2": {
      id: "1-1-2",
      children: [],
      hasChildren: false,
      isExpanded: false,
      isChildrenLoading: false,
      data: {
        title: "Child two",
      },
    },
    "1-2-1": {
      id: "1-2-1",
      children: [],
      hasChildren: false,
      isExpanded: false,
      isChildrenLoading: false,
      data: {
        title: "Child three",
      },
    },
    "1-2-2": {
      id: "1-2-2",
      children: [],
      hasChildren: false,
      isExpanded: false,
      isChildrenLoading: false,
      data: {
        title: "Child four",
      },
    },
  },
};*/
