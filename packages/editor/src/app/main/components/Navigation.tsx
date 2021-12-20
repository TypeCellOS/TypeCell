/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */
import {
  AtlassianNavigation,
  PrimaryButton,
} from "@atlaskit/atlassian-navigation";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscSignIn } from "react-icons/vsc";
import { getStoreService } from "../../../store/local/stores";
import { ProfilePopup } from "./ProfilePopup";
import { Logo } from "./Logo";

const ProductHome = () => {
  return <Logo></Logo>;
};

const AN = AtlassianNavigation as any;

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
