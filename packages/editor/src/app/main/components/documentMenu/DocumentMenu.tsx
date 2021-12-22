/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */

import DropdownMenu, { DropdownItem } from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscEllipsis } from "react-icons/vsc";
import { openAsMarkdown } from "../../../../integrations/markdown/export";
import { BaseResource } from "../../../../store/BaseResource";
import { DocumentResource } from "../../../../store/DocumentResource";
import { getStoreService } from "../../../../store/local/stores";
import { Breadcrumb } from "./Breadcrumb";
import styles from "./DocumentMenu.module.css";
import { ForkAlert } from "./ForkAlert";

type Props = {
  document: BaseResource;
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
            {/* <div className={styles.icon}>
              <ShareIcon size="small" label="Share" primaryColor="#bdbdbd" />
            </div> */}
            <span>Share</span>
          </li>
          {props.document instanceof DocumentResource ? (
            <>
              <li className={styles.options}>
                <DropdownMenu
                  shouldFlip
                  trigger={
                    <VscEllipsis
                      title="Options"
                      // style={{ width: "10px", height: "10px" }}
                    />
                  }
                  position="bottom right">
                  <DropdownItem
                    onClick={() => openAsMarkdown(props.document.doc)}>
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
