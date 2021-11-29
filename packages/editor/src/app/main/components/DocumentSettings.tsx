import DropdownMenu, {DropdownItem, DropdownItemGroup} from "@atlaskit/dropdown-menu";
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTransition,
} from '@atlaskit/modal-dialog';
import MoreIcon from '@atlaskit/icon/glyph/editor/more';
// import UserPicker from '@atlaskit/user-picker';
import React, {useCallback, useState} from "react";
import Button from "@atlaskit/button";

export default function DocumentSettings() {
	const [isOpen, setIsOpen] = useState(false);
	const openModal = useCallback(() => setIsOpen(true), []);
	const closeModal = useCallback(() => setIsOpen(false), []);

	return (
		<>
			<DropdownMenu
				triggerButtonProps={{ iconBefore: <MoreIcon label="more" /> }}
				triggerType="button"
			>
				<DropdownItemGroup>
					<DropdownItem onClick={openModal}>
						Restrictions
					</DropdownItem>
				</DropdownItemGroup>
			</DropdownMenu>

			<ModalTransition>
				{isOpen && (
					<Modal onClose={closeModal}>
						<ModalHeader>
							<ModalTitle>Restrictions</ModalTitle>
						</ModalHeader>
						<ModalBody>
							{/*{ (options: any, onInputChange: any) => (*/}
							{/*	<UserPicker*/}
							{/*		fieldId="example"*/}
							{/*		options={options}*/}
							{/*		onChange={console.log}*/}
							{/*		onInputChange={onInputChange}*/}
							{/*	/>*/}
							{/*)}*/}
						</ModalBody>
						<ModalFooter>
							<Button appearance="subtle">Cancel</Button>
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
