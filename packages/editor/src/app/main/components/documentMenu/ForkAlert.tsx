import { when } from "mobx";
import { observer } from "mobx-react-lite";
import { VscWarning } from "react-icons/vsc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DocumentResource } from "../../../../store/DocumentResource";

import { SessionStore } from "../../../../store/local/SessionStore";
import { toDocument, toRegisterScreen } from "../../../routes/routes";
import styles from "./ForkAlert.module.css";

export const ForkAlert = observer(
  (props: { document: DocumentResource; sessionStore: SessionStore }) => {
    /* eslint-disable jsx-a11y/anchor-is-valid */
    const { sessionStore } = props;
    const navigate = useNavigate();
    const location = useLocation();

    if (!props.document.needsFork) {
      throw new Error("<ForkAlert /> but no fork needed");
    }

    const forkAction = sessionStore.isLoggedIn ? (
      <a
        href=""
        onClick={async (e) => {
          e.preventDefault();

          const result = await props.document.fork();

          when(
            () => !!sessionStore.profile,
            () => {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              sessionStore.profile!.forks.set(
                result.identifier.toString(),
                result.identifier.toString()
              );
            }
          );

          navigate(toDocument(result));

          return false;
        }}>
        <span>save a copy</span>
      </a>
    ) : (
      <Link to={toRegisterScreen()} state={{ from: location }}>
        <span>sign up to save a copy</span>
      </Link>
    );

    return (
      <div className={styles.fork_alert} data-test="forkAlert">
        <div style={{ paddingTop: 3, marginRight: 3 }}>
          <VscWarning size={12} title="Warning" />
        </div>
        Unsaved changes ({forkAction}/
        <a
          href=""
          onClick={(e) => {
            props.document.revert();
            e.preventDefault();
            return false;
          }}>
          <span>revert</span>
        </a>
        )
      </div>
    );
  }
);
