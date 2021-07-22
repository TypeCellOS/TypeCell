import { Profile } from "@atlaskit/atlassian-navigation";
import {
  DropdownItem,
  DropdownItemGroup,
  DropdownMenuStateless,
} from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import Avatar from "react-avatar";
import { SessionStore } from "../../store/local/SessionStore";
import { NavigationStore } from "../../store/local/navigationStore";
import { saveDocumentToGithub } from "../../github/github";
import { sessionStore } from "../../store/local/stores";

const imgCSS = {
  borderRadius: "100%",
  height: 24,
  width: 24,
  // border: "1px solid #6B778C"
};

export const ProfilePopup = observer(
  (props: { sessionStore: SessionStore; navigationStore: NavigationStore }) => {
    const [isOpen, setIsOpen] = useState(false);

    const onClick = () => {
      setIsOpen(!isOpen);
    };

    /* TODO: props.authStore.user!.firebase.photoURL! */

    return (
      <DropdownMenuStateless
        // placement="bottom-start"
        // content={() => <ProfileContent userStore={props.userStore} />}
        isOpen={isOpen}
        onOpenChange={(e) => setIsOpen(e.isOpen)}
        shouldFlip
        trigger={
          <Profile
            icon={
              <Avatar
                name={sessionStore.loggedInUser?.substr(1)}
                size="32"
                round={true}
                textSizeRatio={2}
              />
            }
            // icon={<img alt="" style={imgCSS} src={""} />}
            onClick={onClick}
            isSelected={isOpen}
            tooltip=""
          />
        }
        position="bottom right">
        <DropdownItem onClick={props.navigationStore.showNewPageDialog}>
          New page
        </DropdownItem>
        {props.navigationStore.currentPage.document && (
          <DropdownItem
            onClick={() =>
              saveDocumentToGithub(
                props.navigationStore.currentPage.owner!,
                props.navigationStore.currentPage.document!
              )
            }>
            Sync to Github
          </DropdownItem>
        )}
        <DropdownItemGroup title={props.sessionStore.loggedInUser!}>
          {" "}
          {/* @${props.authStore.user?.username} */}
          {/* <DropdownItem>Profile</DropdownItem> */}
          {/* <DropdownItem>Account settings</DropdownItem> */}
          <DropdownItem onClick={props.sessionStore.logout}>
            Sign out
          </DropdownItem>
        </DropdownItemGroup>
      </DropdownMenuStateless>
    );
  }
);
