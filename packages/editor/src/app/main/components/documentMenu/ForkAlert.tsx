import { observer } from "mobx-react-lite";
import { VscWarning } from "react-icons/vsc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BaseResource } from "../../../../store/BaseResource";
import { DocumentResource } from "../../../../store/DocumentResource";
import { getStoreService } from "../../../../store/local/stores";
import { UnreachableCaseError } from "../../../../util/UnreachableCaseError";
import { toDocument, toLoginScreen } from "../../../routes/routes";
import styles from "./ForkAlert.module.css";

export const ForkAlert = observer((props: { document: DocumentResource }) => {
  /* eslint-disable jsx-a11y/anchor-is-valid */
  const sessionStore = getStoreService().sessionStore;
  const navigate = useNavigate();
  const location = useLocation();

  if (!props.document.connection?.needsFork) {
    throw new Error("<ForkAlert /> but no fork needed");
  }

  const forkAction = sessionStore.isLoggedIn ? (
    <a
      href=""
      onClick={async (e) => {
        e.preventDefault();
        if (!props.document.connection) {
          throw new Error("unexpected, forking without currentDocument");
        }
        const result = await props.document.connection.fork();
        if (result instanceof BaseResource) {
          navigate(toDocument(result));
        } else {
          if (result !== "error") {
            throw new UnreachableCaseError(result);
          }
          throw new Error("error while forking");
        }
        return false;
      }}>
      <span>save a copy</span>
    </a>
  ) : (
    <Link to={toLoginScreen()} state={{ from: location }}>
      <span>sign in to save a copy</span>
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
          if (!props.document.connection) {
            throw new Error("unexpected, revert without currentDocument");
          }
          props.document.connection.revert();
          e.preventDefault();
          return false;
        }}>
        <span>revert</span>
      </a>
      )
    </div>
  );
});
