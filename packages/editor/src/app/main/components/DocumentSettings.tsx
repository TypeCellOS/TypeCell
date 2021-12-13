import DropdownMenu, {DropdownItem} from "@atlaskit/dropdown-menu";
import Modal, {ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition,} from '@atlaskit/modal-dialog';
import MoreIcon from '@atlaskit/icon/glyph/editor/more';
import React, {useCallback, useState} from "react";
import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import styles from "./DocumentSettings.module.css";
import Permission from "./Permission";
import AddPermission from "./AddPermission";
import {DocPermission, UserPermission} from "../PermissionsStore";

export default function DocumentSettings() {
	const [isOpen, setIsOpen] = useState(false);
	const openModal = useCallback(() => setIsOpen(true), []);
	const closeModal = useCallback(() => setIsOpen(false), []);

	const [docPermission, setDocPermission] = useState(DocPermission.Public);

	function updateDocPermission(permission: {label: string, value: string} | null) {
		if (permission?.value == DocPermission.Public) {
			setDocPermission(DocPermission.Public);
		}

		if (permission?.value == DocPermission.PrivateEdit) {
			setDocPermission(DocPermission.PrivateEdit);
		}

		if (permission?.value == DocPermission.Private) {
			setDocPermission(DocPermission.Private);
		}
	}

	let permissions: {name: string, permission: UserPermission}[] = [
		{name: 'Matthew Lipski', permission: UserPermission.Edit},
		{name: 'Test 1', permission: UserPermission.Edit},
		{name: 'Test 2', permission: UserPermission.View},
		{name: 'Matthew Lipski', permission: UserPermission.Edit},
		{name: 'Test 1', permission: UserPermission.Edit},
		{name: 'Test 2', permission: UserPermission.View},
		{name: 'Matthew Lipski', permission: UserPermission.Edit},
		{name: 'Test 1', permission: UserPermission.Edit},
		{name: 'Test 2', permission: UserPermission.View},
		{name: 'Matthew Lipski', permission: UserPermission.Edit},
		{name: 'Test 1', permission: UserPermission.Edit},
		{name: 'Test 2', permission: UserPermission.View},
	]

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
				{isOpen && (
					<Modal onClose={closeModal} height={600} width={804}>
						<ModalHeader>
							<ModalTitle>Restrictions</ModalTitle>
						</ModalHeader>
						<ModalBody className={styles.body}>
							<Select
								inputId="single-select-example"
								className={`${styles.select} ${styles.user_select}`}
								inputValue={""}
								defaultValue={{ label: 'Anyone can view and edit', value: 'public' }}
								onChange={updateDocPermission}

								options={[
									{ label: 'Anyone can view and edit', value: 'public' },
									{ label: 'Anyone can view, some can edit', value: 'private-edit' },
									{ label: 'Only some can view or edit', value: 'private' },
								]}
							/>
							<AddPermission docPermission={docPermission}/>
							{permissions.map(function(permission: {name: string, permission: UserPermission}){
								if (docPermission == DocPermission.Public || docPermission == DocPermission.PrivateEdit) {
									return (<Permission
										name={permission.name}
										userPermission={UserPermission.Edit}
										docPermission={docPermission}
									/>)
								}

								return (<Permission
									name={permission.name}
									userPermission={permission.permission}
									docPermission={docPermission}
								/>)
							})}
						</ModalBody>
						<ModalFooter>
							<Button appearance="subtle" onClick={closeModal}>
								Cancel
							</Button>
							<Button appearance="primary" onClick={closeModal} autoFocus>
								Apply
							</Button>
						</ModalFooter>
					</Modal>
				)}
			</ModalTransition>
		</>
	)
}
