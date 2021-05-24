/** @jsxImportSource @emotion/react */
import {
  AtlassianNavigation,
  PrimaryButton,
} from "@atlaskit/atlassian-navigation";
import Flag, { FlagGroup } from "@atlaskit/flag";
import { observer } from "mobx-react-lite";
import React, { useCallback } from "react";
import { VscSignIn, VscWarning } from "react-icons/vsc";
import { authStore } from "../matrix/AuthStore";
import { navigationStore } from "../store/local/navigationStore";
import NewPageDialog from "./components/NewPageDialog";
import { ProfilePopup } from "./components/ProfilePopup";

// const notebookStore = new NotebookStore(userStore);

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
};

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
          (authStore.loggedIn && (
            <ProfilePopup
              navigationStore={navigationStore}
              authStore={authStore}
            />
          )) ||
          null
      )}
      renderSignIn={observer(
        () =>
          (!authStore.loggedIn && (
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

const Frame = observer(() => {
  //   const ref = useCallback(
  //     (el) => {
  //       if (el) {
  //         // hostLogger.log("append iframe");
  //         el.appendChild(iframe);
  //       }
  //     },
  //     [notebookStore.bridge?.iframe, notebookStore.bridge?.key]
  //   );

  //   if (notebookStore.notebook === "loading") {
  //     return <div>Loading...</div>;
  //   }
  //   if (notebookStore.notebook === "not-found") {
  //     return <div>Page not found</div>;
  //   }

  //   if (!notebookStore.bridge) {
  //     throw new Error("no bridge");
  //   }

  //   const iframe = notebookStore.bridge.iframe;
  //   if (!iframe) {
  //     return <div>Loading...</div>;
  //   }

  return (
    <div>hello</div>
    // <div
    //   style={{ display: "contents" }}
    //   key={notebookStore.bridge.key}
    //   ref={ref}
    // />
  );
});

const Host = observer(() => {
  return (
    <>
      <Navigation />
      <Frame />
      <div>
        visible: {navigationStore.isNewPageDialogVisible ? "true" : "false"}
      </div>
      <NewPageDialog
        close={navigationStore.hideNewPageDialog}
        isOpen={navigationStore.isNewPageDialogVisible}
      />
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
    </>
  );
});

export default Host;
