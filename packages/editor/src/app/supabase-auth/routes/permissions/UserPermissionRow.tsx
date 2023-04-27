import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import { useState } from "react";
import Avatar from "react-avatar";
import styles from "./PermissionsSettings.module.css";
import { DocPermission, userPermissionLabels } from "./permissionUtils";
import { User } from "./userUtils";

export default function UserPermissionRow(props: {
  user: User;
  userPermission: DocPermission;
  editCallback: (userId: string, permission: DocPermission) => void;
  removeCallback: (userId: string) => void;
}) {
  // State and functions for storing & updating whether each specific user can read/write to the page.
  const [userPermission, setUserPermission] = useState<DocPermission>(
    props.userPermission
  );

  function edit(permission: { label: string; value: string } | null) {
    setUserPermission(permission!.value as DocPermission);
    props.editCallback(props.user.id, permission!.value as DocPermission);
  }

  function remove(e: any) {
    props.removeCallback(props.user.id);
  }
  console.log("defperm", {
    label: userPermissionLabels.get(userPermission)!,
    value: userPermission,
  });
  return (
    <div className={styles.userRow}>
      <div className={styles.userInfo}>
        <Avatar
          name={props.user.name}
          size="32"
          round={true}
          textSizeRatio={2}
          className={styles.avatar}
        />
        <div>{props.user.name}</div>
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
        isDisabled={false}
        onChange={edit}
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
        appearance="subtle"
        className={styles.removeButton}
        onClick={remove}>
        Remove
      </Button>
    </div>
  );
}
