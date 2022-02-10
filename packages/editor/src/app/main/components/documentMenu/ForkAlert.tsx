import { observer } from "mobx-react-lite";
import { BaseResource } from "../../../../store/BaseResource";
import { getStoreService } from "../../../../store/local/stores";
import { UnreachableCaseError } from "../../../../util/UnreachableCaseError";
import EditorWarningIcon from "@atlaskit/icon/glyph/editor/warning";
import styles from "./ForkAlert.module.css";

export const ForkAlert: React.FC<{}> = observer((props) => {
  /* eslint-disable jsx-a11y/anchor-is-valid */
  const navigationStore = getStoreService().navigationStore;
  const sessionStore = getStoreService().sessionStore;

  if (!navigationStore.currentDocument?.needsFork) {
    throw new Error("<ForkAlert /> but no fork needed");
  }

  const forkAction = sessionStore.isLoggedIn ? (
    <a
      href=""
      onClick={async (e) => {
        e.preventDefault();
        if (!navigationStore.currentDocument) {
          throw new Error("unexpected, forking without currentDocument");
        }
        const result = await navigationStore.currentDocument.fork();
        if (result instanceof BaseResource) {
          navigationStore.navigateToDocument(result);
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
        navigationStore.showLoginScreen();
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
          navigationStore.currentDocument?.revert();
          e.preventDefault();
          return false;
        }}>
        <span>revert</span>
      </a>
      )
    </div>
  );
});
