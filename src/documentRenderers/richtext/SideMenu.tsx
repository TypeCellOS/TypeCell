import React from "react";

import { observer } from "mobx-react-lite";
import "./SideMenu.css";

const SideMenu: React.FC = observer((props) => {
  return (
    <div
      className={`hidden side-menu`}
      style={{ display: "none", position: "absolute" }}>
      <ul className={`menu-list`}>
        <li
          className={`menu-option`}
          onClick={(event) => {
            console.log(`menu option clicked`);
            const block =
              event.currentTarget.parentNode?.parentNode?.parentNode
                ?.parentNode;
            if (!block) {
              window.alert(`no parent found! error!`);
            }
            // @ts-ignore
            block.remove();
          }}>
          Delete
        </li>
        <li
          className={`menu-option`}
          onClick={() => window.alert("unfinished work")}>
          Select
        </li>
      </ul>
    </div>
  );
});

export default SideMenu;
