import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { MenuBar } from "./menuBar/MenuBar";
import { NotebookOverview } from "./NotebookOverview";
import styles from "./Profile.module.css";

interface ProfileProps {
  owner: string;
}

export const Profile = function (props: ProfileProps) {
  return (
    <>
      <MenuBar>
        <Breadcrumbs>
          <BreadcrumbsItem
            href=""
            text={props.owner}
            onClick={() => {
              // TODO
              // navigationStore.showProfilePage(
              //   navigationStore.currentPage.owner!
              // );
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
