import Button from "@atlaskit/button";
import { observer } from "mobx-react-lite";
import React from "react";
import { AiFillFolder } from "react-icons/ai";
import { VscFile } from "react-icons/vsc";
import styles from "./FolderView.module.css";
import { TreeNode } from "./treeNodeUtil";

export const ItemView = (props: {
  file: TreeNode;
  onClick: (item: string) => void;
}) => {
  const onClick = () => {
    props.onClick(props.file.fileName);
  };
  return (
    <Button
      iconBefore={
        props.file.isDirectory ? (
          <AiFillFolder className={styles.icon} />
        ) : (
          <VscFile className={styles.icon} />
        )
      }
      className={
        styles.item + " " + (props.file.isDirectory ? styles.folder : "")
      }
      onClick={onClick}>
      {props.file.fileName}
    </Button>
  );
};

export const FolderView = observer(
  (props: { tree: TreeNode[]; onClick: (item: string) => void }) => {
    return (
      <div className={styles.container}>
        {props.tree.map((file) => (
          <ItemView key={file.fileName} file={file} onClick={props.onClick} />
        ))}
      </div>
    );
  }
);

export default FolderView;
