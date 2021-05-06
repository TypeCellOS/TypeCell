import React from "react";
import { observer } from "mobx-react-lite";
import styles from "./SideMenu.module.css";
import { Action } from "./RichTextConsole";

type RichTextBlockMenuProps = {
  id: string;
  dispatcher: React.Dispatch<Action>;
};
const SideMenu: React.FC<RichTextBlockMenuProps> = observer((props) => {
  // const [state, setState] = React.useState<boolean>(false);
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
