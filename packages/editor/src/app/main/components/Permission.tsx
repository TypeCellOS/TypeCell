import React, {useState} from "react";
import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import styles from "./DocumentSettings.module.css";
import Avatar from "react-avatar";
import {DocPermission, permissionsStore, UserPermission} from "../PermissionsStore";
import {lockPermission, permissionMap } from "./PermissionSettings";

export default function Permission(props: {
    name: string,
    userPermission: UserPermission,
    docPermission: DocPermission,
    editCallback: (user: string, permission: UserPermission) => void,
    removeCallback: (user: string) => void}) {

    // State and functions for storing & updating whether each specific user can read/write to the page.
    const [permission, setPermission] = useState(lockPermission(props.docPermission) ?
        UserPermission.Edit :
        props.userPermission);

    function updatePermission(permission: {label: string, value: string} | null) {
        setPermission(permission!.value as UserPermission);
    }

    function edit(e: any) {
        props.editCallback(props.name, permission);
    }

    function remove(e: any) {
        props.removeCallback(props.name);
    }

    return (
        <div className={styles.user}>
            <div className={styles.info}>
                <Avatar
                    name={props.name}
                    size="32"
                    round={true}
                    textSizeRatio={2}
                    className={styles.avatar}
                />
                <div>
                    {props.name}
                </div>
            </div>
            <div className={styles.actions}>
                <Select
                    inputId='single-select-example'
                    className={`${styles.select} ${styles.restriction_select}`}
                    classNamePrefix='react-select'
                    inputValue={''} // For disabling user keyboard input.
                    defaultValue={permissionMap.get(permission)}
                    value={lockPermission(props.docPermission) ?
                        permissionMap.get(UserPermission.Edit) :
                        permissionMap.get(permission)}
                    isDisabled={lockPermission(props.docPermission)}

                    onChange={updatePermission}

                    options={[
                        { label: 'Can view', value: 'view' },
                        { label: 'Can edit', value: 'edit' },
                    ]}
                />
                <Button
                    appearance='subtle'
                    style={{height: '2.5rem', width: '50%', alignItems: 'center'}}
                    onClick={remove}
                >
                    Remove
                </Button>
            </div>
        </div>
    )
}
