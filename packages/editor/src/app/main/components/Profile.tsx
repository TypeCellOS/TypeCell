import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { useNavigate } from "react-router-dom";
import { SessionStore } from "../../../store/local/SessionStore";

import { toProfilePage } from "../../routes/routes";
import styles from "./Profile.module.css";
import { MenuBar } from "./menuBar/MenuBar";

interface ProfileProps {
  owner: string;
  sessionStore: SessionStore;
}

export const Profile = function (props: ProfileProps) {
  const navigate = useNavigate();
  return (
    <>
      <MenuBar>
        <Breadcrumbs>
          <BreadcrumbsItem
            href=""
            text={props.owner}
            onClick={(e) => {
              navigate(toProfilePage(props.owner));
              e.preventDefault();
            }}
          />
        </Breadcrumbs>
      </MenuBar>
      <div className={styles.wrapper}>
        {/* <NotebookOverview
          owner={props.owner}
          sessionStore={props.sessionStore}
        /> */}
      </div>
    </>
  );
};

export default Profile;
