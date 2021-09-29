import Button from "@atlaskit/button";
import Tree, {
  ItemId,
  mutateTree,
  RenderItemParams,
  TreeData,
} from "@atlaskit/tree";
import _ from "lodash";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { VscChevronDown, VscChevronRight, VscFile } from "react-icons/vsc";
import { filesToTreeNodes, TreeNode } from "./treeUtil";

// const onExpand = (itemId: ItemId) => {
// const { tree }: State = this.state;
// this.setState({
//   tree: mutateTree(tree, itemId, { isExpanded: true }),
// });
// };

// const onCollapse = (itemId: ItemId) => {
// const { tree }: State = this.state;
// this.setState({
//   tree: mutateTree(tree, itemId, { isExpanded: false }),
// });
// };

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
};
const renderItem = ({
  item,
  onExpand,
  onCollapse,
  provided,
  depth,
}: RenderItemParams) => {
  console.log("render");
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}>
      <Button
        style={{
          width: "100%",
          textAlign: "left",
          paddingLeft: 5 + 15 * depth,
          fontWeight: "normal",
          fontSize: "13px",
          height: "2.1em",
        }}
        onClick={() =>
          item.isExpanded ? onCollapse(item.id) : onExpand(item.id)
        }
        appearance="subtle"
        iconBefore={
          item.hasChildren ? (
            item.isExpanded ? (
              <VscChevronDown
                style={{ width: "10px", height: "10px" }}
                title=""
              />
            ) : (
              <VscChevronRight
                style={{ width: "10px", height: "10px" }}
                title=""
              />
            )
          ) : (
            <VscFile
              style={{ visibility: "hidden", width: "10px", height: "10px" }}
              title=""
            />
          )
        }>
        {item.data ? item.data.title : ""}
      </Button>
    </div>
  );
};

function treeToTreeData(tree: TreeNode[]) {
  tree.sort(sortTreeItems);
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
  function sortTreeItems(a: TreeNode, b: TreeNode) {
    if (a.isDirectory && !b.isDirectory) {
      return -1;
    } else if (b.isDirectory && !a.isDirectory) {
      return 1;
    }
    return a.fileName.localeCompare(b.fileName);
  }

  function processTree(parent: string, tree: TreeNode[]) {
    for (let child of tree) {
      child.children.sort(sortTreeItems);
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
export const SidebarTree = observer(
  (props: { fileSet: string[]; onClick: (item: string) => void }) => {
    const [akTree, setAktree] = useState(() => {
      const tree = filesToTreeNodes(
        props.fileSet.map((f) => ({
          fileName: f,
        }))
      );

      return treeToTreeData(tree);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const update = useCallback(
      _.debounce(
        (fileSet: string[]) => {
          console.log("call ", fileSet);
          const tree = filesToTreeNodes(
            fileSet.map((f) => ({
              fileName: f,
            }))
          );

          const newTree = treeToTreeData(tree);
          for (let item of Object.keys(newTree.items)) {
            if (akTree.items[item]) {
              newTree.items[item].isExpanded = akTree.items[item].isExpanded;
            }
          }
          setAktree(newTree);
        },
        100,
        { trailing: true }
      ),
      [akTree]
    );

    // TODO: not efficient, debounce or optimize further?
    useEffect(() => {
      console.log("debounce ", props.fileSet);
      update(props.fileSet);
    }, [props.fileSet, update]);

    const onExpand = (itemId: ItemId) => {
      setAktree(mutateTree(akTree, itemId, { isExpanded: true }));
      const item = akTree.items[itemId];
      if (!item.hasChildren) {
        // file, not a directory
        props.onClick(item.data!.path);
      }
    };

    const onCollapse = (itemId: ItemId) => {
      setAktree(mutateTree(akTree, itemId, { isExpanded: false }));
      const item = akTree.items[itemId];
      if (!item.hasChildren) {
        // file, not a directory
        props.onClick(item.data!.path);
      }
    };

    return (
      <Tree
        tree={akTree}
        renderItem={renderItem}
        onExpand={onExpand}
        onCollapse={onCollapse}
        // onDragEnd={this.onDragEnd}
        offsetPerLevel={0}
        isDragEnabled={false}
      />
    );
  }
);

export default SidebarTree;
