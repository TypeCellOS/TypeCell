/* eslint-disable jsx-a11y/anchor-is-valid */

import {
  AtlassianNavigation,
  PrimaryButton,
} from "@atlaskit/atlassian-navigation";
import { observer } from "mobx-react-lite";
import { VscSignIn } from "react-icons/vsc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStoreService } from "../../../store/local/stores";
import { toDocs, toLoginScreen } from "../../routes/routes";
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

export const Navigation = observer(() => {
  const sessionStore = getStoreService().sessionStore;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AtlassianNavigation
      label="site"
      renderProductHome={ProductHome}
      primaryItems={[
        <Link className={styles.link} to={toDocs()}>
          Documentation
        </Link>,
        // <PrimaryButton onClick={navigationStore.navigateToDocs}>
        //   Documentation
        // </PrimaryButton>,
      ]}
      renderProfile={observer(() => (
        <>
          {sessionStore.isLoggedIn && (
            <ProfilePopup sessionStore={sessionStore} />
          )}
        </>
      ))}
      renderSignIn={observer(() => (
        <>
          {!sessionStore.isLoggedIn && (
            <PrimaryButton
              onClick={() =>
                navigate(toLoginScreen(), { state: { from: location } })
              }
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
