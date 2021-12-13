import React, {ReactElement, useCallback, useState} from "react";
import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import styles from "./DocumentSettings.module.css";
import { IntlProvider } from "react-intl-next";
import UserPicker from "@atlaskit/user-picker";
import {MatrixClientPeg} from "../../matrix-auth/MatrixClientPeg";
import {DocPermission, UserPermission} from "../PermissionsStore";

type User = {
	// avatarUrl: any,
	id: string,
	name: string,
	// type: "user" | "team" | "email" | "group",
	// fixed: boolean,
	// lozenge: string
}

export default function AddPermission(props: {docPermission: DocPermission}) {
	const [users, setUsers] = useState<User[]>([]);

	function isDisabled() {
		return props.docPermission == DocPermission.Public || props.docPermission == DocPermission.PrivateEdit;
	}

	async function searchUsers(query: string = "") {
		const peg = MatrixClientPeg.get();

		if (!peg || query == "") {
			setUsers([]);
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

			setUsers(results);
		}
	}

	return (
		<div className={styles.user}>
			<div className={styles.info}>
				<IntlProvider locale="en">
					<UserPicker
						fieldId="example"
						onChange={console.log}
						onInputChange={searchUsers}
						allowEmail={true}
						noOptionsMessage={() => null}

						options={users}
					/>
				</IntlProvider>
			</div>
			<div className={styles.actions}>
				<Select
					inputId="user-search"
					className={`${styles.select} ${styles.restriction_select}`}
					classNamePrefix="react-select"
					inputValue={""}
					defaultValue={{ label: 'Can edit', value: 'private-edit' }}
					isDisabled={isDisabled()}

					options={[
						{ label: 'Can view', value: 'public' },
						{ label: 'Can edit', value: 'private-edit' },
					]}
				/>
				<Button
					style={{height: '2.5rem', width: '50%', alignItems: 'center'}}
				>
					Add
				</Button>
			</div>
		</div>
	)
}
