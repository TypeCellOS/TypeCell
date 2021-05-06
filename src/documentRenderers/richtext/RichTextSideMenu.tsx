import React from "react";
import { observer } from "mobx-react-lite";
import styles from "./RichTextSideMenu.module.css";
import { Action } from "./RichTextConsole";

type RichTextBlockMenuProps = {
  id: string;
  dispatcher: React.Dispatch<Action>;
};
/**
 * This Component is the side menu for the block that immediately encloses it
 */
const SideMenu: React.FC<RichTextBlockMenuProps> = observer((props) => {
  return (
    <div
      className={`${styles["side-menu"]} hidden`}
      style={{ display: "none", position: "absolute" }}
      id={`side-menu-${props.id}`}>
      <ul className={styles["side-menu-list"]}>
        <li
          className={styles["side-menu-option"]}
          onClick={() => {
            console.log(`in side menu option`);
            props.dispatcher({
              type: "delete",
              data: props.id,
              dispatcher: props.dispatcher,
            });
          }}>
          Delete
        </li>
        <li className={styles["side-menu-option"]}>Comment</li>
      </ul>
    </div>
  );
});

export default SideMenu;
