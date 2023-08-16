/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Button, { LoadingButton } from "@atlaskit/button";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@atlaskit/modal-dialog";
import Select from "@atlaskit/select";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { SupabaseClientType } from "../../SupabaseSessionStore";
import styles from "./PermissionsSettings.module.css";
import UserPermissionRow from "./UserPermissionRow";
import { SupabaseUserPicker } from "./UserPicker";
import {
  DocPermission,
  PermissionData,
  docPermissionLabels,
  userPermissionLabels,
} from "./permissionUtils";
import { User } from "./userUtils";

const PermissionsSettings = observer(
  (props: {
    currentUserId: string;
    supabaseClient: SupabaseClientType;

    permissionData: PermissionData;
    onSave: (newPermissionData: PermissionData) => void;
    closeCallback: () => void;
  }) => {
    const [isSaving, setIsSaving] = useState(false);

    // State for storing & updating the currently selected user from the user picker.
    const [newUser, setNewUser] = useState<User | undefined>();

    // State and functions for storing & updating the permission type for the user that is being added.
    const [newUserPermission, setNewUserPermission] =
      useState<DocPermission>("write");

    const [editingPermissionData, setEditingPermissionData] =
      useState<PermissionData>({
        doc: props.permissionData.doc,
        // deep clone:
        users: new Map(
          JSON.parse(JSON.stringify(Array.from(props.permissionData.users)))
        ),
      });

    function updateDocPermission(
      permission: { label: string; value: string } | null
    ) {
      setEditingPermissionData({
        doc: permission!.value as DocPermission,
        users: editingPermissionData.users,
      });
    }

    function addUserPermission(user: User, permission: DocPermission) {
      // User already in permissions list.
      if (editingPermissionData.users.has(user.id)) {
        return;
      }

      editingPermissionData.users.set(user.id, {
        user,
        permission,
      });

      setEditingPermissionData({
        doc: editingPermissionData.doc,
        users: editingPermissionData.users,
      });
    }

    function editUserPermission(userId: string, permission: DocPermission) {
      const existingValue = editingPermissionData.users.get(userId);
      if (!existingValue) {
        throw new Error("editing non existing user permission");
      }
      existingValue.permission = permission;

      setEditingPermissionData({
        doc: editingPermissionData.doc,
        users: editingPermissionData.users,
      });
    }

    function removeUserPermission(user: string) {
      editingPermissionData.users.delete(user);

      setEditingPermissionData({
        doc: editingPermissionData.doc,
        users: editingPermissionData.users,
      });
    }

    function updateSelectedUser(user: User | undefined) {
      setNewUser(user);
    }

    function updatePermissionType(
      value: { label: string; value: string } | null
    ) {
      setNewUserPermission(value!.value as DocPermission);
    }

    // Callback for adding a permission.
    function addPermission() {
      if (!newUser) {
        throw new Error("no user selected");
      }
      addUserPermission(newUser, newUserPermission);
    }

    function save() {
      setIsSaving(true);

      (async () => {
        await props.onSave(editingPermissionData);

        setIsSaving(false);
        props.closeCallback();
      })();
    }

    return (
      <Modal
        // TODO
        // css={{ overflow: "visible" }}
        onClose={() => props.closeCallback()}>
        <ModalHeader>
          <ModalTitle>Sharing & Permissions</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className={styles.body}>
            <Select
              menuPosition="fixed"
              inputId="single-select-example"
              className={`${styles.select} ${styles.userSelect}`}
              inputValue={""}
              defaultValue={{
                label: docPermissionLabels.get(editingPermissionData.doc)!,
                value: editingPermissionData.doc,
              }}
              onChange={updateDocPermission}
              options={[
                {
                  label: docPermissionLabels.get("write")!,
                  value: "write",
                },
                {
                  label: docPermissionLabels.get("read")!,
                  value: "read",
                },
                {
                  label: docPermissionLabels.get("no-access")!,
                  value: "no-access",
                  isDisabled: true,
                },
              ]}
            />
            {editingPermissionData.doc !== "write" && (
              <>
                <div className={styles.userRow}>
                  <div className={styles.pickerContainer}>
                    <SupabaseUserPicker
                      supabase={props.supabaseClient}
                      updateSelectedUser={updateSelectedUser}
                    />
                  </div>
                  {/* <div className={styles.actions}> */}
                  <Select
                    id="add-permission"
                    className={`${styles.select} ${styles.restrictionSelect}`}
                    classNamePrefix="react-select"
                    menuPosition="fixed"
                    inputValue={""}
                    defaultValue={{
                      label: userPermissionLabels.get("write")!,
                      value: "write",
                    }}
                    isDisabled={true}
                    onChange={updatePermissionType}
                    options={[
                      {
                        label: userPermissionLabels.get("read")!,
                        value: "read",
                      },
                      {
                        label: userPermissionLabels.get("write")!,
                        value: "write",
                      },
                    ]}
                  />
                  <Button
                    onClick={addPermission}
                    className={styles.addButton}
                    isDisabled={newUser === undefined}>
                    Add
                  </Button>
                </div>
                {Array.from(editingPermissionData.users.entries()).map(
                  ([userId, val]) => {
                    return userId === props.currentUserId ? (
                      <></>
                    ) : (
                      <UserPermissionRow
                        key={userId}
                        user={val.user}
                        userPermission={val.permission}
                        editCallback={editUserPermission}
                        removeCallback={removeUserPermission}
                      />
                    );
                  }
                )}
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <LoadingButton
            appearance="primary"
            isLoading={isSaving}
            autoFocus
            type="submit"
            onClick={() => save()}>
            Apply
          </LoadingButton>
          <Button appearance="subtle" onClick={() => props.closeCallback()}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
);

export default PermissionsSettings;
