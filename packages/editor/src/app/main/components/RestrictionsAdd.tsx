import React, {ReactElement} from "react";
import Button from "@atlaskit/button";
import Select from "@atlaskit/select";
import styles from "./DocumentSettings.module.css";
import { IntlProvider } from "react-intl-next";
import UserPicker from "@atlaskit/user-picker";

export default function RestrictionsAdd() {
    return (
        <div className={styles.user}>
            <div className={styles.info}>
                <IntlProvider locale="en">
                    <UserPicker
                        fieldId="example"
                        onChange={console.log}
                        allowEmail

                        // options={}
                    />
                </IntlProvider>
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
                    style={{height: '2.5rem', width: '50%', alignItems: 'center'}}
                >
                    Add
                </Button>
            </div>
        </div>
    )
}
