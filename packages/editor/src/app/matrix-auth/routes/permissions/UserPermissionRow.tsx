import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import React, { useState } from "react";
import Avatar from "react-avatar";
import { friendlyUserId } from "../../../../util/userIds";
import styles from "./PermissionsSettings.module.css";
import {
  DocPermission,
  UserPermission,
  userPermissionLabels,
} from "./permissionUtils";

export default function UserPermissionRow(props: {
  userId: string;
  userPermission: UserPermission;
  docPermission: DocPermission;
  editCallback: (user: string, permission: UserPermission) => void;
  removeCallback: (user: string) => void;
}) {
  // State and functions for storing & updating whether each specific user can read/write to the page.
  const [userPermission, setUserPermission] = useState<UserPermission>("edit");

  function edit(permission: { label: string; value: string } | null) {
    setUserPermission(permission!.value as UserPermission);
    props.editCallback(props.userId, permission!.value as UserPermission);
  }

  function remove(e: any) {
    props.removeCallback(props.userId);
  }

  return (
    <div className={styles.userRow}>
      <div className={styles.userInfo}>
        <Avatar
          name={props.userId.substring(1)}
          size="32"
          round={true}
          textSizeRatio={2}
          className={styles.avatar}
        />
        <div>{friendlyUserId(props.userId)}</div>
      </div>
      <Select
        inputId="single-select-example"
        className={`${styles.select} ${styles.restrictionSelect}`}
        classNamePrefix="react-select"
        menuPosition="fixed"
        inputValue={""} // For disabling user keyboard input.
        defaultValue={{
          label: userPermissionLabels.get(userPermission)!,
          value: userPermission,
        }}
        value={{
          label: userPermissionLabels.get("edit")!,
          value: "edit",
        }}
        isDisabled={true}
        onChange={edit}
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
        appearance="subtle"
        className={styles.removeButton}
        onClick={remove}>
        Remove
      </Button>
    </div>
  );
}
