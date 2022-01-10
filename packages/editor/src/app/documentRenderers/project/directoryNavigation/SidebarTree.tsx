import Button from "@atlaskit/button";
import Tree, { ItemId, mutateTree, RenderItemParams } from "@atlaskit/tree";
import _ from "lodash";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useState } from "react";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";
import styles from "./SidebarTree.module.css";
import { treeToTreeData } from "./treeDataUtil";
import { TreeNode } from "./treeNodeUtil";

const RenderItem = ({
  item,
  onExpand,
  onCollapse,
  provided,
  depth,
}: RenderItemParams) => {
  const onClick = () => {
    // main item has clicked (not chevron, always call onExpand)
    (onExpand as any)({ id: item.id, isChevron: false });
  };

  const onChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isExpanded) {
      (onCollapse as any)({ id: item.id, isChevron: true });
    } else {
      (onExpand as any)({ id: item.id, isChevron: true });
    }
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}>
      <Button
        className={styles.sidebarButton}
        style={{
          paddingLeft: 2 + 15 * depth,
        }}
        onClick={onClick}
        appearance="subtle"
        iconBefore={
          item.hasChildren ? (
            item.isExpanded ? (
              <VscChevronDown
                onClick={onChevronClick}
                className={styles.chevron}
                title=""
              />
            ) : (
              <VscChevronRight
                onClick={onChevronClick}
                className={styles.chevron}
                title=""
              />
            )
          ) : (
            <div className={styles.chevron} style={{ visibility: "hidden" }} />
          )
        }>
        {item.data ? item.data.title : ""}
      </Button>
    </div>
  );
};

export const SidebarTree = observer(
  (props: { tree: TreeNode[]; onClick: (item: string) => void }) => {
    const [akTree, setAktree] = useState(() => treeToTreeData(props.tree));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const update = useCallback(
      _.debounce(
        (tree: TreeNode[]) => {
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

    useEffect(() => {
      update(props.tree);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.tree]);

    const onExpand = (info: { id: ItemId; isChevron: boolean }) => {
      setAktree(mutateTree(akTree, info.id, { isExpanded: true }));
      const item = akTree.items[info.id];

      if (!info.isChevron) {
        props.onClick(item.data!.path);
      }
    };

    const onCollapse = (info: { id: ItemId; isChevron: boolean }) => {
      setAktree(mutateTree(akTree, info.id, { isExpanded: false }));
      const item = akTree.items[info.id];

      if (!info.isChevron) {
        props.onClick(item.data!.path);
      }
    };

    return (
      <Tree
        tree={akTree}
        renderItem={RenderItem}
        onExpand={onExpand as any}
        onCollapse={onCollapse as any}
        // onDragEnd={this.onDragEnd}
        offsetPerLevel={0}
        isDragEnabled={false}
      />
    );
  }
);

export default SidebarTree;
