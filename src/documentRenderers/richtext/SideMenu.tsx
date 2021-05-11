import React from "react";
import styles from "./SideMenu.module.css";

type Props = {
  onDelete: () => void;
};

/**
 * A side menu is created for each block. This is wrapped in a Tippy instance.
 * @param props none;
 * @returns React.FC
 */
const SideMenu = (props: Props) => {
  return (
    <div className={styles[`side-menu`]}>
      <ul className={styles[`menu-list`]}>
        <li className={styles[`menu-option`]} onClick={props.onDelete}>
          Delete
        </li>
      </ul>
    </div>
  );
};

export default SideMenu;
