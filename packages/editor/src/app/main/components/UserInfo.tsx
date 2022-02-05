import styles from "./UserInfo.module.css";
import React, { Fragment, useState } from "react";
import Avatar from "react-avatar";
import Button from "@atlaskit/button";
import Textfield from "@atlaskit/textfield";
import Form, { Field } from "@atlaskit/form";
import TextArea from "@atlaskit/textarea";
import { UserProfileData, userStore } from "../ProfileUtils";
import { getStoreService } from "../../../store/local/stores";

export const UserInfo = function (props: { user: string }) {
  const [editing, setEditing] = useState(false);
  const [editableInfo, setEditableInfo] = useState(getUserProfileData);

  function getUserProfileData(): UserProfileData {
    if (!userStore.userProfileDataIsInitialized(props.user)) {
      userStore.initializeUserProfileData(props.user);
    }
    return userStore.getUserProfileData(props.user);
  }

  function setUserProfileData(newInfo: UserProfileData) {
    userStore.setUserProfileData(props.user, newInfo);
    setEditableInfo(newInfo);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={styles.userInfo}>
        <Avatar
          className={styles.avatar}
          name={editableInfo.name}
          size="128"
          round={true}
          textSizeRatio={1.6}
        />
        <Form onSubmit={setUserProfileData}>
          {({ formProps }: any) => (
            <form {...formProps}>
              <Field
                label={"Name"}
                name={"name"}
                defaultValue={editableInfo.name}>
                {({ fieldProps }: any) => (
                  <Fragment>
                    <Textfield placeholder={"Name"} {...fieldProps} />
                  </Fragment>
                )}
              </Field>
              <Field label={"Bio"} name={"bio"} defaultValue={editableInfo.bio}>
                {({ fieldProps }: any) => (
                  <Fragment>
                    <TextArea
                      placeholder={"Add a bio"}
                      minimumRows={3}
                      {...fieldProps}
                    />
                  </Fragment>
                )}
              </Field>
              <Field
                label={"Links"}
                name={"github"}
                defaultValue={editableInfo.github}>
                {({ fieldProps }: any) => (
                  <Fragment>
                    <Textfield
                      className={styles.link}
                      placeholder={"GitHub"}
                      {...fieldProps}
                    />
                  </Fragment>
                )}
              </Field>
              <Field name={"twitter"} defaultValue={editableInfo.twitter}>
                {({ fieldProps }: any) => (
                  <Fragment>
                    <Textfield
                      className={styles.link}
                      placeholder={"Twitter"}
                      {...fieldProps}
                    />
                  </Fragment>
                )}
              </Field>
              <div className={styles.formButtons}>
                <Button onClick={() => setEditing(false)} appearance={"subtle"}>
                  Cancel
                </Button>
                <Button type={"submit"} appearance={"primary"}>
                  Save
                </Button>
              </div>
            </form>
          )}
        </Form>
      </div>
    );
  }

  return (
    <div className={styles.userInfo}>
      <Avatar
        className={styles.avatar}
        name={editableInfo.name}
        size="128"
        round={true}
        textSizeRatio={1.6}
      />
      <div className={styles.textInfo}>
        <div className={styles.infoBlock}>
          <h3>{editableInfo.name}</h3>
          <div>{props.user}</div>
        </div>
        <div className={styles.separator} />
        {editableInfo.bio !== "" ? (
          <>
            <div className={styles.infoBlock}>{editableInfo.bio}</div>
            <div className={styles.separator} />
          </>
        ) : (
          <></>
        )}
        {editableInfo.github !== "" || editableInfo.twitter !== "" ? (
          <>
            <div className={styles.infoBlock}>
              {editableInfo.github !== "" ? (
                <div>
                  <a href={editableInfo.github}>GitHub</a>
                </div>
              ) : (
                <></>
              )}
              {editableInfo.twitter !== "" ? (
                <div>
                  <a href={editableInfo.twitter}>Twitter</a>
                </div>
              ) : (
                <></>
              )}
              <div className={styles.separator} />
            </div>
          </>
        ) : (
          <></>
        )}
        {getStoreService().sessionStore.isLoggedIn &&
        props.user === getStoreService().sessionStore.loggedInUserId ? (
          <Button onClick={() => setEditing(true)}>Edit Profile</Button>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
