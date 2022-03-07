import Button from "@atlaskit/button";
import Modal, {
  ModalBody,
  ModalHeader,
  ModalTitle,
} from "@atlaskit/modal-dialog";
import Select from "@atlaskit/select";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { MatrixUserPicker } from "./MatrixUserPicker";
import UserPermissionRow from "./UserPermissionRow";
import styles from "./PermissionsSettings.module.css";
import {
  DocPermission,
  docPermissionLabels,
  PermissionData,
  updatePermissionData,
  UserPermission,
  userPermissionLabels,
} from "./permissionUtils";
import { User } from "./userUtils";

const PermissionsSettings = observer(
  (props: {
    currentUserId: string;
    matrixClient: any;
    roomId: string;
    permissionData: PermissionData;
    closeCallback: (newPermissionData?: PermissionData) => void;
  }) => {
    const [isSaving, setIsSaving] = useState(false);

    // State for storing & updating the currently selected user from the user picker.
    const [newUser, setNewUser] = useState<User | undefined>();

    // State and functions for storing & updating the permission type for the user that is being added.
    const [newUserPermission, setNewUserPermission] =
      useState<UserPermission>("edit");

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

    function addUserPermission(userId: string, permission: UserPermission) {
      // User already in permissions list.
      if (editingPermissionData.users.has(userId)) {
        return;
      }

      editingPermissionData.users.set(userId, permission);

      setEditingPermissionData({
        doc: editingPermissionData.doc,
        users: editingPermissionData.users,
      });
    }

    function editUserPermission(user: string, permission: UserPermission) {
      editingPermissionData.users.set(user, permission);

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
      setNewUserPermission(value!.value as UserPermission);
    }

    // Callback for adding a permission.
    function addPermission() {
      if (!newUser) {
        throw new Error("no user selected");
      }
      addUserPermission(newUser.id, newUserPermission);
    }

    function save() {
      setIsSaving(true);

      (async () => {
        await updatePermissionData(
          props.matrixClient,
          props.roomId,
          props.permissionData,
          editingPermissionData
        );

        setIsSaving(false);
        props.closeCallback();
      })();
    }

    return (
      <Modal
        css={{ overflow: "visible" }}
        onClose={() => props.closeCallback()}
        actions={[
          {
            text: "Apply",
            type: "submit",
            onClick: () => save(),
            isLoading: isSaving,
          },
          { text: "Cancel", onClick: () => props.closeCallback() },
        ]}>
        <ModalHeader>
          <ModalTitle>Sharing & Permissions</ModalTitle>
        </ModalHeader>
        <ModalBody className={styles.body}>
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
                label: docPermissionLabels.get("public-read-write")!,
                value: "public-read-write",
              },
              {
                label: docPermissionLabels.get("public-read")!,
                value: "public-read",
              },
              {
                label: docPermissionLabels.get("private")!,
                value: "private",
                isDisabled: true,
              },
            ]}
          />
          {editingPermissionData.doc !== "public-read-write" && (
            <>
              <div className={styles.userRow}>
                <div className={styles.pickerContainer}>
                  <MatrixUserPicker updateSelectedUser={updateSelectedUser} />
                </div>
                {/* <div className={styles.actions}> */}
                <Select
                  id="add-permission"
                  className={`${styles.select} ${styles.restrictionSelect}`}
                  classNamePrefix="react-select"
                  menuPosition="fixed"
                  inputValue={""}
                  defaultValue={{
                    label: userPermissionLabels.get("edit")!,
                    value: "edit",
                  }}
                  isDisabled={true}
                  onChange={updatePermissionType}
                  options={[
                    {
                      label: userPermissionLabels.get("view")!,
                      value: "view",
                    },
                    {
                      label: userPermissionLabels.get("edit")!,
                      value: "edit",
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
                ([user, permission]) => {
                  return user === props.currentUserId ? (
                    <></>
                  ) : (
                    <UserPermissionRow
                      key={user}
                      userId={user}
                      userPermission={permission}
                      docPermission={editingPermissionData.doc}
                      editCallback={editUserPermission}
                      removeCallback={removeUserPermission}
                    />
                  );
                }
              )}
            </>
          )}
        </ModalBody>
      </Modal>
    );
  }
);

export default PermissionsSettings;
