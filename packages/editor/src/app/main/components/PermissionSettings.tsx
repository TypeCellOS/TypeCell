import styles from "./DocumentSettings.module.css";
import {DocPermission, permissionsStore, UserPermission} from "../PermissionsStore";
import Permission from "./Permission";
import React, {useState} from "react";

import Select from "@atlaskit/select";
import Button from "@atlaskit/button";
import UserPicker, {OptionData, Value} from "@atlaskit/user-picker";
import {IntlProvider} from "react-intl-next";
import {MatrixClientPeg} from "../../matrix-auth/MatrixClientPeg";

type User = {
	// avatarUrl: any,
	id: string,
	name: string,
	// type: "user" | "team" | "email" | "group",
	// fixed: boolean,
	// lozenge: string
}

export function lockPermission(docPermission: DocPermission) {
	return docPermission == DocPermission.Public || docPermission == DocPermission.PrivateEdit
}

export const permissionMap = new Map<UserPermission, {label: string, value: string}>([
	[UserPermission.View, { label: 'Can view', value: 'view' }],
	[UserPermission.Edit, { label: 'Can edit', value: 'edit '}]
])

export default function PermissionSettings() {
	// State and functions for storing & updating whether the page can be read/written to by others.
	const [docPermission, setDocPermission] = useState(initDocPermission);

	function initDocPermission() {
		if (!permissionsStore.docIsInitialized()) {
			permissionsStore.initializeDoc();
		}

		return permissionsStore.getDocPermission()! as DocPermission;
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
		let updatedUserPermissions: Array<{user: string, permission: UserPermission}> =
			JSON.parse(JSON.stringify(userPermissions)); // Deep copy
		updatedUserPermissions = updatedUserPermissions.filter(permission => permission.user != user);

		// User not in permissions list.
		if (userPermissions.length == updatedUserPermissions.length) {
			return;
		}

		updatedUserPermissions.push({user, permission});

		setUserPermissions(updatedUserPermissions);
	}

	function removeUserPermission(user: string) {
		let updatedUserPermissions: Array<{user: string, permission: UserPermission}> =
			JSON.parse(JSON.stringify(userPermissions)); // Deep copy
		updatedUserPermissions = updatedUserPermissions.filter(permission => permission.user != user);

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

	// Functions to permanently save or cancel changes made to permissions.
	function save() {

	}

	function cancel() {

	}

	return (
		<>
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
						defaultValue={{ label: 'Can edit', value: 'edit' }}
						value={lockPermission(docPermission) ?
							permissionMap.get(UserPermission.Edit) :
							permissionMap.get(permissionType)}
						isDisabled={docPermission == DocPermission.Public
							|| docPermission == DocPermission.PrivateEdit}
						onChange={updatePermissionType}

						options={[
							{ label: 'Can view', value: 'view' },
							{ label: 'Can edit', value: 'edit' },
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
				return (<Permission
					name={permission.user}
					userPermission={lockPermission(docPermission) ?
						UserPermission.Edit :
						permission.permission}
					docPermission={docPermission}
					editCallback={editUserPermission}
					removeCallback={removeUserPermission}
				/>)
			})}
		</>
	)
}