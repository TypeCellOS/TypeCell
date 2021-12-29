import { observer } from "mobx-react-lite";
import { getStoreService } from "../../../store/local/stores";
import styles from "./NotebookOverviewItem.module.css";

export const NotebookOverviewItem = observer(
  (props: {
    title: string;
    description: string;
    previewImageUrl: string;
    onClick: () => void;
    author: { username: string; profileImageUrl?: string };
  }) => {
    const { navigationStore } = getStoreService();

    function onClick(e: any) {
      e.preventDefault();
      props.onClick();
    }

    return (
      <article className={styles.item}>
        <div className={styles.previewImage}>
          <a href="/" onClick={onClick}>
            <img src={props.previewImageUrl} alt="Notebook preview" />
          </a>
        </div>
        <div className="row">
          <h3>{props.title}</h3>
          <p>{props.description}</p>
        </div>
        <div className={styles.bottom + " row"}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Show profile page
            }}
            className={styles.owner}>
            <div className={styles.profileImage}>
              {props.author.profileImageUrl ? (
                <img src={props.author.profileImageUrl} alt="Notebook author" />
              ) : (
                <div>
                  <span>{props.author.username.charAt(0)}</span>
                </div>
              )}
            </div>
            <span>{props.author.username}</span>
          </a>

          <a className="button inverted" href="/" onClick={onClick}>
            View
          </a>
        </div>
      </article>
    );
  }
);
