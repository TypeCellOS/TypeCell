import React from "react";
import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import styles from "./DocumentSettings.module.css";
import Avatar from "react-avatar";
import {DocPermission, UserPermission} from "../PermissionsStore";

export default function Permission(props: {name: string, userPermission: UserPermission, docPermission: DocPermission}) {
    const permissionMap = new Map<UserPermission, {label: string, value: string}>([
        [UserPermission.View, { label: 'Can view', value: 'view' }],
        [UserPermission.Edit, { label: 'Can edit', value: 'edit '}]
    ])

    function maxUserPermission() {
        if (props.docPermission == DocPermission.Public || props.docPermission == DocPermission.PrivateEdit) {
            return UserPermission.Edit;
        }

        return props.userPermission;
    }

    function isDisabled() {
        return props.docPermission == DocPermission.Public || props.docPermission == DocPermission.PrivateEdit;
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
                    defaultValue={permissionMap.get(props.userPermission)}
                    value={permissionMap.get(maxUserPermission())}
                    isDisabled={isDisabled()}

                    options={[
                        { label: 'Can view', value: 'read' },
                        { label: 'Can edit', value: 'write' },
                    ]}
                />
                <Button
                    appearance='subtle'
                    style={{height: '2.5rem', width: '50%', alignItems: 'center'}}
                >
                    Remove
                </Button>
            </div>
        </div>
    )
}
