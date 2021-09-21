import { action, computed, makeObservable, observable, reaction } from "mobx";

import routing from "../../typecellEngine/lib/routing";
import { BaseResource } from "../BaseResource";
import { DocConnection } from "../DocConnection";
import { SessionStore } from "./SessionStore";

export class NavigationStore {
  private initialized = false;

  public isNewPageDialogVisible = false;
  public currentPage: ReturnType<typeof routing> = routing();

  public get currentDocument() {
    if (this.currentPage.page === "document") {
      const newConnection = DocConnection.load(this.currentPage.identifier);
      return newConnection;
    }
    return undefined;
  }
  constructor(private sessionStore: SessionStore) {
    // TODO: normalize initial url (e.g.: when at @UserName, redirect to @username)
    // This can be done using identifier.toRouteString()

    makeObservable(this, {
      isNewPageDialogVisible: observable,
      showNewPageDialog: action,
      hideNewPageDialog: action,

      currentDocument: computed,
      currentPage: observable.ref,
      navigateToDocument: action,
      onPopState: action,
    });
  }

  public initialize() {
    if (this.initialized) {
      throw new Error("already initialized navigationStore");
    }
    this.initialized = true;

    // hide login / register screen when logged in
    reaction(
      () =>
        (this.currentPage.page === "login" ||
          this.currentPage.page === "register") &&
        this.sessionStore.loggedInUser,
      (val) => {
        if (val) {
          const prevUrl = window.history.state?.prevUrl || "/";
          window.history.replaceState(
            {
              url: prevUrl,
            },
            "",
            prevUrl
          );
          this.currentPage = routing();
          if (
            this.currentPage.page === "login" ||
            this.currentPage.page === "register"
          ) {
            // This case might happen when user has opened browser directly to login page, and then registers?
            console.warn(
              "shouldn't happen, restored to login / register after being loggedin"
            );
            // force going to home
            window.history.replaceState(
              {
                url: "/",
              },
              "",
              "/"
            );
            this.currentPage = routing();
          }
        }
      }
    );

    reaction(
      () => !!this.sessionStore.loggedInUser,
      (val) => {
        if (!val) {
          this.isNewPageDialogVisible = false;
        }
      }
    );

    // clean up currentDocument on navigation
    reaction(
      () => this.currentDocument,
      (newVal, oldVal) => {
        if (oldVal) {
          oldVal.dispose();
        }
      }
    );

    reaction(
      () => this.currentPage.identifier?.toRouteString(),
      (newVal, oldVal) => {
        if (newVal && window.history.state?.url !== newVal) {
          window.history.pushState({ url: newVal }, "", newVal);
        }
      }
    );
    window.addEventListener("popstate", this.onPopState);
  }

  onPopState = (e: PopStateEvent) => {
    const newPage = routing();
    if (
      this.currentPage.identifier &&
      newPage.identifier?.equals(this.currentPage.identifier)
    ) {
      // only subpath has changed
      this.currentPage.identifier.subPath = newPage.identifier.subPath;
    } else {
      this.currentPage = newPage;
    }
  };

  // hideLoginScreen = () => {
  //   this.isLoginScreenVisible = false;
  // };

  showLoginScreen = () => {
    this.currentPage = {
      page: "login",
    };
    const url = "/login";
    window.history.pushState(
      {
        url,
        prevUrl:
          window.history.state?.prevUrl ||
          window.history.state?.url ||
          window.location.href,
      },
      "",
      url
    );
  };

  showRegisterScreen = () => {
    this.currentPage = {
      page: "register",
    };
    const url = "/register";
    window.history.pushState(
      {
        url,
        prevUrl:
          window.history.state?.prevUrl ||
          window.history.state?.url ||
          window.location.href,
      },
      "",
      url
    );
  };

  showForgotPassword = () => {
    this.currentPage = {
      page: "recover",
    };
    const url = "/recover";
    window.history.pushState(
      {
        url,
        prevUrl:
          window.history.state?.prevUrl ||
          window.history.state?.url ||
          window.location.href,
      },
      "",
      url
    );
  };

  showNewPageDialog = () => {
    this.isNewPageDialogVisible = true;
  };

  hideNewPageDialog = () => {
    this.isNewPageDialogVisible = false;
  };

  navigateToDocument = (doc: BaseResource) => {
    this.currentPage = {
      page: "document",
      identifier: doc.identifier,
    };
  };
}
