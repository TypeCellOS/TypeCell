import Button from "@atlaskit/button";
import Tree, {
  ItemId,
  mutateTree,
  RenderItemParams,
  TreeData,
  TreeDestinationPosition,
  TreeSourcePosition,
} from "@atlaskit/tree";
import _ from "lodash";
import { observer } from "mobx-react-lite";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  VscAdd,
  VscChevronDown,
  VscChevronRight,
  VscKebabVertical,
} from "react-icons/vsc";
import { Identifier } from "../../../../identifiers/Identifier";
import { DocConnection } from "../../../../store/DocConnection";
import { ChildReference } from "../../../../store/referenceDefinitions/child";
import styles from "./SidebarTree.module.css";

const RenderItem =
  (
    onClick: (item: Identifier) => void,
    onAddChild: (parentId: string) => void
  ) =>
  ({ item, onExpand, onCollapse, provided, depth }: RenderItemParams) => {
    const doc = DocConnection.get(item.data.identifier)?.tryDoc;
    if (!doc) {
      console.warn("Doc not found but should be loaded", item.data.identifier);
      return null;
    }

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
              <VscKebabVertical
                onClick={onKebabClick}
                className={styles.kebab}
                title=""
              />
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

export const SidebarTree = observer(
  (props: {
    tree: TreeData;
    onClick: (item: Identifier) => void;
    onAddNewPage: (parent?: string) => Promise<void>;
  }) => {
    const [akTree, setAktree] = useState(props.tree);
    const cache = useRef(new Map<string, DocConnection>());

    const updateAkTree = (newTree: TreeData) => {
      for (let [key, item] of Object.entries(newTree.items)) {
        if (akTree.items[key]) {
          item.isExpanded = akTree.items[key].isExpanded;
        }
      }

      setAktree(newTree);
    };

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
          const item = DocConnection.load(key);
          cache.current.set(key, item);
        }
      }
    }, [akTree]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const update = useCallback(
      _.debounce(updateAkTree, 100, { leading: true }),
      [akTree]
    );

    useEffect(() => {
      update(props.tree);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.tree]);

    const onExpand = (id: ItemId) => {
      const mutated = mutateTree(akTree, id, {
        isExpanded: true,
      });
      setAktree(mutated);
    };

    const onCollapse = (id: ItemId) => {
      setAktree(mutateTree(akTree, id, { isExpanded: false }));
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
        akTree.items[source.parentId].data!.id + ""
      )?.tryDoc;
      const destDoc = DocConnection.get(
        akTree.items[destination.parentId].data!.id + ""
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
      </>
    );
  }
);

export default SidebarTree;
