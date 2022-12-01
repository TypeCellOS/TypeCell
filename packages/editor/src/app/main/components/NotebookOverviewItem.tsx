import { observer } from "mobx-react-lite";
import { Link, To } from "react-router-dom";
import buttonStyles from "../../../styles/buttons.module.css";
import { toProfilePage } from "../../routes/routes";
import styles from "./NotebookOverviewItem.module.css";

export const NotebookOverviewItem = observer(
  (props: {
    title: string;
    description: string;
    previewImage: string;
    to: To;
    author: { username: string; profileImageUrl?: string };
  }) => {
    return (
      <article className={styles.item}>
        <div className={styles.previewImage}>
          <Link to={props.to}>
            <img src={props.previewImage} alt="Notebook preview" />
          </Link>
        </div>
        <div className="row">
          <h3>{props.title}</h3>
          <p>{props.description}</p>
        </div>
        <div className={styles.bottom + " row"}>
          <Link
            to={toProfilePage("@" + props.author.username)}
            className={styles.owner}>
            <div className={styles.profileImage}>
              {props.author.profileImageUrl ? (
                <img src={props.author.profileImageUrl} alt="Notebook author" />
              ) : (
                <div>
                  <span>{props.author.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <span className={styles.username}>{props.author.username}</span>
          </Link>

          <Link
            className={`${buttonStyles.button} ${buttonStyles.buttonSmall} ${buttonStyles.inverted}`}
            to={props.to}>
            View
          </Link>
        </div>
      </article>
    );
  }
);
