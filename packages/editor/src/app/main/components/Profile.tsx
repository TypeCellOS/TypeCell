import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { useNavigate } from "react-router-dom";
import { NotebookOverview } from "../../matrix-auth/routes/overview/NotebookOverview";
import { toProfilePage } from "../../routes/routes";
import styles from "./Profile.module.css";
import { MenuBar } from "./menuBar/MenuBar";

interface ProfileProps {
  owner: string;
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
        <NotebookOverview owner={props.owner} />
      </div>
    </>
  );
};

export default Profile;
