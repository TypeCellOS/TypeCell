import { NotebookOverview } from "./NotebookOverview";
import styles from "./Profile.module.css";

interface ProfileProps {
    owner: string,
}

export const Profile = function (props: ProfileProps) {
    return <div className={styles.wrapper}>
        <NotebookOverview owner={props.owner} />
    </div>;
}

export default Profile;