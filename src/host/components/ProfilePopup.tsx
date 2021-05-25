import { Profile } from "@atlaskit/atlassian-navigation";
import {
  DropdownItem,
  DropdownItemGroup,
  DropdownMenuStateless,
} from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { authStore, AuthStore } from "../../matrix/AuthStore";
import { NavigationStore } from "../../store/local/navigationStore";

const imgCSS = {
  borderRadius: "100%",
  height: 24,
  width: 24,
  // border: "1px solid #6B778C"
};

export const ProfilePopup = observer(
  (props: { authStore: AuthStore; navigationStore: NavigationStore }) => {
    const [isOpen, setIsOpen] = useState(false);

    const onClick = () => {
      setIsOpen(!isOpen);
    };

    {
      /* TODO: props.authStore.user!.firebase.photoURL! */
    }
    return (
      <DropdownMenuStateless
        // placement="bottom-start"
        // content={() => <ProfileContent userStore={props.userStore} />}
        isOpen={isOpen}
        onOpenChange={(e) => setIsOpen(e.isOpen)}
        shouldFlip
        trigger={
          <Profile
            icon={<img alt="" style={imgCSS} src={""} />}
            onClick={onClick}
            isSelected={isOpen}
            tooltip=""
          />
        }
        position="bottom right">
        <DropdownItem onClick={props.navigationStore.showNewPageDialog}>
          New page
        </DropdownItem>
        <DropdownItemGroup title={authStore.loggedInUser!}>
          {" "}
          {/* @${props.authStore.user?.username} */}
          {/* <DropdownItem>Profile</DropdownItem> */}
          {/* <DropdownItem>Account settings</DropdownItem> */}
          <DropdownItem onClick={props.authStore.logout}>Sign out</DropdownItem>
        </DropdownItemGroup>
      </DropdownMenuStateless>
    );
  }
);
