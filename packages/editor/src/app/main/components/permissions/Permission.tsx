import React, { useState } from "react";
import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import styles from "./PermissionsSettings.module.css";
import Avatar from "react-avatar";
import {
  DocPermission,
  lockPermission,
  UserPermission,
  userPermissionLabels,
} from "../../PermissionUtils";

export default function Permission(props: {
  name: string;
  userPermission: UserPermission;
  docPermission: DocPermission;
  editCallback: (user: string, permission: UserPermission) => void;
  removeCallback: (user: string) => void;
}) {
  // State and functions for storing & updating whether each specific user can read/write to the page.
  const [userPermission, setUserPermission] = useState(
    lockPermission(props.docPermission)
      ? UserPermission.Edit
      : props.userPermission
  );

  function edit(permission: { label: string; value: string } | null) {
    setUserPermission(permission!.value as UserPermission);
    props.editCallback(props.name, permission!.value as UserPermission);
  }

  function remove(e: any) {
    props.removeCallback(props.name);
  }

  return (
    <div className={styles.userRow}>
      <div className={styles.userInfo}>
        <Avatar
          name={props.name}
          size="32"
          round={true}
          textSizeRatio={2}
          className={styles.avatar}
        />
        <div>{props.name}</div>
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
        value={
          lockPermission(props.docPermission)
            ? {
                label: userPermissionLabels.get(UserPermission.Edit)!,
                value: UserPermission.Edit,
              }
            : {
                label: userPermissionLabels.get(userPermission)!,
                value: userPermission,
              }
        }
        isDisabled={lockPermission(props.docPermission)}
        onChange={edit}
        options={[
          {
            label: userPermissionLabels.get(UserPermission.View)!,
            value: UserPermission.View,
          },
          {
            label: userPermissionLabels.get(UserPermission.Edit)!,
            value: UserPermission.Edit,
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
