export enum UserPermission {
	View = "view",
	Edit = "edit"
}

export enum DocPermission {
	Public = "public",
	PrivateEdit = "private-edit",
	Private = "private"
}

class PermissionsStore {
	public initializeDoc() {
		localStorage.setItem("docPermission", DocPermission.Public);
	}

	public docIsInitialized() {
		return !!localStorage.getItem("docPermission");
	}

	public initializeUsers() {
		localStorage.setItem("userPermissions", JSON.stringify(new Array<{user: string, permission: UserPermission}>()));
	}

	public usersAreInitialized() {
		return !!localStorage.getItem("userPermissions");
	}

	public getDocPermission() {
		return localStorage!.getItem("docPermission")!;
	}

	public setDocPermission(permission: DocPermission) {
		localStorage.setItem("docPermission", permission);
	}

	public getUserPermission(user: string) {
		const userPermissions: Array<{user: string, permission: UserPermission}> = permissionsStore.getUserPermissions();
		const userPermission = userPermissions.filter(permission => permission.user == user)[0];

		if (userPermission == null) {
			return false;
		}

		return userPermission;
	}

	public setUserPermission(user: string, permission: UserPermission) {
		const userPermissions: Array<{user: string, permission: UserPermission}> = permissionsStore.getUserPermissions();

		// Checks if user already has a permission set for this doc.
		if (userPermissions.filter(permission => permission.user == user).length > 0) {
			return false;
		}

		const userPermission = {
			user: user,
			permission: permission
		};

		userPermissions.push(userPermission);
		permissionsStore.setUserPermissions(userPermissions);

		return true;
	}

	public editUserPermission(user: string, permission: UserPermission) {
		const userPermissions: Array<{user: string, permission: UserPermission}> = permissionsStore.getUserPermissions();
		const newUserPermissions = userPermissions.filter(permission => permission.user != user);

		// Checks if user has no permission set for this doc.
		if (userPermissions.length == newUserPermissions.length) {
			return false;
		}

		const userPermission = {
			user: user,
			permission: permission
		};

		newUserPermissions.push(userPermission);
		permissionsStore.setUserPermissions(newUserPermissions);

		return true;
	}

	public removeUserPermission(user: string) {
		const userPermissions: Array<{user: string, permission: UserPermission}> = permissionsStore.getUserPermissions();
		const newUserPermissions = userPermissions.filter(permission => permission.user != user);

		// Checks if user has no permission set for this doc.
		if (userPermissions.length == newUserPermissions.length) {
			return false;
		}

		permissionsStore.setUserPermissions(newUserPermissions);

		return true;
	}

	public getUserPermissions(): Array<{user: string, permission: UserPermission}> {
		const userPermissions = JSON.parse(localStorage.getItem("userPermissions")!);
		console.log(userPermissions);
		return userPermissions.map((permission: {user: string, permission: UserPermission}) => permission.permission as UserPermission);
	}

	public setUserPermissions(permissions: Array<{user: string, permission: UserPermission}>) {
		localStorage.setItem("userPermissions", JSON.stringify(permissions));
	}
}

export const permissionsStore = new PermissionsStore();