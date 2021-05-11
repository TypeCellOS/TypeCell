import React from "react";
import "./SideMenu.css";

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