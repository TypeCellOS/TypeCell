import DocumentMenu from "./documentMenu";
import { NotebookOverview } from "./NotebookOverview";
import styles from "./Profile.module.css";
import React from "react";
import UserInfo from "./UserInfo";

interface ProfileProps {
  owner: string;
}

export const Profile = function (props: ProfileProps) {
  return (
    <>
      <DocumentMenu />
      <div className={styles.wrapper}>
        <UserInfo user={props.owner}/>
        <NotebookOverview owner={props.owner} />
      </div>
    </>
  );
};

export default Profile;
