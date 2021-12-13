import Avatar from "react-avatar";
import DropdownMenu, {DropdownItem, DropdownItemGroup} from "@atlaskit/dropdown-menu";
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTransition,
} from '@atlaskit/modal-dialog';
import MoreIcon from '@atlaskit/icon/glyph/editor/more';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import LockIcon from '@atlaskit/icon/glyph/lock';
import UserPicker from '@atlaskit/user-picker';
import React, {ReactElement, useCallback, useRef, useState} from "react";
import Button from "@atlaskit/button";
import { IntlProvider } from "react-intl-next";
import Select from "@atlaskit/select";
import styles from "./DocumentSettings.module.css";
import {getStoreService} from "../../../store/local/stores";
import RestrictionsUser from "./RestrictionsUser";
import RestrictionsAdd from "./RestrictionsAdd";


export default function DocumentSettings() {
	const [isOpen, setIsOpen] = useState(false);
	const openModal = useCallback(() => setIsOpen(true), []);
	const closeModal = useCallback(() => setIsOpen(false), []);

	enum EditingRights {
		None,
		View,
		Edit
	}

	type User = {
		avatar: ReactElement,
		name: string,
		editingRights: string
	}

	let avatar: ReactElement = (<Avatar
		name={getStoreService().sessionStore.loggedInUser?.substr(1)}
		size="32"
		round={true}
		textSizeRatio={2}
		className={styles.avatar}
	/>);

	let name: string = getStoreService().sessionStore.loggedInUser!;

	let editingRights: string = "edit";

	let users: User[] = [{avatar, name, editingRights}];

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

								options={[
									{ label: 'Anyone can view and edit', value: 'public' },
									{ label: 'Anyone can view, some can edit', value: 'private-edit' },
									{ label: 'Only some can view or edit', value: 'private' },
								]}
							/>
							<RestrictionsAdd/>
							<RestrictionsUser avatar={avatar} name={name} editingRights={editingRights}/>
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
