import React, {ReactElement} from "react";
import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import styles from "./DocumentSettings.module.css";

export default function RestrictionsUser(props: {avatar: ReactElement, name: string, editingRights: string}) {
    return (
        <div className={styles.user}>
            <div className={styles.info}>
                {props.avatar}
                <div>
                    {props.name}
                </div>
            </div>
            <div className={styles.actions}>
                <Select
                    inputId="single-select-example"
                    className={`${styles.select} ${styles.restriction_select}`}
                    classNamePrefix="react-select"
                    inputValue={""}
                    defaultValue={{ label: 'Can view', value: 'public' }}

                    options={[
                        { label: 'Can view', value: 'public' },
                        { label: 'Can edit', value: 'private-edit' },
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
