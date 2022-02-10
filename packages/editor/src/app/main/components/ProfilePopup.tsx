import { Profile } from "@atlaskit/atlassian-navigation";
import {
  DropdownItem,
  DropdownItemGroup,
  DropdownMenuStateless,
} from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import Avatar from "react-avatar";
import { NavigationStore } from "../../../store/local/navigationStore";
import { SessionStore } from "../../../store/local/SessionStore";
import { getStoreService } from "../../../store/local/stores";

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
            testId="profile-button"
            icon={
              <Avatar
                name={getStoreService().sessionStore.loggedInUserId?.substring(
                  1
                )}
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
        <DropdownItem onClick={props.navigationStore.showNewNotebookDialog}>
          New notebook
        </DropdownItem>
        {props.navigationStore.menuPortalChildren.map((c) => c.children)}
        <DropdownItemGroup title={props.sessionStore.loggedInUserId!}>
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
