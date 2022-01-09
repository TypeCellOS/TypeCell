import styles from "./DocumentSettings.module.css";
import {
	DocPermission,
	docPermissionLabels,
	lockPermission,
	permissionsStore,
	UserPermission,
	userPermissionLabels
} from "../PermissionUtils";
import Permission from "./Permission";
import React, {useState} from "react";

import Select from "@atlaskit/select";
import Button from "@atlaskit/button";
import UserPicker, {OptionData, Value} from "@atlaskit/user-picker";
import {IntlProvider} from "react-intl-next";
import {MatrixClientPeg} from "../../matrix-auth/MatrixClientPeg";
import Modal, {ModalBody, ModalFooter, ModalHeader, ModalTitle,} from '@atlaskit/modal-dialog';

type User = {
	// avatarUrl: any,
	id: string,
	name: string,
	// type: "user" | "team" | "email" | "group",
	// fixed: boolean,
	// lozenge: string
}

export default function PermissionSettings(props: {closeCallback: () => void}) {
	// State and functions for storing & updating whether the page can be read/written to by others.
	const [docPermission, setDocPermission] = useState(initDocPermission);

	function initDocPermission() {
		if (!permissionsStore.docIsInitialized()) {
			permissionsStore.initializeDoc();
		}

		return permissionsStore.getDocPermission() as DocPermission;
	}

	function updateDocPermission(permission: {label: string, value: string} | null) {
		setDocPermission(permission!.value as DocPermission);
	}

	// State and functions for storing & updating whether each specific user can read/write to the page.
	const [userPermissions, setUserPermissions] = useState(initUserPermissions);

	function initUserPermissions() {
		if (!permissionsStore.usersAreInitialized()) {
			permissionsStore.initializeUsers();
		}

		return permissionsStore.getUserPermissions();
	}

	function addUserPermission(user: string, permission: UserPermission) {
		// User already in permissions list.
		if (userPermissions.filter(permission => permission.user == user).length > 0) {
			return;
		}

		let updatedUserPermissions = JSON.parse(JSON.stringify(userPermissions)); // Deep copy
		updatedUserPermissions.push({user, permission});

		setUserPermissions(updatedUserPermissions);
	}

	function editUserPermission(user: string, permission: UserPermission) {
		let updatedUserPermissions: {user: string, permission: UserPermission}[] = [];

		for (let i = 0; i < userPermissions.length; i++) {
			if (userPermissions[i].user == user) {
				updatedUserPermissions.push({user: user, permission: permission});
			} else {
				updatedUserPermissions.push(userPermissions[i]);
			}
		}

		setUserPermissions(updatedUserPermissions);
	}

	function removeUserPermission(user: string) {
		let updatedUserPermissions: {user: string, permission: UserPermission}[] = [];

		for (let i = 0; i < userPermissions.length; i++) {
			if (userPermissions[i].user != user) {
				updatedUserPermissions.push(userPermissions[i]);
			}
		}

		setUserPermissions(updatedUserPermissions);
	}

	// State and function for storing & updating the users to display in the user picker.
	const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);

	async function searchUsers(query: string = "") {
		const peg = MatrixClientPeg.get();

		if (!peg || query == "") {
			setDisplayedUsers([]);
		} else {
			const ret = await peg.searchUserDirectory({
				term: query || "mx", // mx is a trick to return all users on mx.typecell.org
				limit: 10,
			});

			const results: User[] = ret.results.map(
				(result: any) => ({
					id: result.display_name,
					name: result.display_name
				})
			);

			setDisplayedUsers(results);
		}
	}

	// State and function for storing & updating the currently selected user from the user picker.
	const [selectedUser, setSelectedUser] = useState('');

	function updateSelectedUser(value: Value) {
		value = value as OptionData;
		setSelectedUser(value.name);
	}

	// State and functions for storing & updating the permission type for the currently selected user.
	const [permissionType, setPermissionType] = useState(UserPermission.Edit);

	function updatePermissionType(value: {label: string, value: string} | null) {
		setPermissionType(value!.value as UserPermission);
	}

	// Callback for adding a permission.
	function addPermission() {
		addUserPermission(selectedUser, permissionType);
	}

	// Functions to save changes made to permissions.
	function save() {
		permissionsStore.setDocPermission(docPermission);

		// If the user accidentally switches the document permissions, this makes sure their previous user permissions
		// are not lost.
		if (lockPermission(docPermission)) {
			let updatedUserPermissions: {user: string, permission: UserPermission}[] = [];

			for (let i = 0; i < userPermissions.length; i++) {
				updatedUserPermissions.push({user: userPermissions[i].user, permission: UserPermission.Edit});
			}

			permissionsStore.setUserPermissions(updatedUserPermissions);
		} else {
			permissionsStore.setUserPermissions(userPermissions);
		}

		props.closeCallback();
	}

	return (
		<Modal onClose={props.closeCallback}
			   height={600}
			   width={804}
		>
			<ModalHeader>
				<ModalTitle>Restrictions</ModalTitle>
			</ModalHeader>
			<ModalBody className={styles.body}>
				<Select
					inputId="single-select-example"
					className={`${styles.select} ${styles.user_select}`}
					inputValue={""}
					defaultValue={{label: docPermissionLabels.get(docPermission)!, value: docPermission}}
					onChange={updateDocPermission}

					options={[
						{ label: docPermissionLabels.get(DocPermission.Public)!, value: DocPermission.Public },
						{ label: docPermissionLabels.get(DocPermission.PrivateEdit)!, value: DocPermission.PrivateEdit },
						{ label: docPermissionLabels.get(DocPermission.Private)!, value: DocPermission.Private, isDisabled: true },
					]}
				/>
				<div className={styles.user}>
					<div className={styles.info}>
						<IntlProvider locale="en">
							<UserPicker
								fieldId="add-user"
								allowEmail={true}
								noOptionsMessage={() => null}
								onInputChange={searchUsers}
								onChange={updateSelectedUser}

								options={displayedUsers}
							/>
						</IntlProvider>
					</div>
					<div className={styles.actions}>
						<Select
							id="add-permission"
							className={`${styles.select} ${styles.restriction_select}`}
							classNamePrefix="react-select"
							inputValue={""}
							defaultValue={{
								label: userPermissionLabels.get(UserPermission.Edit)!,
								value: UserPermission.Edit
							}}
							value={lockPermission(docPermission) ?
								{label: userPermissionLabels.get(UserPermission.Edit)!, value: UserPermission.Edit} :
								{label: userPermissionLabels.get(permissionType)!, value: permissionType}
							}
							isDisabled={docPermission == DocPermission.Public
								|| docPermission == DocPermission.PrivateEdit}

							onChange={updatePermissionType}

							options={[
								{ label: userPermissionLabels.get(UserPermission.View)!, value: UserPermission.View },
								{ label: userPermissionLabels.get(UserPermission.Edit)!, value: UserPermission.Edit },
							]}
						/>
						<Button
							style={{height: '2.5rem', width: '50%', alignItems: 'center'}}
							onClick={addPermission}
						>
							Add
						</Button>
					</div>
				</div>
				{userPermissions.map(function(permission: {user: string, permission: UserPermission}){
					console.log(permission)
					return (<Permission
						name={permission.user}
						userPermission={permission.permission}
						docPermission={docPermission}
						editCallback={editUserPermission}
						removeCallback={removeUserPermission}
					/>)
				})}
			</ModalBody>
			<ModalFooter>
				<Button appearance="subtle" onClick={props.closeCallback}>
					Cancel
				</Button>
				<Button appearance='primary' onClick={save} autoFocus>
					Apply
				</Button>
			</ModalFooter>
		</Modal>
	)
}