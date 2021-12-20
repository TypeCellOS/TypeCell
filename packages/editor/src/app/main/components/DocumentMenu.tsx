/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */
import { observer } from "mobx-react-lite";
import React from "react";
import { getStoreService } from "../../../store/local/stores";
import styles from "./DocumentMenu.module.css";
import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { DocConnection } from "../../../store/DocConnection";
import { FileIdentifier } from "../../../identifiers/FileIdentifier";
import { GithubIdentifier } from "../../../identifiers/GithubIdentifier";
import { HttpsIdentifier } from "../../../identifiers/HttpsIdentifier";
import { MatrixIdentifier } from "../../../identifiers/MatrixIdentifier";
import MoreVerticalIcon from "@atlaskit/icon/glyph/more-vertical";
import ShareIcon from "@atlaskit/icon/glyph/share";
import DropdownMenu, { DropdownItem } from "@atlaskit/dropdown-menu";
import { openAsMarkdown } from "../../../integrations/markdown/export";
import { DocumentResource } from "../../../store/DocumentResource";
import { BaseResource } from "../../../store/BaseResource";
import { UnreachableCaseError } from "../../../util/UnreachableCaseError";
import EditorWarningIcon from "@atlaskit/icon/glyph/editor/warning";

type Props = {
  document: DocumentResource;
};

export const DocumentMenu: React.FC<Props> = observer((props) => {
  const navigationStore = getStoreService().navigationStore;
  const sessionStore = getStoreService().sessionStore;

  const getForkAlert = function () {
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
      navigationStore.currentDocument?.needsFork && (
        <div className={styles.fork_alert}>
          <EditorWarningIcon size="small" label="Warning"></EditorWarningIcon>
          Usaved changes ({forkAction}/
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
      )
    );
  };

  const getBreadcrumbItems = function (docConnection: DocConnection) {
    const { identifier } = docConnection;
    const { path } = identifier.uri;

    if (
      identifier instanceof FileIdentifier ||
      identifier instanceof GithubIdentifier ||
      identifier instanceof HttpsIdentifier
    ) {
      // Show path as single item
      return (
        <BreadcrumbsItem
          text={path} // Replace default componnent so it doesn't render as a link
          component={() => <span>{path}</span>}
        />
      );
    } else if (identifier instanceof MatrixIdentifier) {
      return (
        <>
          <BreadcrumbsItem
            href=""
            text={identifier.owner}
            onClick={() => {
              navigationStore.showProfilePage(identifier.owner);
            }}
          />
          <BreadcrumbsItem
            text={identifier.document}
            // Replace default componnent so it doesn't render as a link
            component={() => <span>{identifier.document}</span>}
          />
        </>
      );
    }
  };

  return (
    <nav className={styles.menu}>
      <Breadcrumbs>
        {getBreadcrumbItems(navigationStore.currentDocument!)}
      </Breadcrumbs>

      {getForkAlert()}

      <aside className={styles.actions}>
        <ul>
          <li className={styles.item}>
            <div className={styles.icon}>
              <ShareIcon size="small" label="Share" primaryColor="#bdbdbd" />
            </div>
            <span>Share</span>
          </li>
          {props.document.type === "!notebook" ? (
            <>
              <li className={styles.separator}></li>
              <li className={styles.options}>
                <DropdownMenu
                  shouldFlip
                  trigger={
                    <MoreVerticalIcon primaryColor="#bdbdbd" label="Options" />
                  }
                  position="bottom right">
                  <DropdownItem onClick={() => openAsMarkdown(props.document)}>
                    Export as markdown
                  </DropdownItem>
                  {/* TODO <DropdownItem>Change permissions</DropdownItem> */}
                </DropdownMenu>
              </li>
            </>
          ) : (
            ""
          )}
        </ul>
      </aside>
    </nav>
  );
});
