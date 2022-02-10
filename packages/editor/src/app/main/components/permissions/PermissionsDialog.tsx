import { ModalTransition } from "@atlaskit/modal-dialog";
import { observer } from "mobx-react-lite";
import React from "react";
import { getStoreService } from "../../../../store/local/stores";
import PermissionsLoader from "./PermissionsLoader";

const PermissionsDialog = observer(
  (props: { isOpen: boolean; close: () => void }) => {
    const sessionStore = getStoreService().sessionStore;
    const navigationStore = getStoreService().navigationStore;
    const user = sessionStore.user;
    if (typeof user === "string" || user.type === "guest-user") {
      throw new Error("can't access permissions when not signed in");
    }
    if (!navigationStore.currentDocument) {
      throw new Error("no document available");
    }
    return (
      <ModalTransition>
        {props.isOpen && (
          <PermissionsLoader
            currentUserId={user.fullUserId}
            document={navigationStore.currentDocument}
            matrixClient={user.matrixClient}
            user={user.userId}
            closeCallback={props.close}></PermissionsLoader>
        )}
      </ModalTransition>
    );
  }
);

export default PermissionsDialog;
