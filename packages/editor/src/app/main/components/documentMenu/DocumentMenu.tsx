/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */

import DropdownMenu, { DropdownItem } from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscKebabVertical } from "react-icons/vsc";
import { openAsMarkdown } from "../../../../integrations/markdown/export";
import { BaseResource } from "../../../../store/BaseResource";
import { DocumentResource } from "../../../../store/DocumentResource";
import { getStoreService } from "../../../../store/local/stores";
import { Breadcrumb } from "./Breadcrumb";
import styles from "./DocumentMenu.module.css";
import { ForkAlert } from "./ForkAlert";
import { ShareButton } from "./ShareButton";

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
            <ShareButton />
          </li>
          {props.document instanceof DocumentResource ? (
            <>
              <li className={styles.separator}></li>
              <li className={styles.options}>
                <DropdownMenu
                  shouldFlip
                  trigger={
                    <div style={{ paddingRight: "0.5em", paddingLeft: "1em;" }}>
                      <VscKebabVertical
                        title="Options"
                        style={{ fontSize: "14px", transform: "scale(1.3)" }}
                      />
                    </div>
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
