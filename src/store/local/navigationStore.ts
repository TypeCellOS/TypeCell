import { action, makeObservable, observable, reaction } from "mobx";

import routing from "../../typecellEngine/lib/routing";
import { BaseResource } from "../BaseResource";
import { sessionStore } from "./stores";

export class NavigationStore {
  public isNewPageDialogVisible = false;
  public currentPage: ReturnType<typeof routing> = routing();

  constructor() {
    makeObservable(this, {
      isNewPageDialogVisible: observable,
      showNewPageDialog: action,
      hideNewPageDialog: action,

      currentPage: observable.ref,
      navigateToDocument: action,
      onPopState: action,
    });

    // hide login / register screen when logged in
    reaction(
      () =>
        (this.currentPage.page === "login" ||
          this.currentPage.page === "register") &&
        sessionStore.loggedInUser,
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
        }
      }
    );

    reaction(
      () => !!sessionStore.loggedInUser,
      (val) => {
        if (!val) {
          this.isNewPageDialogVisible = false;
        }
      }
    );

    window.addEventListener("popstate", this.onPopState);
  }

  onPopState = (e: PopStateEvent) => {
    this.currentPage = routing();
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
        prevUrl: window.history.state?.prevUrl || window.history.state?.url,
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
        prevUrl: window.history.state?.prevUrl || window.history.state?.url,
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
      owner: doc.identifier.owner,
      document: doc.identifier.document,
      remainingParts: [],
    };
    const url = "/" + doc.identifier.id;
    window.history.pushState({ url }, "", url);
  };
}
