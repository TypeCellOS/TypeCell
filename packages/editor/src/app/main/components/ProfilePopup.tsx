import { Profile } from "@atlaskit/atlassian-navigation";
import DropdownMenu, {
  DropdownItem,
  DropdownItemGroup,
} from "@atlaskit/dropdown-menu";
import { observer } from "mobx-react-lite";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import { SessionStore } from "../../../store/local/SessionStore";
import { toProfilePage } from "../../routes/routes";

export const ProfilePopup = observer(
  (props: { sessionStore: SessionStore }) => {
    const navigate = useNavigate();

    /* TODO: props.authStore.user!.firebase.photoURL! */
    return (
      <DropdownMenu
        spacing="compact"
        trigger={(innerProps) => {
          const { triggerRef, isSelected, testId, ...passProps } = innerProps;
          return (
            <Profile
              testId="profile-button"
              icon={
                <Avatar
                  name={props.sessionStore.loggedInUserId}
                  src={props.sessionStore.profile?.avatar_url || undefined}
                  size="32"
                  round={true}
                  textSizeRatio={2}
                />
              }
              ref={triggerRef}
              {...passProps}
              // icon={<img alt="" style={imgCSS} src={""} />}
              tooltip=""
            />
          );
        }}
        placement="bottom-end">
        {/* <DropdownItem onClick={() => OpenNewPageDialog(navigate)}>
          New page
        </DropdownItem> */}
        <DropdownItemGroup
          title={"@" + props.sessionStore.loggedInUserId || ""}>
          {/* @${props.authStore.user?.username} */}
          <DropdownItem
            onClick={() => {
              navigate(toProfilePage("@" + props.sessionStore.loggedInUserId));
            }}>
            Profile
          </DropdownItem>
          {/* <DropdownItem>Account settings</DropdownItem> */}
          <DropdownItem onClick={props.sessionStore.logout}>
            Sign out
          </DropdownItem>
        </DropdownItemGroup>
      </DropdownMenu>
    );
  }
);
