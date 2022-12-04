/* eslint-disable jsx-a11y/anchor-is-valid */

import { observer } from "mobx-react-lite";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Identifier } from "../../../../identifiers/Identifier";
import { MatrixIdentifier } from "../../../../identifiers/MatrixIdentifier";
import { DocumentResource } from "../../../../store/DocumentResource";
import { SessionStore } from "../../../../store/local/SessionStore";
import { getStoreService } from "../../../../store/local/stores";
import { MenuBar } from "../menuBar/MenuBar";
import { GPTArea } from "./GPTArea";

type Props = {
  document: DocumentResource;
};

// TODO: move?
function userCanEditPermissions(
  sessionStore: SessionStore,
  identifier: Identifier
) {
  if (identifier && identifier instanceof MatrixIdentifier) {
    return sessionStore.loggedInUserId === identifier.owner;
  }
  return false;
}

export const DocumentMenu: React.FC<Props> = observer((props) => {
  const sessionStore = getStoreService().sessionStore;
  const canEditPermissions = userCanEditPermissions(
    sessionStore,
    props.document.identifier
  );
  let location = useLocation();
  let navigate = useNavigate();
  return (
    <MenuBar>
      <GPTArea document={props.document} />
      {/* <Breadcrumb identifier={props.document.identifier} /> */}
      {/* {props.document.connection!.needsFork && ( 
        // <ForkAlert document={props.document} />
      )}*/}

      {/*<aside className={styles.actions}>
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
      {canEditPermissions && (
        <PermissionsDialog
          close={() => ClosePermissionsDialog(navigate)}
          isOpen={IsPermissionsDialogOpen(location)}
          connection={props.document.connection!}
        />
      )}*/}
    </MenuBar>
  );
});
