/* eslint-disable jsx-a11y/anchor-is-valid */

import { AtlassianNavigation } from "@atlaskit/atlassian-navigation";
import Button from "@atlaskit/button";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { VscSignIn } from "react-icons/vsc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SessionStore } from "../../../store/local/SessionStore";
import { toDocs, toLoginScreen, toRegisterScreen } from "../../routes/routes";
import { Logo } from "./Logo";
import styles from "./Navigation.module.css";
import { ProfilePopup } from "./ProfilePopup";

const ProductHome = () => {
  return (
    <>
      <Logo></Logo>
      <span className={styles.sub}> Alpha preview</span>
      <div className={styles.separator}></div>
    </>
  );
};

export const Navigation = observer((props: { sessionStore: SessionStore }) => {
  const { sessionStore } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = sessionStore.isLoggedIn;
  const renderProfile = useCallback(() => {
    return <>{isLoggedIn && <ProfilePopup sessionStore={sessionStore} />}</>;
  }, [isLoggedIn, sessionStore]);

  return (
    <AtlassianNavigation
      label="site"
      renderProductHome={ProductHome}
      primaryItems={[
        <>
          <Link className={styles.link} to={toDocs()}>
            Documentation
          </Link>
          <a
            href="https://www.github.com/TypeCellOS/TypeCell"
            className={styles.link}
            target="_blank">
            GitHub
          </a>
        </>,
        // <PrimaryButton onClick={navigationStore.navigateToDocs}>
        //   Documentation
        // </PrimaryButton>,
      ]}
      renderProfile={renderProfile}
      // renderHelp={() => (
      //   <Link className={styles.link} to={toDocs()}>
      //     Documentation
      //   </Link>
      // )}
      renderSignIn={observer(() => (
        <>
          {!sessionStore.isLoggedIn && (
            <>
              <Button
                style={{ borderRadius: "8px" }}
                appearance="subtle"
                onClick={() =>
                  navigate(toLoginScreen(), { state: { from: location } })
                }>
                {" "}
                Log in
                {/* {typeof sessionStore.user === "string"
                ? sessionStore.user
                : sessionStore.user.type} */}
              </Button>
              <Button
                style={{ borderRadius: "8px" }}
                appearance="primary"
                onClick={() =>
                  navigate(toRegisterScreen(), { state: { from: location } })
                }
                iconBefore={
                  <VscSignIn style={{ width: "16px", height: "16px" }} />
                }>
                {" "}
                Sign up for free{" "}
                {/* {typeof sessionStore.user === "string"
                ? sessionStore.user
                : sessionStore.user.type} */}
              </Button>
            </>
          )}
        </>
      ))}
    />
  );
});
