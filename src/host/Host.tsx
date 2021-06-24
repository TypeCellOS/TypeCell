/** @jsxImportSource @emotion/react */
import {
  AtlassianNavigation,
  PrimaryButton,
} from "@atlaskit/atlassian-navigation";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscSignIn } from "react-icons/vsc";
import App from "../App";
import { sessionStore, navigationStore } from "../store/local/stores";

import NewPageDialog from "./components/NewPageDialog";
import { ProfilePopup } from "./components/ProfilePopup";
import styles from "./Host.module.css";

const ProductHome = () => {
  return (
    <span style={{ fontFamily: "Open Sans, sans-serif" }}>
      🌐&nbsp;&nbsp;TypeCell
    </span>
  );
};

const AN = AtlassianNavigation as any;
const Navigation = observer(() => {
  return (
    <AN
      renderProductHome={ProductHome}
      primaryItems={[]}
      renderProfile={observer(
        () =>
          (sessionStore.isLoggedIn && (
            <ProfilePopup
              navigationStore={navigationStore}
              sessionStore={sessionStore}
            />
          )) ||
          null
      )}
      renderSignIn={observer(
        () =>
          (!sessionStore.isLoggedIn && (
            <PrimaryButton
              onClick={navigationStore.showLoginScreen}
              iconBefore={
                <VscSignIn style={{ width: "16px", height: "16px" }} />
              }>
              {" "}
              Sign in
            </PrimaryButton>
          )) ||
          null
      )}
    />
  );
});

const Host = observer(() => {
  console.log(sessionStore.user);
  return (
    <div className={styles.host}>
      <Navigation />
      {sessionStore.user === "loading" ? <div>Loading</div> : <App />}
      {sessionStore.loggedInUser && (
        <NewPageDialog
          ownerId={sessionStore.loggedInUser}
          close={navigationStore.hideNewPageDialog}
          isOpen={navigationStore.isNewPageDialogVisible}
        />
      )}
      {/* <FlagGroup>
        <>
          {notebookStore.showFreezeAlert && (
            <FreezeAlert
              onDismiss={notebookStore.dismissFreezeAlert}
              onLoadSafeMode={notebookStore.loadSafeMode}
            />
          )}
        </>
      </FlagGroup> */}
    </div>
  );
});

export default Host;

// const notebookStore = new NotebookStore(userStore);
/*
const FreezeAlert = (props: {
  onDismiss: () => void;
  onLoadSafeMode: () => void;
}) => {
  return (
    <Flag
      css={{
        zIndex: 2000,
        backgroundColor: "rgb(222, 53, 11)",
      }}
      appearance="error"
      icon={
        <VscWarning
          css={{
            width: "24px",
            height: "24px",
            padding: "2px",
          }}
        />
      }
      id="error"
      key="error"
      title="The document is not responding"
      description="It seems like your document has frozen. Perhaps there is an infinite loop in the code? 
    You can load the document in safe mode to fix any code errors."
      actions={[
        { content: "Dismiss", onClick: props.onDismiss },
        { content: "Reload in safe mode", onClick: props.onLoadSafeMode },
      ]}
    />
  );
};*/
