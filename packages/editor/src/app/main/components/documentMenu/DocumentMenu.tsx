/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */

import DropdownMenu, { DropdownItem } from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscKebabVertical } from "react-icons/vsc";
import { openAsMarkdown } from "../../../../integrations/markdown/export";
import { DocumentResource } from "../../../../store/DocumentResource";
import { getStoreService } from "../../../../store/local/stores";
import { Breadcrumb } from "./Breadcrumb";
import styles from "./DocumentMenu.module.css";
import { ForkAlert } from "./ForkAlert";
import { ShareButton } from "./ShareButton";

type Props = {
  document: DocumentResource;
};

export const DocumentMenu: React.FC<Props> = observer((props) => {
  const navigationStore = getStoreService().navigationStore;

  return (
    <nav className={styles.menu}>
      <Breadcrumb />
      {navigationStore.currentDocument?.needsFork && <ForkAlert />}

      <aside className={styles.actions}>
        <ul>
          <li className={styles.item}>
            <ShareButton />
          </li>
          <li className={styles.separator}></li>
          {props.document.type === "!notebook" ? (
            <>
              <li className={styles.options}>
                <DropdownMenu
                  shouldFlip
                  trigger={
                    <VscKebabVertical
                      title="Options"
                      style={{ fontSize: "14px", transform: "scale(1.5)" }}
                    />
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
