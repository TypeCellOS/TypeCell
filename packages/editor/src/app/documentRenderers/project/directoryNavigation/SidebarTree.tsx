import Button from "@atlaskit/button";
import Tree, { ItemId, mutateTree, RenderItemParams } from "@atlaskit/tree";
import _ from "lodash";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";
import styles from "./SidebarTree.module.css";
import { treeToTreeData } from "./treeDataUtil";
import { TreeNode } from "./treeNodeUtil";

const RenderItem =
  (onClick: (item: string) => void) =>
  ({ item, onExpand, onCollapse, provided, depth }: RenderItemParams) => {
    const onClickHandler = () => {
      // main item has clicked (not chevron, always call onExpand)
      onExpand(item.id);
      onClick(item.id + "");
    };

    const onChevronClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.isExpanded) {
        onCollapse(item.id);
      } else {
        onExpand(item.id);
      }
    };

    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}>
        <Button
          className={styles.sidebarButton}
          component="div"
          style={{
            paddingLeft: 2 + 15 * depth,
          }}
          onClick={onClickHandler}
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
              <div
                className={styles.chevron}
                style={{ visibility: "hidden" }}
              />
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

    const onExpand = (id: ItemId) => {
      const mutated = mutateTree(akTree, id, { isExpanded: true });
      setAktree(mutated);
    };

    const onCollapse = (id: ItemId) => {
      setAktree(mutateTree(akTree, id, { isExpanded: false }));
    };

    const renderItem = useMemo(
      () => RenderItem(props.onClick),
      [props.onClick]
    );

    return (
      <Tree
        tree={akTree}
        renderItem={renderItem}
        onExpand={onExpand as any}
        onCollapse={onCollapse as any}
        // onDragStart={() => {}}
        // onDragEnd={() => {}}
        offsetPerLevel={0}
        // isDragEnabled
        isNestingEnabled
      />
    );
  }
);

export default SidebarTree;
