import {
  action,
  computed,
  IObservableArray,
  makeObservable,
  observable,
  reaction,
} from "mobx";
import routing from "../../app/routing";
import { BaseResource } from "../BaseResource";
import { DocConnection } from "../DocConnection";
import { SessionStore } from "./SessionStore";

export class NavigationStore {
  private initialized = false;

  public isNewNotebookDialogVisible = false;
  public currentPage: ReturnType<typeof routing> = routing();

  // See MenuPortal.tsx for explanation
  public menuPortalChildren: { children: IObservableArray<any> }[] = [];

  // TODO: refactor so we don't need currentDocument. currentPage should be enough for the navigationStore.
  // currentDocument is only used by Navigation.tsx, and we can solve that using Portals. This would remove dependency on DocConnection here, which would be nice
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
      isNewNotebookDialogVisible: observable,
      showNewNotebookDialog: action,
      hideNewNotebookDialog: action,
      menuPortalChildren: observable.shallow,
      currentDocument: computed,
      currentPage: observable.ref,
      navigateToDocument: action,
      onPopState: action,
    });
  }

  public async initialize() {
    if (this.initialized) {
      throw new Error("already initialized navigationStore");
    }

    this.initialized = true;

    // hide login / register screen when logged in
    reaction(
      () =>
        (this.currentPage.page === "login" ||
          this.currentPage.page === "register") &&
        this.sessionStore.loggedInUserId,
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
      },
      // fireimmediately in case we're entering on /login or /register while already logged in (this shouldn't occur in happy flow)
      { fireImmediately: true }
    );

    reaction(
      () => !!this.sessionStore.loggedInUserId,
      (val) => {
        if (!val) {
          this.isNewNotebookDialogVisible = false;
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

  showStartScreen = () => {
    this.currentPage = {
      page: "root",
    };
    const url = "/";
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

  showProfilePage = (owner: string) => {
    this.currentPage = {
      page: "owner",
      owner,
    };
    const url = "/" + owner;
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

  showNewNotebookDialog = () => {
    this.isNewNotebookDialogVisible = true;
  };

  hideNewNotebookDialog = () => {
    this.isNewNotebookDialogVisible = false;
  };

  navigateToDocument = (doc: BaseResource) => {
    this.currentPage = {
      page: "document",
      identifier: doc.identifier,
    };
  };
}
