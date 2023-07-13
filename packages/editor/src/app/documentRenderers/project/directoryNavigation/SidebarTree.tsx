import Button from "@atlaskit/button";
import Tree, {
  ItemId,
  mutateTree,
  RenderItemParams,
  TreeData,
  TreeDestinationPosition,
  TreeSourcePosition,
} from "@atlaskit/tree";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import {
  VscAdd,
  VscChevronDown,
  VscChevronRight,
  VscKebabVertical,
} from "react-icons/vsc";
import { Identifier } from "../../../../identifiers/Identifier";
import { DocConnection } from "../../../../store/DocConnection";
import { SessionStore } from "../../../../store/local/SessionStore";

import { ChildReference } from "@typecell-org/shared";
import styles from "./SidebarTree.module.css";

const RenderItem =
  (
    onClick: (item: Identifier) => void,
    onAddChild: (parentId: string) => void
  ) =>
  ({ item, onExpand, onCollapse, provided, depth }: RenderItemParams) => {
    // const doc = DocConnection.get(item.data.identifier)?.tryDoc;
    // if (!doc) {
    //   console.warn("Doc not found but should be loaded", item.data.identifier);
    //   return null;
    // }

    const onClickHandler = () => {
      // main item has clicked (not chevron, always call onExpand)
      onExpand(item.id);
      onClick(item.data.identifier);
    };

    const onChevronClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.isExpanded) {
        onCollapse(item.id);
      } else {
        onExpand(item.id);
      }
    };

    const onAddClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onExpand(item.id);
      onAddChild(item.data.identifier);
    };

    const onKebabClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}>
        <Button
          className={
            styles.sidebarButton +
            " " +
            (item.data.isActive ? styles.active : "")
          }
          component="div"
          style={{
            paddingLeft: 2 + 15 * depth,
          }}
          onClick={onClickHandler}
          appearance="subtle"
          iconAfter={
            <>
              {false && ( // disabled for now
                <VscKebabVertical
                  onClick={onKebabClick}
                  className={styles.kebab}
                  title=""
                />
              )}
              <VscAdd
                onClick={onAddClick}
                className={styles.addChild}
                title=""
              />
            </>
          }
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
          {item.data.title || "Untitled"}
        </Button>
      </div>
    );
  };

function updateAkTree(oldTree: TreeData, newTree: TreeData) {
  for (let [key, item] of Object.entries(newTree.items)) {
    if (oldTree.items[key]) {
      item.isExpanded = oldTree.items[key].isExpanded;
    }
  }
}

export const SidebarTree = observer(
  (props: {
    tree: TreeData;
    onClick: (item: Identifier) => void;
    onAddNewPage: (parent?: string) => Promise<void>;
    enableAddRootPage: boolean;
    sessionStore: SessionStore;
  }) => {
    const { sessionStore, tree } = props;
    // A little cumbersome logic because we want to update the currentTree
    // both from outside this component and inside
    const currentTree = useRef(tree);
    const prevTreeFromProps = useRef(tree);
    const cache = useRef(new Map<string, DocConnection>());
    const [forceUpdate, setForceUpdate] = React.useState(0);

    // detect change in props
    if (prevTreeFromProps.current !== tree) {
      updateAkTree(currentTree.current, tree);
      currentTree.current = tree;
      prevTreeFromProps.current = tree;
    }
    const akTree = currentTree.current;

    useEffect(() => {
      const itemsToLoad = new Set<string>();
      for (let item of Object.values(akTree.items)) {
        if (item.isExpanded) {
          item.data.allChildren.forEach((child: any) => {
            itemsToLoad.add(child as string);
          });
        }
      }

      // clear items from cache if not in itemsToLoad
      for (let [key, item] of cache.current.entries()) {
        if (!itemsToLoad.has(key)) {
          item.dispose();
          cache.current.delete(key);
        }
      }

      // load items
      for (let key of itemsToLoad) {
        if (!cache.current.has(key)) {
          const item = DocConnection.load(key, sessionStore);
          cache.current.set(key, item);
        }
      }
    }, [akTree, sessionStore]);

    const onExpand = (id: ItemId) => {
      const mutated = mutateTree(akTree, id, {
        isExpanded: true,
      });
      currentTree.current = mutated;
      setForceUpdate(forceUpdate + 1);
    };

    const onCollapse = (id: ItemId) => {
      const mutated = mutateTree(akTree, id, { isExpanded: false });
      currentTree.current = mutated;
      setForceUpdate(forceUpdate + 1);
    };

    const renderItem = useMemo(
      () => RenderItem(props.onClick, props.onAddNewPage),
      [props.onAddNewPage, props.onClick]
    );

    const onDragEnd = (
      source: TreeSourcePosition,
      destination?: TreeDestinationPosition
    ) => {
      if (!destination) {
        return;
      }
      const sourceDoc = DocConnection.get(
        akTree.items[source.parentId].data!.id + "",
        sessionStore
      )?.tryDoc;
      const destDoc = DocConnection.get(
        akTree.items[destination.parentId].data!.id + "",
        sessionStore
      )?.tryDoc;
      if (!sourceDoc || !destDoc) {
        throw new Error("Doc not found but should be loaded");
      }

      const itemIdentifier: Identifier =
        akTree.items[akTree.items[source.parentId].children[source.index]].data!
          .identifier;

      if (destDoc === sourceDoc) {
        if (destination.index === undefined) {
          throw new Error("no destination index");
        }
        sourceDoc.moveRef(ChildReference, itemIdentifier, destination.index);
      } else {
        destDoc.addRef(
          ChildReference,
          itemIdentifier,
          destination.index || 0,
          false
        ); // TODO (must be true)
        sourceDoc.removeRef(ChildReference, itemIdentifier);
      }
      // const { tree } = this.state;
      // if (!destination) {
      //   return;
      // }
      // const newTree = moveItemOnTree(tree, source, destination);
      // this.setState({
      //   tree: newTree,
      // });
    };

    return (
      <>
        <Tree
          tree={akTree}
          renderItem={renderItem}
          onExpand={onExpand}
          onCollapse={onCollapse}
          // onDragStart={() => {}}
          onDragEnd={onDragEnd}
          offsetPerLevel={17}
          isDragEnabled
          isNestingEnabled
        />
        {props.enableAddRootPage && (
          <Button
            className={styles.sidebarButton}
            component="div"
            style={{
              paddingLeft: 2,
            }}
            iconBefore={
              <VscAdd
                // onClick={onChevronClick}
                className={styles.add}
                title=""
              />
            }
            onClick={() => props.onAddNewPage()}
            appearance="subtle">
            Add a page
          </Button>
        )}
      </>
    );
  }
);

export default SidebarTree;
