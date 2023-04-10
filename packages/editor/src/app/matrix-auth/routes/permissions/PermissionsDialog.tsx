import { ModalTransition } from "@atlaskit/modal-dialog";
import { observer } from "mobx-react-lite";
import { DocConnection } from "../../../../store/DocConnection";
import { getStoreService } from "../../../../store/local/stores";
import { MatrixSessionStore } from "../../MatrixSessionStore";
import PermissionsLoader from "./PermissionsLoader";

const PermissionsDialog = observer(
  (props: {
    isOpen: boolean;
    close: () => void;
    connection: DocConnection;
  }) => {
    const sessionStore = getStoreService().sessionStore;
    if (!(sessionStore instanceof MatrixSessionStore)) {
      throw new Error("sessionStore is not a MatrixSessionStore");
    }
    const user = sessionStore.user;
    if (typeof user === "string" || user.type === "guest-user") {
      throw new Error("can't access permissions when not signed in");
    }

    return (
      <ModalTransition>
        {props.isOpen && (
          <PermissionsLoader
            currentUserId={user.fullUserId}
            document={props.connection}
            matrixClient={user.matrixClient}
            user={user.userId}
            closeCallback={props.close}></PermissionsLoader>
        )}
      </ModalTransition>
    );
  }
);

export default PermissionsDialog;
