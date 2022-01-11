/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */
import {
  AtlassianNavigation,
  PrimaryButton,
} from "@atlaskit/atlassian-navigation";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscSignIn } from "react-icons/vsc";
import { BaseResource } from "../../../store/BaseResource";
import { getStoreService } from "../../../store/local/stores";
import { UnreachableCaseError } from "../../../util/UnreachableCaseError";
import { ProfilePopup } from "./ProfilePopup";
import DocumentSettings from "./DocumentSettings";
import { Logo } from "./Logo";
import {SessionStore} from "../../../store/local/SessionStore";
import {NavigationStore} from "../../../store/local/navigationStore";
import {MatrixIdentifier} from "../../../identifiers/MatrixIdentifier";

const ProductHome = () => {
  return <Logo></Logo>;
};

const AN = AtlassianNavigation as any;

function userIsPageOwner(sessionStore: SessionStore, navigationStore: NavigationStore) {
    const id = navigationStore.currentPage.identifier as MatrixIdentifier;
    return sessionStore.loggedInUser == id.owner;
}

export const Navigation = observer(() => {
  const sessionStore = getStoreService().sessionStore;
  const navigationStore = getStoreService().navigationStore;
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
      save a copy
    </a>
  ) : (
    <a
      href=""
      onClick={(e) => {
        navigationStore.showLoginScreen();
        e.preventDefault();
        return false;
      }}>
      sign in to save a copy
    </a>
  );
  return (
    <AN
      renderProductHome={ProductHome}
      primaryItems={[]}
      renderHelp={observer(() => (
        <>
          {navigationStore.currentDocument?.needsFork && (
            <div>
              Local changes ({forkAction} /{" "}
              <a
                href=""
                onClick={(e) => {
                  navigationStore.currentDocument?.revert();
                  e.preventDefault();
                  return false;
                }}>
                revert
              </a>
              )
            </div>
          )}
        </>
      ))}
      renderSettings={observer(() => (
          <>
              {navigationStore.currentPage.page != 'root' &&
              userIsPageOwner(sessionStore, navigationStore) &&
              (<DocumentSettings user={sessionStore.loggedInUser}/>)}
          </>
      ))}
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
      renderSignIn={observer(() => (
        <>
          {!sessionStore.isLoggedIn && (
            <PrimaryButton
              onClick={navigationStore.showLoginScreen}
              iconBefore={
                <VscSignIn style={{ width: "16px", height: "16px" }} />
              }>
              {" "}
              Sign in
            </PrimaryButton>
          )}
        </>
      ))}
    />
  );
});
