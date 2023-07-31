/* eslint-disable jsx-a11y/anchor-is-valid */

import DropdownMenu, { DropdownItem } from "@atlaskit/dropdown-menu";

import { observer } from "mobx-react-lite";
import React from "react";
import { VscKebabVertical } from "react-icons/vsc";
import { useLocation, useNavigate } from "react-router-dom";
import { Identifier } from "../../../../identifiers/Identifier";
import { MatrixIdentifier } from "../../../../identifiers/MatrixIdentifier";
import { openAsMarkdown } from "../../../../integrations/markdown/export";
import { DocumentResource } from "../../../../store/DocumentResource";
import { SessionStore } from "../../../../store/local/SessionStore";
import {
  ClosePermissionsDialog,
  IsPermissionsDialogOpen,
  OpenPermissionsDialog,
} from "../../../routes/routes";
import { MenuBar } from "../menuBar/MenuBar";

import { TypeCellIdentifier } from "../../../../identifiers/TypeCellIdentifier";
import { SupabaseSessionStore } from "../../../supabase-auth/SupabaseSessionStore";
import SupabasePermissionsDialog from "../../../supabase-auth/routes/permissions/PermissionsDialog";
import { Breadcrumb } from "./Breadcrumb";
import styles from "./DocumentMenu.module.css";
import { ForkAlert } from "./ForkAlert";
import { ShareButton } from "./ShareButton";

type Props = {
  document: DocumentResource;
  sessionStore: SessionStore;
};

// TODO: move?
function userCanEditPermissions(
  sessionStore: SessionStore,
  identifier: Identifier
) {
  if (identifier && identifier instanceof MatrixIdentifier) {
    return sessionStore.loggedInUserId === identifier.owner;
  }
  return true;
  // TODO
  // if (identifier && identifier instanceof TypeCellIdentifier) {
  //   return sessionStore.loggedInUserId === identifier.owner;
  // }
  // return false;
}

export const DocumentMenu: React.FC<Props> = observer((props) => {
  const { sessionStore } = props;
  const canEditPermissions = userCanEditPermissions(
    sessionStore,
    props.document.identifier
  );
  let location = useLocation();
  let navigate = useNavigate();

  let permissionsArea: any;
  if (
    props.document.identifier instanceof TypeCellIdentifier &&
    sessionStore instanceof SupabaseSessionStore
  ) {
    permissionsArea = (
      <SupabasePermissionsDialog
        close={() => ClosePermissionsDialog(navigate)}
        isOpen={IsPermissionsDialogOpen(location)}
        identifier={props.document.identifier}
        sessionStore={sessionStore}
      />
    );
  } else {
    throw new Error("unexpected types");
  }

  return (
    <MenuBar>
      <Breadcrumb sessionStore={sessionStore} />

      {props.document.needsFork && (
        <ForkAlert document={props.document} sessionStore={sessionStore} />
      )}

      <aside className={styles.actions}>
        <ul>
          <li className={styles.item}>
            <ShareButton />
          </li>

          <li className={styles.separator}></li>
          <li className={styles.options}>
            <DropdownMenu
              shouldFlip
              trigger={({ triggerRef, isSelected, testId, ...props }) => (
                <div
                  {...props}
                  ref={triggerRef as any}
                  style={{ paddingRight: "0.5em", paddingLeft: "1em" }}>
                  <VscKebabVertical
                    title="Options"
                    style={{ fontSize: "14px", transform: "scale(1.3)" }}
                  />
                </div>
              )}
              placement="bottom-end">
              <DropdownItem onClick={() => openAsMarkdown(props.document!.doc)}>
                Export as markdown
              </DropdownItem>
              {canEditPermissions && (
                <DropdownItem onClick={() => OpenPermissionsDialog(navigate)}>
                  Permissions
                </DropdownItem>
              )}
            </DropdownMenu>
          </li>
        </ul>
      </aside>
      {canEditPermissions && permissionsArea}
    </MenuBar>
  );
});
