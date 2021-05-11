import React from "react";
<<<<<<< HEAD
import "./SideMenu.css";

type Props = {
	onDelete: () => void;
=======
import styles from "./SideMenu.module.css";

type Props = {
  onDelete: () => void;
>>>>>>> origin/node-deletion
};

/**
 * A side menu is created for each block. This is wrapped in a Tippy instance.
 * @param props none;
 * @returns React.FC
 */
const SideMenu = (props: Props) => {
<<<<<<< HEAD
	return (
		<div className={`side-menu`}>
			<ul className={`menu-list`}>
				<li className={`menu-option`} onClick={props.onDelete}>
					Delete
				</li>
			</ul>
		</div>
	);
};

export default SideMenu;
=======
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
>>>>>>> origin/node-deletion
