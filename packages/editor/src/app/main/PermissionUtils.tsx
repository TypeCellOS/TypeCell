export enum DocPermission {
	Public = "public",
	PrivateEdit = "private-edit",
	Private = "private"
}

export enum UserPermission {
	View = "view",
	Edit = "edit"
}

export const docPermissionLabels = new Map<DocPermission, string>([
	[DocPermission.Public, 'Anyone can view and edit'],
	[DocPermission.PrivateEdit, 'Anyone can view, some can edit'],
	[DocPermission.Private, 'Only some can view or edit'],
])

export const userPermissionLabels = new Map<UserPermission, string>([
	[UserPermission.View, 'Can view'],
	[UserPermission.Edit, 'Can edit']
])

export function lockPermission(docPermission: DocPermission) {
	return docPermission === DocPermission.Public || docPermission === DocPermission.PrivateEdit
}

class PermissionStore {
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

	public getUserPermissions(): Array<{user: string, permission: UserPermission}> {
		return JSON.parse(localStorage.getItem("userPermissions")!);
	}

	public setUserPermissions(permissions: Array<{user: string, permission: UserPermission}>) {
		localStorage.setItem("userPermissions", JSON.stringify(permissions));
	}
}

export const permissionsStore = new PermissionStore();