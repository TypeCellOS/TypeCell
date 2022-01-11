/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */
import {
  AtlassianNavigation,
  PrimaryButton,
} from "@atlaskit/atlassian-navigation";
import { observer } from "mobx-react-lite";
import { VscSignIn } from "react-icons/vsc";
import { getStoreService } from "../../../store/local/stores";
import { ProfilePopup } from "./ProfilePopup";
import DocumentSettings from "./DocumentSettings";
import { Logo } from "./Logo";
import {SessionStore} from "../../../store/local/SessionStore";
import {NavigationStore} from "../../../store/local/navigationStore";
import {MatrixIdentifier} from "../../../identifiers/MatrixIdentifier";

const ProductHome = () => {
  return (
    <>
      <Logo></Logo>
      <span style={{ fontWeight: "bold", marginTop: 3, marginLeft: 10 }}>
        {" "}
        Alpha community preview
      </span>
    </>
  );
};

const AN = AtlassianNavigation as any;

function userIsPageOwner(sessionStore: SessionStore, navigationStore: NavigationStore) {
    const id = navigationStore.currentPage.identifier as MatrixIdentifier;
    console.log(id)
    console.log(sessionStore.loggedInUserId)
    return sessionStore.loggedInUserId === id.owner;
}

export const Navigation = observer(() => {
  const sessionStore = getStoreService().sessionStore;
  const navigationStore = getStoreService().navigationStore;

  return (
    <AN
      renderProductHome={ProductHome}
      primaryItems={[]}
      renderProfile={observer(() => (
        <>
          {sessionStore.isLoggedIn && (
            <ProfilePopup
              navigationStore={navigationStore}
              sessionStore={sessionStore}
            />
          )}
        </>
      ))}
      renderSettings={observer(() => (
        <>
          {navigationStore.currentPage.page !== 'root' &&
          userIsPageOwner(sessionStore, navigationStore) &&
          (<DocumentSettings user={sessionStore.loggedInUserId}/>)}
        </>
      ))}
      renderSignIn={observer(() => (
        <>
          {!sessionStore.isLoggedIn && (
            <PrimaryButton
              onClick={navigationStore.showLoginScreen}
              iconBefore={
                <VscSignIn style={{ width: "16px", height: "16px" }} />
              }>
              {" "}
              Sign in{" "}
              {/* {typeof sessionStore.user === "string"
                ? sessionStore.user
                : sessionStore.user.type} */}
            </PrimaryButton>
          )}
        </>
      ))}
    />
  );
});
