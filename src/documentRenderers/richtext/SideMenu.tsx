import React from "react";

import menuOptionHandlers from "./SideMenuEvents";
import "./SideMenu.css";

/**
 * A side menu is created for each block. This is wrapped in a Tippy instance.
 * @param props none;
 * @returns React.FC
 */
const SideMenu: React.FC = (props) => {
  return (
    <div className={`side-menu`}>
      <ul className={`menu-list`}>
        <li className={`menu-option`} onClick={menuOptionHandlers["onDelete"]}>
          Delete
        </li>
      </ul>
    </div>
  );
};

export default SideMenu;
