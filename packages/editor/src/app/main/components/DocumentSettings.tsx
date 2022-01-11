import DropdownMenu, {DropdownItem} from "@atlaskit/dropdown-menu";
import Modal, {ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition,} from '@atlaskit/modal-dialog';
import MoreIcon from '@atlaskit/icon/glyph/editor/more';
import React, {useCallback, useState} from "react";
import Button from "@atlaskit/button";
import styles from "./DocumentSettings.module.css";
import routing from "../../routing";
import PermissionSettings from "./PermissionSettings";

export default function DocumentSettings(props: {user: string | undefined}) {
	const [isOpen, setIsOpen] = useState(false); // User restrictions modal dialog
	const openModal = useCallback(() => setIsOpen(true), []);
	const closeModal = useCallback(() => setIsOpen(false), []);

	return (
		<>
			<DropdownMenu
				triggerButtonProps={{ iconBefore: <MoreIcon label="more" /> }}
				triggerType="button"
			>
				<DropdownItem onClick={openModal} shouldFlip>
					Restrictions
				</DropdownItem>
			</DropdownMenu>

			<ModalTransition>
				{isOpen && (<PermissionSettings user={props.user?.substring(1)} closeCallback={closeModal}/>)}
			</ModalTransition>
		</>
	)
}
