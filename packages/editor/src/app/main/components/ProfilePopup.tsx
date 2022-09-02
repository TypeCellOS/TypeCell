import { Profile } from "@atlaskit/atlassian-navigation";
import DropdownMenu, {
  DropdownItem,
  DropdownItemGroup,
} from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import { SessionStore } from "../../../store/local/SessionStore";
import { getStoreService } from "../../../store/local/stores";
import { OpenNewPageDialog } from "../../routes/routes";

export const ProfilePopup = observer(
  (props: { sessionStore: SessionStore }) => {
    const navigate = useNavigate();
    const navigationStore = getStoreService().navigationStore;

    /* TODO: props.authStore.user!.firebase.photoURL! */
    return (
      <DropdownMenu
        trigger={(props) => {
          const { triggerRef, isSelected, testId, ...passProps } = props;
          return (
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
              ref={props.triggerRef}
              {...passProps}
              // icon={<img alt="" style={imgCSS} src={""} />}
              tooltip=""
            />
          );
        }}
        placement="bottom-end">
        <DropdownItem onClick={() => OpenNewPageDialog(navigate)}>
          New page
        </DropdownItem>
        {navigationStore.menuPortalChildren.map((c) => c.children)}
        <DropdownItemGroup title={props.sessionStore.loggedInUserId!}>
          {" "}
          {/* @${props.authStore.user?.username} */}
          {/* <DropdownItem>Profile</DropdownItem> */}
          {/* <DropdownItem>Account settings</DropdownItem> */}
          <DropdownItem onClick={props.sessionStore.logout}>
            Sign out
          </DropdownItem>
        </DropdownItemGroup>
      </DropdownMenu>
    );
  }
);
