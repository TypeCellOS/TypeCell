import { ModalTransition } from "@atlaskit/modal-dialog";
import { observer } from "mobx-react-lite";
import { getStoreService } from "../../../../store/local/stores";

import { Identifier } from "../../../../identifiers/Identifier";
import { SupabaseSessionStore } from "../../SupabaseSessionStore";
import PermissionsLoader from "./PermissionsLoader";

const PermissionsDialog = observer(
  (props: { isOpen: boolean; close: () => void; identifier: Identifier }) => {
    const sessionStore = getStoreService().sessionStore;
    if (!(sessionStore instanceof SupabaseSessionStore)) {
      throw new Error("sessionStore is not a SupabaseSessionStore");
    }
    const user = sessionStore.user;
    if (typeof user === "string" || user.type === "guest-user") {
      return null;
    }

    return (
      <ModalTransition>
        {props.isOpen && (
          <PermissionsLoader
            currentUserId={user.fullUserId}
            identifier={props.identifier}
            supabaseClient={user.supabase}
            user={user.userId}
            closeCallback={props.close}></PermissionsLoader>
        )}
      </ModalTransition>
    );
  }
);

export default PermissionsDialog;
