import React from "react";
import styles from "./MenuBar.module.css";

type Props = {
  children: any;
};

export const MenuBar: React.FC<Props> = (props) => {
  return <nav className={styles.menu}>{props.children}</nav>;
};
