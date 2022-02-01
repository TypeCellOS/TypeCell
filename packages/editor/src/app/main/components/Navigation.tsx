/* eslint-disable jsx-a11y/anchor-is-valid */
/** @jsxImportSource @emotion/react */
import {
  AtlassianNavigation,
  PrimaryButton,
} from "@atlaskit/atlassian-navigation";
import { observer } from "mobx-react-lite";
import { VscSignIn } from "react-icons/vsc";
import { getStoreService } from "../../../store/local/stores";
import { Logo } from "./Logo";
import { ProfilePopup } from "./ProfilePopup";
import styles from "./Navigation.module.css";

const ProductHome = () => {
  return (
    <>
      <Logo></Logo>
      <span className={styles.sub}> Alpha preview</span>
      <div className={styles.separator}></div>
    </>
  );
};

const AN = AtlassianNavigation as any;

export const Navigation = observer(() => {
  const sessionStore = getStoreService().sessionStore;
  const navigationStore = getStoreService().navigationStore;

  return (
    <AN
      renderProductHome={ProductHome}
      primaryItems={[
        <a
          href="/docs"
          className={styles.link}
          onClick={(e) => {
            e.preventDefault();
            navigationStore.navigateToDocs();
          }}>
          Documentation
        </a>,
        // <PrimaryButton onClick={navigationStore.navigateToDocs}>
        //   Documentation
        // </PrimaryButton>,
      ]}
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
