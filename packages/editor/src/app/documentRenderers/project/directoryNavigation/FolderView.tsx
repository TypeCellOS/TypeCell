import Button from "@atlaskit/button";
import { TreeData, TreeItem } from "@atlaskit/tree";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { AiFillFolder } from "react-icons/ai";
import { VscFile } from "react-icons/vsc";
import { DocConnection } from "../../../../store/DocConnection";
import { SessionStore } from "../../../../store/local/SessionStore";
import styles from "./FolderView.module.css";
// import { TreeNode } from "./treeNodeUtil";

export const ItemView = (props: {
  file: TreeItem;
  onClick: (item: TreeItem) => void;
}) => {
  const onClick = () => {
    props.onClick(props.file);
  };
  return (
    <Button
      iconBefore={
        props.file.hasChildren ? (
          <AiFillFolder className={styles.icon} />
        ) : (
          <VscFile className={styles.icon} />
        )
      }
      className={
        styles.item + " " + (props.file.hasChildren ? styles.folder : "")
      }
      onClick={onClick}>
      {props.file.data.title || "Untitled"}
    </Button>
  );
};

export const FolderView = observer(
  (props: {
    tree: TreeData;
    sessionStore: SessionStore;
    onClick: (item: TreeItem) => void;
  }) => {
    const { sessionStore, tree } = props;
    const cache = useRef(new Map<string, DocConnection>());

    useEffect(() => {
      const itemsToLoad = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tree.items[tree.rootId].data.allChildren.forEach((child: any) => {
        itemsToLoad.add(child as string);
      });

      // clear items from cache if not in itemsToLoad
      for (const [key, item] of cache.current.entries()) {
        if (!itemsToLoad.has(key)) {
          item.dispose();
          cache.current.delete(key);
        }
      }

      // load items
      for (const key of itemsToLoad) {
        if (!cache.current.has(key)) {
          const item = DocConnection.load(key, sessionStore);
          cache.current.set(key, item);
        }
      }
    }, [tree, sessionStore]);

    return (
      <div className={styles.container}>
        {props.tree.items[props.tree.rootId].children.map((file) => (
          <ItemView
            key={file}
            file={props.tree.items[file]}
            onClick={props.onClick}
          />
        ))}
      </div>
    );
  }
);

export default FolderView;
