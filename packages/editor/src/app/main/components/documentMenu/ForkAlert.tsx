import { observer } from "mobx-react-lite";
import { BaseResource } from "../../../../store/BaseResource";
import { getStoreService } from "../../../../store/local/stores";
import { UnreachableCaseError } from "../../../../util/UnreachableCaseError";
import EditorWarningIcon from "@atlaskit/icon/glyph/editor/warning";
import styles from "./ForkAlert.module.css";
import { DocumentResource } from "../../../../store/DocumentResource";
import { useNavigate } from "react-router-dom";
import { gotoDocument, gotoLoginScreen } from "../../../routes/routes";

export const ForkAlert = observer((props: { document: DocumentResource }) => {
  /* eslint-disable jsx-a11y/anchor-is-valid */
  const sessionStore = getStoreService().sessionStore;
  const navigate = useNavigate();

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
          gotoDocument(navigate, result);
        } else {
          if (result.status !== "error") {
            throw new UnreachableCaseError(result.status);
          }
          throw new Error("error while forking");
        }
        return false;
      }}>
      <span>save a copy</span>
    </a>
  ) : (
    <a
      href=""
      onClick={(e) => {
        gotoLoginScreen(navigate);
        e.preventDefault();
        return false;
      }}>
      <span>sign in to save a copy</span>
    </a>
  );

  return (
    <div className={styles.fork_alert} data-test="forkAlert">
      <div style={{ paddingTop: 1, marginRight: 3 }}>
        <EditorWarningIcon size="small" label="Warning" />
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
